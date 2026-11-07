/**
 * Lưới an toàn cho khoảng audio của từng câu dictation.
 *
 * Vì sao cần: timestamp trong DB do WhisperX căn tự động nên có chỗ sai. Trong
 * EST 2026 + EST 2024 có 13 câu còn start_time = end_time = 0, và ~88 câu có
 * khoảng audio ngắn hơn cả nhịp đọc chậm nhất (ví dụ Part 1 Test 1 câu 5 đáp án
 * C: 10 từ chỉ được 1.57 giây, lại còn chồng lên đáp án D). Trình phát cắt đúng
 * tại end_time nên học viên nghe không hết câu, và câu thiếu timestamp thì
 * replay nhảy về đầu file chứ không về câu đang luyện.
 *
 * Cách chữa: với câu có timestamp đáng tin thì dùng y nguyên. Với câu bất
 * thường thì nới khoảng phát đủ một nhịp đọc, nhưng chỉ trong vùng [hết câu
 * trước, đầu câu sau] — vùng duy nhất mà câu đó có thể nằm.
 *
 * Số liệu ngưỡng đo từ 4.684 câu có timestamp hợp lệ của hai bộ đề:
 * p1 = 0.202, p5 = 0.252, p25 = 0.320, trung vị = 0.399 giây/từ.
 */

/** Bù trước câu để không cụt từ đầu. */
export const LEAD_IN = 0.2;

/** Bù sau câu trước khi coi là đã phát hết. */
export const TAIL_PAD = 0.5;

/** Dưới mức này thì timestamp chắc chắn sai (thấp hơn cả phân vị 1%). */
const SUSPECT_SEC_PER_WORD = 0.22;

/** Độ dài đặt lại khi phải chữa, lấy theo phân vị 25%. */
const REPAIR_SEC_PER_WORD = 0.32;

export interface SegmentInput {
  content: string;
  startTime: number;
  endTime: number;
}

export interface SegmentWindow {
  /** Thời điểm bắt đầu phát. */
  start: number;
  /** Thời điểm coi là hết câu. `Infinity` = phát tới hết file, không tự cắt. */
  end: number;
  /** true khi khoảng phát do lưới an toàn suy ra, không phải lấy từ DB. */
  repaired: boolean;
}

function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Suy ra khoảng phát cho từng câu của một bài.
 * `audioDuration` <= 0 nghĩa là chưa biết độ dài file.
 */
export function buildSegmentWindows(
  sentences: SegmentInput[],
  audioDuration: number
): SegmentWindow[] {
  const n = sentences.length;
  const hasDuration = audioDuration > 0;

  // Mốc chặn dưới: thời điểm muộn nhất mà các câu TRƯỚC đã dùng tới.
  const floorAt: number[] = new Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    floorAt[i] = last;
    const s = sentences[i];
    if (s.endTime > 0) last = Math.max(last, s.endTime);
    else if (s.startTime > 0) last = Math.max(last, s.startTime);
  }

  // Mốc lùi xa nhất: chỗ câu TRƯỚC bắt đầu. Không dùng end_time câu trước vì
  // script import đệm +0.4s nên end_time đó thường đã vượt qua start_time câu
  // này — lấy nó làm sàn thì không lùi lại được chút nào.
  const prevStartAt: number[] = new Array(n);
  let prevStart = 0;
  for (let i = 0; i < n; i++) {
    prevStartAt[i] = prevStart;
    const s = sentences[i];
    if (s.startTime > 0) prevStart = Math.max(prevStart, s.startTime);
  }

  // Mốc chặn trên: thời điểm sớm nhất mà các câu SAU bắt đầu dùng.
  const ceilAt: number[] = new Array(n);
  let next = hasDuration ? audioDuration : Infinity;
  for (let i = n - 1; i >= 0; i--) {
    ceilAt[i] = next;
    const s = sentences[i];
    if (s.startTime > 0) next = Math.min(next, s.startTime);
    else if (s.endTime > 0) next = Math.min(next, s.endTime);
  }

  const windows: SegmentWindow[] = [];

  for (let i = 0; i < n; i++) {
    const s = sentences[i];
    const words = wordCount(s.content);

    // start theo DB; câu thiếu start_time thì nối tiếp câu trước, không về 0
    let stampedStart =
      s.startTime > 0 ? Math.max(0, s.startTime - LEAD_IN) : (i > 0 ? floorAt[i] : 0);

    const floor = Math.max(0, Math.min(prevStartAt[i], stampedStart));
    const fileEnd = hasDuration ? audioDuration : Infinity;

    // Mốc chặn trên, CHỈ dùng khi phải chữa. Không kẹp câu có timestamp tốt:
    // script import cố tình đệm ±0.4s nên mốc hai câu liền kề vẫn chồng nhau,
    // kẹp vào đây sẽ cắt ngắn cả những câu đang đúng.
    // Có bài timestamp đảo thứ tự (câu sau bắt đầu trước câu này) — khi đó mốc
    // câu sau vô nghĩa, chỉ giữ độ dài file.
    let ceiling = Math.min(ceilAt[i], fileEnd);
    if (!(ceiling > stampedStart)) ceiling = fileEnd;
    // Cả stamp nằm ngoài file → mốc bắt đầu cũng không dùng được
    if (!(ceiling > stampedStart)) { stampedStart = floor; ceiling = fileEnd; }
    if (!(ceiling > stampedStart)) ceiling = Infinity;

    // Kẹp theo độ dài file TRƯỚC khi xét nghi vấn: có câu stamp vượt ra ngoài
    // file nên khoảng nghe thật ngắn hơn nhiều so với con số trong DB.
    const stampedEnd = s.endTime > stampedStart ? Math.min(s.endTime, fileEnd) : -1;
    const available = stampedEnd > 0 ? stampedEnd - stampedStart : -1;
    const suspect = stampedEnd < 0 || available < words * SUSPECT_SEC_PER_WORD;

    let start = stampedStart;
    let end = stampedEnd > 0 ? stampedEnd : ceiling;

    if (suspect) {
      const needed = words * REPAIR_SEC_PER_WORD;
      // Nới về phía sau trước, chỉ tới sát câu kế tiếp
      end = Math.min(ceiling, Math.max(stampedEnd, stampedStart + needed));
      // Còn thiếu thì lùi điểm bắt đầu, chỉ tới chỗ câu trước dừng
      start = Number.isFinite(end)
        ? Math.max(floor, Math.min(stampedStart, end - needed))
        : stampedStart;
    }

    // Bất biến: lưới an toàn chỉ được NỚI khoảng nghe, không bao giờ làm ngắn
    // lại. Có bài WhisperX dồn mấy câu cuối vào 2 giây cuối file; ở đó mốc câu
    // sau chặn mất phần nới nên kết quả còn ngắn hơn ban đầu — giữ nguyên DB.
    if (stampedEnd > 0 && end - start < stampedEnd - stampedStart) {
      start = stampedStart;
      end = stampedEnd;
    }

    // Dữ liệu quá hỏng để suy ra khoảng phát → thà phát tới hết file còn hơn cắt sai
    if (!(end > start)) {
      start = floor;
      end = Infinity;
    }

    windows.push({
      start,
      end,
      repaired: start !== stampedStart || end !== stampedEnd,
    });
  }

  return windows;
}
