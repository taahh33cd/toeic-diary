"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playWord } from "@/lib/vocab/audio";
import {
  chamGo,
  demKhoetDuoc,
  laDangGo,
  laDienTu,
  sinhCauHoi,
  QUIZ_TYPES,
  type CauHoi,
  type QuizType,
} from "@/lib/vocab/quiz";
import { O_TRONG } from "@/lib/vocab/cloze";
import { speedThresholdFor } from "@/lib/vocab/srs";
import { guiHoacXepHang } from "@/lib/vocab/offline-queue";
import { listWordForms, reportWordForm, type CardRow, type ProgressRow, type WordFormRow } from "@/lib/vocab/client";

/**
 * Thời lượng bài thi, tính từ chính ngưỡng tốc độ SRS đã hiệu chỉnh.
 *
 * Hệ số 2 vì ngưỡng kia là mốc "nhanh hay chậm", không phải "đủ để làm xong":
 * bắt làm đúng ngưỡng thì câu nào cũng thành chạy đua. Dạng gõ và dạng điền
 * từ tự được nhiều thời gian hơn vì ngưỡng của chúng vốn đã cao hơn.
 */
function thoiLuongMs(ds: { type: QuizType }[]): number {
  return ds.reduce((a, c) => a + speedThresholdFor(c.type), 0) * 2;
}

function dongHo(giay: number): string {
  const p = Math.floor(giay / 60);
  return `${p}:${String(giay % 60).padStart(2, "0")}`;
}

const GREEN = "var(--accent-green, #4A7C59)";
const RED = "var(--accent-red, #B94040)";

interface KetQua {
  word: string;
  quizType: string;
  correct: boolean;
  /**
   * Thời gian nghĩ LẦN ĐẦU, không tính các lần quay lại sửa.
   *
   * SRS dùng số này để quyết có giãn khoảng ôn hay không. Chế độ thi cho đi
   * tới đi lui, nên nếu đo cả lần sửa thì một câu xem lướt qua ba lần sẽ
   * thành "trả lời chậm" và bị cắt giãn oan.
   */
  answerMs: number;
  given?: string;
  /** Phương án đã chọn — để quay lại câu cũ còn tô lại đúng chỗ. */
  chonId: string;
}

