// Lấy audio bài nói về dưới định dạng từng dịch vụ nhận được.
//
// Học viên ghi âm bằng MediaRecorder nên file trên Cloudinary là webm/opus,
// còn Azure chỉ nhận WAV PCM 16kHz mono (hoặc ogg-opus). Vercel không có
// ffmpeg, nhưng Cloudinary chuyển mã ngay trên URL: thêm `af_16000` và đổi đuôi
// thành `.wav` là ra đúng WAV 1 kênh 16kHz 16bit — đã đo trên file thật.
//
// Gemini thì nhận ogg, nhỏ hơn WAV khoảng 4 lần nên gửi ogg cho đỡ tốn.

/** Chỉ nhận URL Cloudinary — đây là nơi duy nhất bài nói được lưu. */
function isCloudinary(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//.test(url);
}

/** URL bản WAV PCM 16kHz mono do Cloudinary chuyển mã. */
export function wavUrl(audioUrl: string): string | null {
  if (!isCloudinary(audioUrl)) return null;
  return audioUrl.replace("/upload/", "/upload/af_16000/").replace(/\.[a-z0-9]+$/i, ".wav");
}

/** URL bản ogg-opus (nhẹ) để gửi cho Gemini. */
export function oggUrl(audioUrl: string): string | null {
  if (!isCloudinary(audioUrl)) return null;
  return audioUrl.replace(/\.[a-z0-9]+$/i, ".ogg");
}

/** Chặn file lạ cỡ lớn: 45 giây WAV 16kHz mono chỉ khoảng 1.4MB. */
const MAX_BYTES = 12 * 1024 * 1024;

export async function fetchAudio(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được audio (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("File audio quá lớn");
  return buf;
}

/**
 * Độ dài bài nói, tính từ header WAV.
 * Cần tự tính vì bản nộp không lưu `durationSec` — mà tỉ lệ dùng hết thời gian
 * là một dữ kiện quan trọng khi chấm Speaking.
 */
/**
 * Độ dài bài nói mà không phải tải cả file: hỏi Cloudinary độ lớn bản WAV
 * 16kHz mono rồi chia ra. Cần cho nhánh Gemini (chỉ tải ogg) vì tỉ lệ dùng hết
 * thời gian là dữ kiện khi chấm, mà bản nộp không lưu `durationSec`.
 */
export async function durationFromWavHead(url: string): Promise<number | null> {
  // Lần đầu hỏi một bản chuyển mã chưa tồn tại, Cloudinary mới bắt đầu tạo và
  // trả lỗi; thử lại một lần là có. Đã gặp đúng ca này khi đo trên file thật.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      const len = Number(res.headers.get("content-length"));
      if (res.ok && Number.isFinite(len) && len > 44) {
        // WAV PCM 16kHz, 1 kênh, 16 bit = 32000 byte mỗi giây.
        return Math.round(((len - 44) / 32000) * 10) / 10;
      }
    } catch {
      // thử lại
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

export function wavDurationSec(buf: Buffer): number | null {
  if (buf.length < 44 || buf.subarray(0, 4).toString("ascii") !== "RIFF") return null;
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  const bits = buf.readUInt16LE(34);
  const bytesPerSec = (rate * channels * bits) / 8;
  if (!bytesPerSec) return null;
  // Trừ 44 byte header; sai số dưới một phần nghìn giây, không đáng kể.
  return Math.round(((buf.length - 44) / bytesPerSec) * 10) / 10;
}
