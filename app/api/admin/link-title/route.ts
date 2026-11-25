import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse, type NextRequest } from "next/server";

import { requireGrader } from "@/lib/submissions/guard";

export const runtime = "nodejs";

/**
 * GET /api/admin/link-title?url=… — lấy tiêu đề của một link để giáo viên khỏi
 * gõ tên bài khi dán link vào BTVN.
 *
 * YouTube đi qua oEmbed (trang YouTube trả HTML rất nặng, tiêu đề lại chèn bằng
 * JS). Trang khác: đọc tối đa 300KB đầu, lấy og:title rồi tới <title>.
 *
 * Route chỉ mở cho giáo viên, nhưng vẫn chặn địa chỉ nội bộ (localhost, IP
 * riêng) và tự theo redirect có kiểm từng bước — server không được thành cửa
 * ngõ gọi vào mạng nội bộ.
 */

const MAX_BYTES = 300_000;
const TIMEOUT_MS = 5000;

function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? privateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

async function safeUrl(raw: string): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  try {
    const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (addrs.length === 0 || addrs.some((a) => privateIp(a.address))) return null;
  } catch {
    return null;
  }
  return u;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function pickTitle(html: string): string | null {
  const og =
    html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (og?.[1]) return decodeEntities(og[1]);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t?.[1] ? decodeEntities(t[1]) || null : null;
}

async function fetchLimited(start: URL): Promise<{ html: string; finalUrl: URL } | null> {
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)", Accept: "text/html" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      const next = await safeUrl(new URL(loc, url).toString());
      if (!next) return null;
      url = next;
      continue;
    }
    if (!res.ok || !res.body) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return { html: "", finalUrl: url };

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    reader.cancel().catch(() => {});
    const buf = new Uint8Array(size);
    let off = 0;
    for (const c of chunks) {
      buf.set(c.subarray(0, Math.min(c.byteLength, size - off)), off);
      off += c.byteLength;
    }
    return { html: new TextDecoder("utf-8").decode(buf), finalUrl: url };
  }
  return null;
}

function isYouTube(u: URL): boolean {
  return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname);
}

export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const raw = req.nextUrl.searchParams.get("url") ?? "";
  const url = await safeUrl(raw);
  if (!url) return NextResponse.json({ title: null, error: "Link không hợp lệ" }, { status: 400 });

  try {
    if (isYouTube(url)) {
      const o = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`,
        { signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      if (o.ok) {
        const j = (await o.json()) as { title?: string };
        if (j.title) return NextResponse.json({ title: `YouTube: ${j.title}`, site: "YouTube" });
      }
    }

    const got = await fetchLimited(url);
    const title = got ? pickTitle(got.html) : null;
    return NextResponse.json({ title, site: url.hostname.replace(/^www\./, "") });
  } catch {
    return NextResponse.json({ title: null, site: url.hostname.replace(/^www\./, "") });
  }
}
