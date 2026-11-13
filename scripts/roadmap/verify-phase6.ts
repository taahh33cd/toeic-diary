/**
 * scripts/roadmap/verify-phase6.ts — kiểm chứng phần Nói/Viết.
 *
 *   npm run roadmap:verify6 -- --user <profileId>
 *
 * Kiểm đúng chỗ mới và dễ sai: bằng chứng của bài Nói/Viết đọc từ
 * `skill_submissions`. Ba điều phải đúng:
 *   1. Bản nháp RỖNG không được tính là đã làm.
 *   2. Bản nháp CÓ NỘI DUNG thì tính (học viên miễn phí không gửi chấm được,
 *      đòi "đã chấm" là họ không bao giờ xong việc nào).
 *   3. Bài nộp TRƯỚC ngày được giao không tính — cửa sổ thời gian phải chặt.
 *
 * Mọi bản ghi script tạo ra đều bị xoá ở cuối.
 */

import "../env";

import { prisma } from "../../lib/db/prisma";
import { checkEvidence } from "../../lib/roadmap/evidence";
import { CATALOG_ITEMS } from "../../lib/roadmap/catalog";
import type { EvidenceSpec } from "../../lib/roadmap/types";

const args = process.argv.slice(2);
const userId = args[args.indexOf("--user") + 1];
if (!args.includes("--user") || !userId) {
  console.error("Thiếu --user <profileId>");
  process.exit(1);
}

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`   ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { id: true } });
  if (!profile) {
    console.error(`Không tìm thấy hồ sơ ${userId}`);
    process.exit(1);
  }

  console.log("\n━━ Catalog Nói/Viết ━━");
  const sw = CATALOG_ITEMS.filter((i) => i.kind === "submission");
  const speaking = sw.filter((i) => i.skill === "speaking");
  const writing = sw.filter((i) => i.skill === "writing");
  check("có mục Nói", speaking.length > 0, `${speaking.length} mục`);
  check("có mục Viết", writing.length > 0, `${writing.length} mục`);
  check("mục Viết đều giao lại được", writing.every((i) => i.repeatable === true));
  check(
    "mục Nói đều có slug bộ đề",
    speaking.every(
      (i) => (i.evidence as Extract<EvidenceSpec, { source: "submission" }>).testKey,
    ),
  );
  check("không mục nào gắn part L&R", sw.every((i) => i.parts.length === 0));

  const item = writing[0];
  const spec = item.evidence as Extract<EvidenceSpec, { source: "submission" }>;
  const created: string[] = [];

  try {
    console.log(`\n━━ Bằng chứng cho "${item.title}" ━━`);
    // Mốc là LÚC CHẠY SCRIPT, không phải "một giờ trước": tài khoản thử nghiệm
    // có thể đã có bài Viết nộp từ trước (và thực tế là có), khi đó khẳng định
    // "chưa nộp gì" sai ngay từ đầu mà code thì vẫn đúng.
    const since = new Date();
    await new Promise((r) => setTimeout(r, 1100));

    check("chưa nộp gì thì chưa xong", (await checkEvidence(userId, spec, since)) === null);

    // 1. Bản nháp rỗng — không được tính.
    const empty = await prisma.skillSubmission.create({
      data: {
        userId,
        skill: spec.skill,
        unit: spec.unit,
        testKey: "verify6",
        title: "verify6 rỗng",
        status: "draft",
        items: [{ idx: 0, prompt: "x", text: "   " }],
      },
    });
    created.push(empty.id);
    check("bản nháp rỗng không tính là đã làm", (await checkEvidence(userId, spec, since)) === null);

    // 2. Bản nháp có nội dung — phải tính.
    const real = await prisma.skillSubmission.create({
      data: {
        userId,
        skill: spec.skill,
        unit: spec.unit,
        testKey: "verify6",
        title: "verify6 có bài",
        status: "draft",
        items: [{ idx: 0, prompt: "x", text: "The man is reading a book at the table." }],
      },
    });
    created.push(real.id);
    const proof = await checkEvidence(userId, spec, since);
    check("bản nháp có nội dung thì tính là đã làm", proof !== null);
    check("bằng chứng trỏ đúng bài", proof?.refId === real.id, proof?.refId);
    check("bằng chứng ghi đúng nguồn", proof?.source === "submission");

    // 3. Cửa sổ thời gian: hỏi từ một mốc SAU khi nộp thì không được tính.
    const future = new Date(Date.now() + 60 * 60 * 1000);
    check(
      "bài nộp trước ngày giao không tính",
      (await checkEvidence(userId, spec, future)) === null,
    );

    // 4. Bài của unit khác không được tính nhầm.
    const otherUnit = writing.find((w) => w.id !== item.id);
    if (otherUnit) {
      const otherSpec = otherUnit.evidence as Extract<EvidenceSpec, { source: "submission" }>;
      check(
        "bài của dạng câu khác không tính nhầm",
        (await checkEvidence(userId, otherSpec, since)) === null,
        otherSpec.unit,
      );
    }
  } finally {
    if (created.length) {
      await prisma.skillSubmission.deleteMany({ where: { id: { in: created } } });
      console.log(`\n   (đã xoá ${created.length} bài nộp thử)`);
    }
  }

  console.log("");
  if (failures) {
    console.error(`✗ ${failures} khẳng định sai.`);
    process.exit(1);
  }
  console.log("✓ Mọi khẳng định đều đúng.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
