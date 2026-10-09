// Chuyển bản thu của MediaRecorder sang WAV PCM 16kHz mono — định dạng duy nhất
// mà endpoint Pronunciation Assessment của Azure nhận.

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataSize = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const s = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
  };
  s(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  s(8, "WAVE");
  s(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  s(36, "data");
  v.setUint32(40, dataSize, true);
  let off = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    v.setInt16(off, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    off += 2;
  }
  return buf;
}

export async function blobToWav(blob: Blob): Promise<Blob> {
  const raw = await blob.arrayBuffer();
  const decodeCtx = new AudioContext();
  const decoded = await decodeCtx.decodeAudioData(raw);
  await decodeCtx.close();

  const TARGET_RATE = 16000;
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * TARGET_RATE),
    TARGET_RATE
  );
  const src = offlineCtx.createBufferSource();
  src.buffer = decoded;
  src.connect(offlineCtx.destination);
  src.start(0);
  const resampled = await offlineCtx.startRendering();
  return new Blob([encodeWav(resampled.getChannelData(0), TARGET_RATE)], { type: "audio/wav" });
}
