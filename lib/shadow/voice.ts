// Phân tích bản ghi giọng học viên ngay trên trình duyệt, không gọi API:
//   - thời lượng có tiếng nói (để chống lách: ghi rồi im lặng)
//   - đường cao độ (F0) để vẽ chồng lên đường ngữ điệu mẫu

export interface PitchPoint {
  /** Thời điểm tính từ đầu bản ghi (giây). */
  t: number;
  hz: number;
}

export interface VoiceAnalysis {
  durationSec: number;
  voicedSec: number;
  /** Khoảng [đầu, cuối] có tiếng nói, để căn đường cao độ. */
  speechStart: number;
  speechEnd: number;
  pitch: PitchPoint[];
}

const FRAME_SEC = 0.03;
const MIN_HZ = 70;
const MAX_HZ = 400;

/** Câu đạt khi phần có tiếng nói ≥ 50% độ dài câu gốc (docs/shadow-spec.md). */
export const VOICED_RATIO_TO_PASS = 0.5;

export function passesVoiceCheck(a: VoiceAnalysis, referenceSec: number): boolean {
  return referenceSec > 0 && a.voicedSec >= VOICED_RATIO_TO_PASS * referenceSec;
}

function rms(buf: Float32Array, from: number, len: number): number {
  let s = 0;
  for (let i = from; i < from + len; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / len);
}

/** Cao độ một khung bằng tự tương quan chuẩn hóa; null nếu không đủ tuần hoàn. */
function framePitch(buf: Float32Array, from: number, len: number, sr: number): number | null {
  const minLag = Math.floor(sr / MAX_HZ);
  const maxLag = Math.min(Math.floor(sr / MIN_HZ), len - 1);
  let bestLag = -1;
  let best = 0;
  let e0 = 0;
  for (let i = from; i < from + len; i++) e0 += buf[i] * buf[i];
  if (e0 === 0) return null;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    let e1 = 0;
    for (let i = from; i < from + len - lag; i++) {
      c += buf[i] * buf[i + lag];
      e1 += buf[i + lag] * buf[i + lag];
    }
    const r = c / Math.sqrt(e0 * e1 || 1);
    if (r > best) { best = r; bestLag = lag; }
  }
  return best > 0.6 && bestLag > 0 ? sr / bestLag : null;
}

export function analyzeSamples(samples: Float32Array, sampleRate: number): VoiceAnalysis {
  const frame = Math.max(1, Math.floor(FRAME_SEC * sampleRate));
  const frames = Math.floor(samples.length / frame);
  const levels: number[] = [];
  for (let f = 0; f < frames; f++) levels.push(rms(samples, f * frame, frame));

  // Ngưỡng tiếng nói: gấp 3 nền ồn (phân vị 10%), tối thiểu 0.01.
  const sorted = [...levels].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const threshold = Math.max(0.01, floor * 3);

  let voicedFrames = 0;
  let first = -1;
  let last = -1;
  const pitch: PitchPoint[] = [];
  // Cao độ chỉ cần ~100 điểm/giây chia đôi; tính trên khung dài gấp đôi cho ổn định.
  const pitchLen = Math.min(frame * 2, samples.length);
  for (let f = 0; f < frames; f++) {
    if (levels[f] < threshold) continue;
    voicedFrames++;
    if (first === -1) first = f;
    last = f;
    const from = f * frame;
    if (from + pitchLen <= samples.length) {
      const hz = framePitch(samples, from, pitchLen, sampleRate);
      if (hz) pitch.push({ t: from / sampleRate, hz });
    }
  }

  return {
    durationSec: samples.length / sampleRate,
    voicedSec: voicedFrames * FRAME_SEC,
    speechStart: first === -1 ? 0 : first * FRAME_SEC,
    speechEnd: last === -1 ? 0 : (last + 1) * FRAME_SEC,
    pitch: smoothPitch(pitch),
  };
}

/** Bỏ điểm nhảy quãng tám và làm mượt trung vị 5 điểm. */
function smoothPitch(points: PitchPoint[]): PitchPoint[] {
  if (points.length < 3) return points;
  const med = [...points].map((p) => p.hz).sort((a, b) => a - b)[Math.floor(points.length / 2)];
  const kept = points.filter((p) => p.hz > med * 0.55 && p.hz < med * 1.8);
  return kept.map((p, i) => {
    const win = kept.slice(Math.max(0, i - 2), i + 3).map((q) => q.hz).sort((a, b) => a - b);
    return { t: p.t, hz: win[Math.floor(win.length / 2)] };
  });
}

/** Giải mã blob ghi âm rồi phân tích. Trả null nếu trình duyệt không giải mã được. */
export async function analyzeBlob(blob: Blob): Promise<VoiceAnalysis | null> {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    try {
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      // Hạ mẫu xuống ~16 kHz cho nhanh: chỉ cần tới 400 Hz.
      const step = Math.max(1, Math.floor(buf.sampleRate / 16000));
      const src = buf.getChannelData(0);
      const out = new Float32Array(Math.floor(src.length / step));
      for (let i = 0; i < out.length; i++) out[i] = src[i * step];
      return analyzeSamples(out, buf.sampleRate / step);
    } finally {
      ctx.close().catch(() => {});
    }
  } catch {
    return null;
  }
}