export default function QuizRunner({
  deckId,
  title,
  cards,
  progress,
  onExit,
}: {
  deckId: string;
  title: string;
  cards: CardRow[];
  progress: ProgressRow[];
  onExit: () => void;
}) {
  const [modes, setModes] = useState<QuizType[]>(["word-to-meaning", "meaning-to-typing"]);
  const [chiDenHan, setChiDenHan] = useState(false);
  const [cheDoThi, setCheDoThi] = useState(false);
  const [batDau, setBatDau] = useState(false);
  /** Giây còn lại; null = không bấm giờ (chế độ luyện tập). */
  const [conLai, setConLai] = useState<number | null>(null);

  const [cauHoi, setCauHoi] = useState<CauHoi[]>([]);
  const [boQua, setBoQua] = useState({ thieuAnh: 0, thieuNghia: 0, thieuViDu: 0, thieuDangTu: 0 });
  const [dangTu, setDangTu] = useState<WordFormRow[]>([]);
  // Khoá dạng này trong lúc tải, và nói rõ là ĐANG TẢI chứ không phải "chưa
  // soạn" — nhãn sai làm học viên tưởng bộ thẻ của mình không có câu nào.
  const [taiDangTu, setTaiDangTu] = useState(true);
  const [daBao, setDaBao] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [nhap, setNhap] = useState("");
  /**
   * Trả lời của TỪNG CÂU theo chỉ số, không phải danh sách push dần.
   *
   * Chế độ thi cho quay lại sửa, nên "câu vừa trả lời" không còn là phần tử
   * cuối mảng. Trước đây màn phản hồi đọc ketQua[ketQua.length - 1]; chỉ đúng
   * khi đi một chiều, sửa câu cũ là hiện nhầm kết quả của câu khác.
   */
  const [ketQua, setKetQua] = useState<(KetQua | null)[]>([]);
  const [xong, setXong] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  /** Mạng hỏng nên kết quả đang nằm chờ, khác hẳn mất hẳn — phải nói khác. */
  const [choGui, setChoGui] = useState(false);
  const [tomTat, setTomTat] = useState<{ correct: number; total: number; percent: number } | null>(null);

  const batDauCau = useRef(Date.now());
  const batDauPhien = useRef(Date.now());
  /** Mốc hết giờ (timestamp); null = không bấm giờ. */
  const hanChot = useRef<number | null>(null);
  /**
   * Bản sao bài làm cho những chỗ gọi ngoài vòng render — cụ thể là đồng hồ
   * hết giờ, vốn chỉ thấy ketQua của lần render nó được tạo ra.
   */
  const ketQuaRef = useRef<(KetQua | null)[]>([]);
  /** Chặn nộp hai lần — hết giờ và bấm Nộp có thể xảy ra sát nhau. */
  const daNop = useRef(false);
  const oNhap = useRef<HTMLInputElement>(null);

  // Bộ phương án "chọn dạng từ" do AI soạn sẵn, nằm ở server chứ không trên
  // thẻ. Tải một lần; hỏng thì chỉ mất dạng đó, các dạng khác vẫn chạy.
  useEffect(() => {
    let huy = false;
    listWordForms(deckId)
      .then((r) => {
        if (!huy) setDangTu(r.forms);
      })
      .catch(() => {})
      .finally(() => {
        if (!huy) setTaiDangTu(false);
      });
    return () => {
      huy = true;
    };
  }, [deckId]);

  useEffect(() => {
    ketQuaRef.current = ketQua;
  }, [ketQua]);

  const coAnh = useMemo(() => cards.filter((c) => c.imageUrl).length, [cards]);
  // Đếm thẻ KHOÉT ĐƯỢC, không phải thẻ có ví dụ: câu ví dụ không chứa từ, hay
  // quá ngắn, thì vẫn không ra được câu điền từ.
  const coViDu = useMemo(() => demKhoetDuoc(cards), [cards]);

  const cau = cauHoi[idx];
  const traLoiCau = ketQua[idx] ?? null;
  const daChon = traLoiCau?.chonId ?? null;
  const daTraLoi = daChon !== null;
  /** Chế độ thi giấu đúng/sai tới cuối lượt — đó là điểm khác duy nhất khi làm. */
  const hienPhanHoi = daTraLoi && !cheDoThi;
  const daLam = ketQua.filter(Boolean).length;

  const gui = useCallback(
    async (thua: (KetQua | null)[], thi: boolean) => {
      // Câu chưa trả lời (hết giờ, hoặc nộp sớm) không gửi lên: bỏ trống khác
      // hẳn trả lời sai, tính thành sai là bịa ra lỗi học viên chưa hề mắc.
      const ds = thua.filter((x): x is KetQua => x !== null);
      if (ds.length === 0) {
        onExit();
        return;
      }
      setDangGui(true);
      try {
        // Mạng hỏng thì xếp hàng chứ đừng vứt: học viên vừa làm xong 18 câu,
        // mất trắng vì 4G chập chờn là mất mát thật chứ không phải ca hiếm.
        const { ket, daXepHang } = await guiHoacXepHang<{
          correct?: number;
          total?: number;
          percent?: number;
        }>("/api/flashcards/sessions", {
          deckId,
          modes,
          runMode: thi ? "exam" : "practice",
          durationMs: Date.now() - batDauPhien.current,
          items: ds,
        });
        if (daXepHang || !ket) {
          setChoGui(true);
          return;
        }
        setTomTat({ correct: ket.correct ?? 0, total: ket.total ?? ds.length, percent: ket.percent ?? 0 });
        window.dispatchEvent(new Event("vocab:reviewed"));
      } catch (e) {
        setLoi(e instanceof Error ? e.message : "Không lưu được kết quả");
      } finally {
        setDangGui(false);
      }
    },
    [deckId, modes, onExit]
  );

  /**
   * Nộp bài và kết thúc — dùng chung cho nộp tay, làm hết câu, và hết giờ.
   *
   * Đọc bài làm qua ref chứ không gọi gui() trong updater của setKetQua:
   * StrictMode chạy updater hai lần, gửi kết quả lên server thành hai lượt.
   */
  const nop = useCallback(() => {
    if (daNop.current) return;
    daNop.current = true;
    setXong(true);
    setConLai(null);
    gui(ketQuaRef.current, cheDoThi);
  }, [gui, cheDoThi]);

  function traLoi(dung: boolean, chonId: string, given?: string) {
    if (!cau) return;
    // Luyện tập: trả lời rồi là chốt, hiện đáp án luôn. Thi: sửa được tới khi nộp.
    if (daTraLoi && !cheDoThi) return;
    const cu = ketQua[idx];
    setKetQua((r) => {
      const moi = [...r];
      moi[idx] = {
        word: cau.word,
        quizType: cau.type,
        correct: dung,
        // Giữ nguyên thời gian lần đầu khi sửa lại — xem bình luận ở KetQua
        answerMs: cu ? cu.answerMs : Date.now() - batDauCau.current,
        given,
        chonId,
      };
      return moi;
    });
  }

  /** Nhảy tới câu bất kỳ, khôi phục đúng những gì đã gõ ở câu đó. */
  function toiCau(n: number) {
    if (n === idx || n < 0 || n >= cauHoi.length) return;
    // Rời một câu gõ dở mà chưa bấm "Ghi câu trả lời" thì ghi hộ. Chế độ thi
    // cho đi tới đi lui, không ghi là học viên gõ xong, bấm số câu khác, quay
    // về thấy trống trơn — mất bài mà không hiểu vì sao.
    if (cheDoThi && cau && laDangGo(cau.type)) {
      const go = nhap.trim();
      if (go && go !== ketQua[idx]?.given) traLoi(chamGo(go, cau.dapAn), "typed", go);
    }
    setIdx(n);
    setNhap(ketQua[n]?.given ?? "");
    batDauCau.current = Date.now();
  }

  /**
   * Học viên báo câu hỏi sai.
   *
   * Chỉ có ở dạng chọn dạng từ — dạng duy nhất do AI soạn, không có luật nào
   * chặn được câu hai đáp án ("a business luncheon/lunch"). Báo xong bỏ qua
   * câu luôn, KHÔNG tính vào kết quả: câu hỏi hỏng thì trả lời kiểu gì cũng
   * không nói lên điều gì về học viên.
   */
  async function bao() {
    if (!cau?.formId || daBao.has(cau.formId)) return;
    const id = cau.formId;
    setDaBao((s) => new Set(s).add(id));
    // Xoá luôn câu trả lời nếu đã lỡ trả lời trước khi phát hiện câu sai —
    // không xoá thì câu hỏng vẫn được gửi lên và vẫn đẩy SRS của từ đó.
    setKetQua((r) => {
      if (!r[idx]) return r;
      const moi = [...r];
      moi[idx] = null;
      return moi;
    });
    try {
      await reportWordForm(id);
    } catch {
      // Báo hụt thì thôi, không chặn học viên làm tiếp
    }
    // Ở câu cuối của chế độ thi, tiep() cố ý không nộp (còn phải soát bài),
    // nên lùi lại một câu để học viên không đứng nguyên tại câu vừa bỏ.
    if (cheDoThi && idx + 1 >= cauHoi.length) toiCau(idx - 1);
    else tiep();
  }

  function tiep() {
    // Chế độ thi: tới câu cuối vẫn chưa nộp, học viên còn muốn soát lại
    if (idx + 1 >= cauHoi.length) {
      if (!cheDoThi) nop();
      return;
    }
    toiCau(idx + 1);
  }

  /**
   * Đồng hồ chế độ thi.
   *
   * Đếm theo MỐC HẾT GIỜ tuyệt đối chứ không trừ dần mỗi nhịp: tab bị ẩn thì
   * trình duyệt bóp setInterval xuống còn vài nhịp một phút, trừ dần sẽ thành
   * ra học viên được thêm thời gian chỉ vì chuyển sang tab khác.
   */
  useEffect(() => {
    if (!batDau || !cheDoThi || xong) return;
    const het = hanChot.current;
    if (het === null) return;
    const nhip = () => {
      const giay = Math.max(0, Math.round((het - Date.now()) / 1000));
      setConLai(giay);
      if (giay === 0) nop();
    };
    nhip();
    const t = setInterval(nhip, 1000);
    return () => clearInterval(t);
  }, [batDau, cheDoThi, xong, nop]);

  // Dạng nghe thì phát ngay khi câu hiện ra, khỏi bắt bấm thêm một nút
  useEffect(() => {
    if (!batDau || !cau) return;
    if (cau.de.nghe) playWord(cau.word);
    if (laDangGo(cau.type)) setTimeout(() => oNhap.current?.focus(), 80);
  }, [batDau, cau]);

  // ── Màn chọn dạng ──
  if (!batDau) {
    const thu = sinhCauHoi(cards, progress, { modes, chiDenHan }, dangTu);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }} className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="text-sm px-2 py-1 rounded-lg"
            style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>←</button>
          <div>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Quiz · {title}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {cards.length} thẻ · {coAnh} thẻ có ảnh
            </p>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>CHỌN DẠNG CÂU HỎI</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            {QUIZ_TYPES.map((t) => {
              const chon = modes.includes(t.id);
              const khoa =
                (t.canAnh && coAnh < 4) ||
                (t.canViDu && coViDu === 0) ||
                (t.canDangTu && (taiDangTu || dangTu.length === 0));
              const viSao = t.canAnh && coAnh < 4
                ? "Cần ít nhất 4 thẻ có ảnh"
                : t.canViDu && coViDu === 0
                  ? "Cần thẻ có câu ví dụ chứa chính từ đó"
                  : t.canDangTu && taiDangTu
                    ? "Đang tải bộ câu hỏi…"
                    : t.canDangTu && dangTu.length === 0
                      ? "Bộ này chưa có câu chọn dạng từ nào được soạn"
                      : undefined;
              return (
                <button
                  key={t.id}
                  disabled={khoa}
                  onClick={() =>
                    setModes((m) => (m.includes(t.id) ? m.filter((x) => x !== t.id) : [...m, t.id]))
                  }
                  className="px-2.5 py-2 rounded-lg text-xs font-semibold text-left"
                  style={{
                    background: chon ? "var(--accent-primary)" : "var(--bg-secondary)",
                    color: chon ? "#fff" : khoa ? "var(--text-muted)" : "var(--text-primary)",
                    opacity: khoa ? 0.5 : 1,
                  }}
                  title={viSao}
                >
                  {t.canNghe && "🔊 "}
                  {t.canAnh && "🖼️ "}
                  {t.canViDu && "✍️ "}
                  {t.canDangTu && "🔤 "}
                  {t.nhan}
                  {khoa &&
                    (t.canDangTu
                      ? taiDangTu
                        ? " (đang tải…)"
                        : " (chưa soạn)"
                      : t.canViDu
                        ? " (chưa có ví dụ)"
                        : " (chưa đủ ảnh)")}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
            <input type="checkbox" checked={chiDenHan} onChange={(e) => setChiDenHan(e.target.checked)} />
            Chỉ ôn từ đang đến hạn
          </label>

          <label className="flex items-start gap-2 mt-2 text-xs cursor-pointer" style={{ color: "var(--text-primary)" }}>
            <input
              type="checkbox"
              checked={cheDoThi}
              onChange={(e) => setCheDoThi(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Chế độ thi — bấm giờ, giấu đúng/sai tới cuối, được quay lại sửa
              {thu.cauHoi.length > 0 && (
                <b style={{ color: "var(--accent-primary)" }}>
                  {" "}
                  ({dongHo(Math.round(thoiLuongMs(thu.cauHoi) / 1000))} cho {thu.cauHoi.length} câu)
                </b>
              )}
            </span>
          </label>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Sẽ ra <b style={{ color: "var(--text-primary)" }}>{thu.cauHoi.length} câu</b>
          {" "}— mỗi thẻ sinh một câu cho mỗi dạng bạn chọn.
          {thu.boQua.thieuAnh > 0 && ` Bỏ qua ${thu.boQua.thieuAnh} lượt vì thẻ chưa có ảnh.`}
          {thu.boQua.thieuNghia > 0 && ` Bỏ qua ${thu.boQua.thieuNghia} lượt vì thẻ chưa có nghĩa.`}
          {thu.boQua.thieuViDu > 0 &&
            ` Bỏ qua ${thu.boQua.thieuViDu} lượt vì ví dụ của thẻ không khoét lỗ được.`}
          {thu.boQua.thieuDangTu > 0 &&
            ` Bỏ qua ${thu.boQua.thieuDangTu} lượt vì thẻ chưa có câu chọn dạng từ.`}
        </p>

        <button
          onClick={() => {
            const r = sinhCauHoi(cards, progress, { modes, chiDenHan }, dangTu);
            setCauHoi(r.cauHoi);
            setBoQua(r.boQua);
            setIdx(0);
            setKetQua(new Array(r.cauHoi.length).fill(null));
            setNhap("");
            batDauCau.current = Date.now();
            batDauPhien.current = Date.now();
            ketQuaRef.current = new Array(r.cauHoi.length).fill(null);
            daNop.current = false;
            const han = cheDoThi ? Date.now() + thoiLuongMs(r.cauHoi) : null;
            hanChot.current = han;
            setConLai(han === null ? null : Math.round((han - Date.now()) / 1000));
            setBatDau(true);
          }}
          disabled={modes.length === 0 || thu.cauHoi.length === 0}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{
            background: thu.cauHoi.length > 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: thu.cauHoi.length > 0 ? "#fff" : "var(--text-muted)",
          }}
        >
          {modes.length === 0
            ? "Chọn ít nhất một dạng"
            : thu.cauHoi.length === 0
              ? "Không sinh được câu nào — thử bỏ lọc đến hạn"
              : `Bắt đầu ${thu.cauHoi.length} câu`}
        </button>
      </div>
    );
  }

  // ── Màn kết thúc ──
  if (xong) {
    const daLamDs = ketQua.filter((r): r is KetQua => r !== null);
    const dung = daLamDs.filter((r) => r.correct).length;
    const sai = daLamDs.filter((r) => !r.correct);
    const boTrong = cauHoi.length - daLamDs.length;

    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }} className="text-center space-y-4">
        <div className="text-4xl">{sai.length === 0 && boTrong === 0 ? "🎉" : "📊"}</div>
        <p className="text-xl font-bold" style={{ color: sai.length === 0 ? GREEN : "var(--text-primary)" }}>
          Đúng {dung}/{daLamDs.length} câu
          {tomTat && ` · ${tomTat.percent}%`}
        </p>
        {/* Nói thẳng số câu bỏ trống: tỷ lệ đúng tính trên câu ĐÃ LÀM, không
            kèm dòng này thì hết giờ còn 3 câu cũng hiện ra "đúng 100%". */}
        {boTrong > 0 && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {boTrong} câu bỏ trống, không tính vào kết quả.
          </p>
        )}
        {dangGui && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Đang lưu kết quả…</p>}
        {choGui && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(74,124,89,.12)", color: GREEN }}>
            Mạng đang trục trặc nên kết quả được giữ lại trên máy. Khi có mạng, mở lại
            khu từ vựng là nó tự gửi — bạn không phải làm lại.
          </p>
        )}
        {loi && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(185,64,64,.1)", color: RED }}>
            {loi} — kết quả lượt này CHƯA được lưu.
          </p>
        )}

        {/* Chế độ thi giấu đáp án suốt lượt, nên đây là lần ĐẦU học viên được
            thấy. Chỉ liệt kê từ sai như chế độ luyện tập là không đủ — không
            nhớ nổi câu nào ra câu nào thì có soát cũng bằng thừa. */}
        {cheDoThi ? (
          <div className="text-left space-y-2">
            {cauHoi.map((q, i) => {
              const r = ketQua[i];
              const mau = !r ? "var(--text-muted)" : r.correct ? GREEN : RED;
              // Soát bài phải nói lại đúng thứ học viên NHÌN THẤY. Dạng
              // "Từ → chọn nghĩa" hiện 4 nghĩa tiếng Việt, mà chonId lưu
              // wordKey; báo "bạn chọn merging" trong khi họ bấm "sáp nhập,
              // hợp nhất" thì đọc xong không hiểu mình đã làm gì.
              const nhanCua = (id?: string) =>
                q.phuongAn?.find((x) => x.id === id)?.label ?? undefined;
              const daChonNhan = r ? (nhanCua(r.chonId) ?? r.given ?? r.chonId) : "";
              const dapAnNhan = q.phuongAn?.find((x) => x.dung)?.label ?? q.dapAn;
              return (
                <div
                  key={q.id}
                  className="rounded-xl p-3"
                  style={{ background: "var(--bg-elevated)", border: `1px solid ${mau}33` }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold tabular-nums" style={{ color: mau }}>
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {q.de.chu ?? (q.de.nghe ? `🔊 ${q.word}` : "🖼️ (ảnh)")}
                      </p>
                      <p className="text-xs mt-1" style={{ color: mau }}>
                        {!r
                          ? "Bỏ trống"
                          : r.correct
                            ? `✓ ${dapAnNhan}`
                            : `✗ bạn chọn “${daChonNhan}” — đúng là “${dapAnNhan}”`}
                      </p>
                      {q.nghia && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {q.word} — {q.nghia}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          sai.length > 0 && (
            <div className="text-left rounded-xl p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
                {sai.length} CÂU SAI — SẼ QUAY LẠI SỚM
              </p>
              <ul className="text-sm space-y-1">
                {sai.map((r, i) => (
                  <li key={i} style={{ color: "var(--text-primary)" }}>
                    <b>{r.word}</b>
                    {r.given && <span style={{ color: RED }}> — bạn gõ “{r.given}”</span>}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}

        <button onClick={onExit} className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          ← Về bộ thẻ
        </button>
      </div>
    );
  }

  if (!cau) return null;

  const dangGo = laDangGo(cau.type);
  const nhanDang = QUIZ_TYPES.find((t) => t.id === cau.type)?.nhan ?? cau.type;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={nop}
          className="text-sm px-2 py-1 rounded-lg"
          style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
          title="Dừng và lưu phần đã làm"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-muted)" }}>{nhanDang}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {idx + 1}/{cauHoi.length}
            {/* Chế độ thi không khoe số câu đúng: đếm đúng tăng hay không
                chính là đáp án của câu vừa làm, giấu cửa trước hở cửa sau. */}
            {cheDoThi
              ? ` · đã làm ${daLam}`
              : ` · đúng ${ketQua.filter((r) => r?.correct).length}`}
          </p>
        </div>
        {conLai !== null && (
          <div
            className="px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums"
            style={{
              background: conLai <= 30 ? "rgba(185,64,64,.12)" : "var(--bg-elevated)",
              color: conLai <= 30 ? RED : "var(--text-primary)",
            }}
          >
            {dongHo(conLai)}
          </div>
        )}
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all"
          style={{ width: `${(idx / cauHoi.length) * 100}%`, background: "var(--accent-primary)" }} />
      </div>

      {/* Đề bài */}
      <div className="rounded-2xl p-5 mb-4 text-center"
        style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)", minHeight: 150 }}>
        {cau.de.nghe && (
          <button onClick={() => playWord(cau.word)} className="px-5 py-3 rounded-xl text-lg font-bold"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
            🔊 Nghe lại
          </button>
        )}
        {cau.de.anh && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cau.de.anh} alt="" className="mx-auto rounded-lg" style={{ maxHeight: 180, objectFit: "contain" }} />
        )}
        {cau.de.chu && laDienTu(cau.type) ? (
          // Đề điền từ là cả một câu: cỡ 2rem của dạng một-từ sẽ tràn màn hình.
          // Tách ở ô trống để tô đậm chỗ phải điền.
          <p
            className="text-left"
            style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--text-primary)" }}
          >
            {cau.de.chu.split(O_TRONG).map((doan, i) => (
              <span key={i}>
                {i > 0 && (
                  <span
                    className="font-bold px-1 mx-0.5 rounded"
                    style={{
                      color: "var(--accent-primary)",
                      background: "var(--bg-secondary)",
                      borderBottom: "2px solid var(--accent-primary)",
                    }}
                  >
                    {O_TRONG}
                  </span>
                )}
                {doan}
              </span>
            ))}
          </p>
        ) : cau.de.chu ? (
          <p className="hand" style={{ fontSize: "2rem", color: "var(--accent-primary)", lineHeight: 1.2 }}>
            {cau.de.chu}
          </p>
        ) : null}
      </div>

      {/* Trả lời */}
      {dangGo ? (
        <div className="space-y-3">
          <input
            ref={oNhap}
            value={nhap}
            onChange={(e) => setNhap(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (daTraLoi && !cheDoThi) tiep();
              else if (nhap.trim()) traLoi(chamGo(nhap, cau.dapAn), "typed", nhap.trim());
            }}
            disabled={daTraLoi && !cheDoThi}
            placeholder="Gõ từ tiếng Anh…"
            className="w-full px-3 py-3 rounded-xl text-base outline-none text-center"
            style={{
              background: "var(--bg-primary)",
              // Chế độ thi: viền chỉ báo ĐÃ TRẢ LỜI, không báo đúng hay sai
              border: `1.5px solid ${
                hienPhanHoi
                  ? traLoiCau?.correct
                    ? GREEN
                    : RED
                  : daTraLoi
                    ? "var(--accent-primary)"
                    : "var(--border)"
              }`,
              color: "var(--text-primary)",
            }}
          />
          {(!daTraLoi || cheDoThi) && (
            <button onClick={() => nhap.trim() && traLoi(chamGo(nhap, cau.dapAn), "typed", nhap.trim())}
              disabled={!nhap.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-sm"
              style={{ background: "var(--accent-primary)", color: "#fff", opacity: nhap.trim() ? 1 : 0.5 }}>
              {cheDoThi ? "Ghi câu trả lời" : "Kiểm tra"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: cau.phuongAn?.[0]?.imageUrl ? "1fr 1fr" : "1fr" }}>
          {cau.phuongAn!.map((p) => {
            const hienDung = hienPhanHoi && p.dung;
            const hienSai = hienPhanHoi && daChon === p.id && !p.dung;
            // Chế độ thi chỉ tô chỗ đã chọn bằng màu trung tính — tô xanh hay
            // đỏ là để lộ đáp án, mà đó đúng là thứ chế độ thi phải giấu.
            const dangChon = cheDoThi && daChon === p.id;
            return (
              <button
                key={p.id}
                onClick={() => traLoi(p.dung, p.id)}
                disabled={daTraLoi && !cheDoThi}
                className="px-3 py-3 rounded-xl text-sm font-semibold text-left"
                style={{
                  background: hienDung
                    ? "rgba(74,124,89,.18)"
                    : hienSai
                      ? "rgba(185,64,64,.14)"
                      : dangChon
                        ? "color-mix(in srgb, var(--accent-primary) 14%, transparent)"
                        : "var(--bg-elevated)",
                  border: `1.5px solid ${
                    hienDung ? GREEN : hienSai ? RED : dangChon ? "var(--accent-primary)" : "var(--border)"
                  }`,
                  color: "var(--text-primary)",
                }}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="w-full rounded" style={{ height: 110, objectFit: "cover" }} />
                ) : (
                  p.label
                )}
                {hienDung && " ✓"}
              </button>
            );
          })}
        </div>
      )}

      {cau.formId && (
        <div className="mt-3 text-center">
          <button
            onClick={bao}
            disabled={daBao.has(cau.formId)}
            className="text-xs px-2.5 py-1.5 rounded-lg"
            style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
            title="Câu này do AI soạn — báo sai thì nó sẽ bị tắt cho cả lớp"
          >
            {daBao.has(cau.formId) ? "Đã báo, cảm ơn bạn" : "⚠ Câu này sai"}
          </button>
        </div>
      )}

      {hienPhanHoi && (
        <div className="mt-4">
          <p className="text-sm mb-2" style={{ color: "var(--text-primary)" }}>
            <b style={{ color: traLoiCau?.correct ? GREEN : RED }}>
              {traLoiCau?.correct ? "Đúng!" : "Chưa đúng."}
            </b>{" "}
            {cau.word}
            {cau.nghia && ` — ${cau.nghia}`}
          </p>
          <button onClick={tiep} className="w-full py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "var(--accent-primary)", color: "#fff" }}>
            {idx + 1 >= cauHoi.length ? "Xem kết quả" : "Câu tiếp →"}
          </button>
        </div>
      )}

      {/* Chế độ thi: đi lại giữa các câu, và tự quyết khi nào nộp. Không có
          nút "câu tiếp" tự hiện sau khi trả lời như chế độ luyện tập, vì ở
          đây trả lời xong chưa phải là xong — còn sửa được. */}
      {cheDoThi && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => toiCau(idx - 1)}
              disabled={idx === 0}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                opacity: idx === 0 ? 0.4 : 1,
              }}
            >
              ← Câu trước
            </button>
            <button
              onClick={() => toiCau(idx + 1)}
              disabled={idx + 1 >= cauHoi.length}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm"
              style={{
                background: "var(--accent-primary)",
                color: "#fff",
                opacity: idx + 1 >= cauHoi.length ? 0.4 : 1,
              }}
            >
              Câu sau →
            </button>
          </div>

          {/* Lưới số câu: chấm đặc là đã trả lời. Soát bài mà phải bấm tới lui
              từng câu để tìm chỗ bỏ trống thì hết giờ mất. */}
          <div className="flex flex-wrap gap-1 justify-center pt-1">
            {cauHoi.map((q, i) => (
              <button
                key={q.id}
                onClick={() => toiCau(i)}
                className="w-7 h-7 rounded-lg text-xs font-bold tabular-nums"
                style={{
                  background:
                    i === idx
                      ? "var(--accent-primary)"
                      : ketQua[i]
                        ? "color-mix(in srgb, var(--accent-primary) 18%, transparent)"
                        : "var(--bg-elevated)",
                  color: i === idx ? "#fff" : "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
                title={ketQua[i] ? "Đã trả lời" : "Chưa trả lời"}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={nop}
            className="w-full py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "rgba(74,124,89,.15)", color: GREEN }}
          >
            Nộp bài
            {daLam < cauHoi.length && ` — còn ${cauHoi.length - daLam} câu chưa làm`}
          </button>
        </div>
      )}

      {boQua.thieuAnh + boQua.thieuNghia + boQua.thieuViDu + boQua.thieuDangTu > 0 &&
        idx === 0 && (
        <p className="text-xs mt-4 text-center" style={{ color: "var(--text-muted)" }}>
          {`Đã bỏ ${
            boQua.thieuAnh + boQua.thieuNghia + boQua.thieuViDu + boQua.thieuDangTu
          } lượt vì thẻ chưa đủ ${[
            boQua.thieuAnh > 0 && "ảnh",
            boQua.thieuNghia > 0 && "nghĩa",
            boQua.thieuViDu > 0 && "câu ví dụ khoét lỗ được",
            boQua.thieuDangTu > 0 && "câu chọn dạng từ",
          ]
            .filter(Boolean)
            .join(" / ")}.`}
        </p>
      )}
    </div>
  );
}
