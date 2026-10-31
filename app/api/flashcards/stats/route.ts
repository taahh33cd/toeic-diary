import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";

export const dynamic = "force-dynamic";

/** Giờ VN — gom theo ngày phải cùng múi giờ với lịch ôn, xem lib/vocab/srs.ts. */
const TZ = "Asia/Ho_Chi_Minh";

export interface NgayHoatDong {
  ngay: string;
  soLan: number;
}

/**
 * Thống kê học từ vựng của chính mình.
 *
 * Nguồn cho "ngày có ôn": XpEvent nguồn vocab_* (mỗi lượt lật thẻ đúng một
 * dòng, mỗi phiên quiz một dòng) hợp với VocabQuizSession.
 *
 * Giới hạn đã biết: lật thẻ "Chưa thuộc" không cộng XP nên không để lại dấu.
 * Ngày mà học viên CHỈ bấm "Chưa thuộc" sẽ không tính là ngày có ôn. Hiếm, và
 * thà bỏ sót còn hơn đẻ thêm một bảng nhật ký chỉ để đếm ngày.
 */
export async function GET() {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const uid = gate.userId;

  try {
    const now = new Date();

    const [tong, daThuoc, denHan, theoBo, haySai, ngay, tocDo] = await Promise.all([
      prisma.vocabProgress.count({ where: { userId: uid } }),
      prisma.vocabProgress.count({ where: { userId: uid, mastered: true } }),
      prisma.vocabProgress.count({
        where: { userId: uid, mastered: false, OR: [{ dueAt: null }, { dueAt: { lte: now } }] },
      }),

      // % thuộc theo bộ — nối thẻ với tiến độ qua word_key
      prisma.$queryRaw<{ id: string; title: string; tong: bigint; daOn: bigint; thuoc: bigint }[]>`
        SELECT d.id, d.title,
               count(c.id)                                        AS tong,
               count(p.id) FILTER (WHERE p.rep_count > 0)         AS "daOn",
               count(p.id) FILTER (WHERE p.mastered)              AS thuoc
        FROM vocab_decks d
        JOIN vocab_cards c ON c.deck_id = d.id
        LEFT JOIN vocab_progress p ON p.word_key = c.word_key AND p.user_id = ${uid}
        WHERE d.owner_id = ${uid}
        GROUP BY d.id, d.title
        ORDER BY count(c.id) DESC
        LIMIT 20`,

      // Từ hay sai nhất, kèm dạng câu hỏi hay sai nhất của từ đó
      prisma.$queryRaw<{ word: string; wrong: number; rep: number; dangHaySai: string | null }[]>`
        SELECT p.word, p.wrong_count AS wrong, p.rep_count AS rep,
               (SELECT i.quiz_type
                  FROM vocab_quiz_items i
                  JOIN vocab_quiz_sessions s ON s.id = i.session_id
                 WHERE s.user_id = ${uid} AND i.word_key = p.word_key AND i.correct = false
                 GROUP BY i.quiz_type ORDER BY count(*) DESC LIMIT 1) AS "dangHaySai"
        FROM vocab_progress p
        WHERE p.user_id = ${uid} AND p.wrong_count > 0
        ORDER BY p.wrong_count DESC, p.rep_count ASC
        LIMIT 10`,

      // Ngày có ôn trong 90 ngày gần nhất
      prisma.$queryRaw<{ ngay: string; soLan: bigint }[]>`
        SELECT ngay, sum(n) AS "soLan" FROM (
          SELECT to_char(created_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS ngay, count(*) AS n
            FROM xp_events
           WHERE user_id = ${uid} AND source LIKE 'vocab%'
             AND created_at > now() - interval '90 days'
           GROUP BY 1
          UNION ALL
          SELECT to_char(finished_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS ngay, count(*) AS n
            FROM vocab_quiz_sessions
           WHERE user_id = ${uid} AND finished_at IS NOT NULL
             AND finished_at > now() - interval '90 days'
           GROUP BY 1
        ) t GROUP BY ngay ORDER BY ngay DESC`,

      // Thời gian trả lời trung bình theo nhóm dạng — dùng để hiệu chỉnh ngưỡng
      prisma.$queryRaw<{ nhom: string; soCau: bigint; trungVi: number }[]>`
        SELECT CASE
                 WHEN i.quiz_type LIKE '%-to-typing' THEN 'typing'
                 WHEN i.quiz_type LIKE '%-to-image'  THEN 'choiceImage'
                 ELSE 'choiceText'
               END AS nhom,
               count(*) AS "soCau",
               percentile_cont(0.5) WITHIN GROUP (ORDER BY i.answer_ms) AS "trungVi"
        FROM vocab_quiz_items i
        JOIN vocab_quiz_sessions s ON s.id = i.session_id
        WHERE s.user_id = ${uid} AND i.answer_ms IS NOT NULL AND i.correct = true
        GROUP BY 1`,
    ]);

    const ngayCo = ngay.map((r) => ({ ngay: r.ngay, soLan: Number(r.soLan) }));
    const tapNgay = new Set(ngayCo.map((d) => d.ngay));

    // Chuỗi hiện tại: tính từ hôm nay lùi về. Chưa ôn hôm nay thì vẫn tính
    // tiếp từ hôm qua — chuỗi chỉ đứt khi bỏ trọn một ngày.
    const ngayCuaICT = (lui: number) =>
      new Date(Date.now() + 7 * 3600_000 - lui * 86_400_000).toISOString().slice(0, 10);

    let chuoi = 0;
    const batDau = tapNgay.has(ngayCuaICT(0)) ? 0 : 1;
    for (let i = batDau; i < 90; i++) {
      if (!tapNgay.has(ngayCuaICT(i))) break;
      chuoi++;
    }

    // Trả sẵn ĐỦ 30 ngày (kể cả ngày trống) để client chỉ việc vẽ. Để client
    // tự dựng lịch thì phải gọi Date.now() trong thân component, mà eslint
    // react-hooks/purity chặn — và server mới là nơi có "hôm nay" đáng tin.
    const day30: NgayHoatDong[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = ngayCuaICT(i);
      day30.push({ ngay: d, soLan: tapNgay.has(d) ? (ngayCo.find((x) => x.ngay === d)?.soLan ?? 0) : 0 });
    }

    return NextResponse.json({
      tongQuan: { tong, daThuoc, denHan, dangHoc: tong - daThuoc },
      theoBo: theoBo.map((b) => ({
        id: b.id,
        title: b.title,
        tong: Number(b.tong),
        daOn: Number(b.daOn),
        thuoc: Number(b.thuoc),
        phanTram: Number(b.tong) > 0 ? Math.round((Number(b.thuoc) / Number(b.tong)) * 100) : 0,
      })),
      haySai,
      chuoiNgay: chuoi,
      hoatDong: day30,
      tocDo: tocDo.map((t) => ({
        nhom: t.nhom,
        soCau: Number(t.soCau),
        trungViMs: Math.round(t.trungVi ?? 0),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/stats]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
