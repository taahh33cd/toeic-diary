# Writing Part 3 (Q8 — Opinion Essay) — R&D spec

Bản đầy đủ có phân tích: artifact `Bản đồ tầng Writing Part 3`
https://claude.ai/code/artifact/38567fed-8807-4ed7-a579-68cb9cb44413

Trạng thái: **Phase 1–4 đã xong.** Tầng 1–13 mở, 155 bài tập tự chấm qua 13 loại,
24 đề viết thật, 6 cặp bài mẫu mức-3/mức-5.
Chỉ còn Tầng 0 `active: false` — band ≤90 chỉ là on-ramp, chưa cấp thiết.
Việc mở rộng còn lại: nhân mỗi tầng từ 1 bộ test lên 5 bộ.

## Quyết định đã chốt

1. **Giữ nguyên 14 tầng**, không gộp.
2. **Người ≤90: gợi ý, không chặn** — mở đủ tầng, thêm dòng "nên làm Part 2 trước sẽ lên điểm nhanh hơn".
3. **Bài mẫu làm theo cặp** — 6 cặp mức-3/mức-5, mỗi dạng đề một cặp, hai bài cùng trả lời một đề.
4. **Hệ thống gợi ý band** từ điểm đã chấm; học viên vẫn đổi được.

## Sự thật từ ETS

- 1 câu duy nhất, 30 phút, tối thiểu ~300 từ, chấm 0–5.
- 4 tiêu chí trên màn hình: ý kiến có được chứng minh bằng lý do/ví dụ · ngữ pháp · từ vựng · tổ chức bài.
- Nguồn: Examinee Handbook tr.30–31 (directions + scoring guide), Score User Guide tr.14–16 (mô tả năng lực theo dải điểm 0–200), Sample Tests (đề mẫu).

## Thang chấm tách thành 5 trục

| Mốc | Trả lời đúng việc | Phát triển & ví dụ | Mạch bài | Độ chính xác | Độ đa dạng |
|---|---|---|---|---|---|
| 5 | trúng | xác đáng, đầy đủ | thống nhất, liền mạch | ổn định | đa dạng cú pháp + chất bản ngữ |
| 4 | trúng, vài ý chưa sâu | đủ | **còn lặp ý, vài chỗ lạc ý, nối ý mờ** | lỗi nhỏ không cản trở việc hiểu | có đa dạng |
| 3 | trúng | lưng chừng | có chỗ nối bị che | không đều | **đúng nhưng hạn hẹp** |
| 2 | bám đề | **khái quát mà thiếu ví dụ** | tổ chức không đạt | lỗi tích tụ | — |
| 1 | **đáng ngờ, lệch việc** | rất ít chi tiết | rối loạn | lỗi nặng và dày | — |

Bốn phát hiện chi phối thiết kế:

1. **3→4 là bài toán ĐỘ ĐA DẠNG, không phải sửa lỗi.** Mức 3 = "đúng nhưng hạn hẹp". Bài sạch lỗi vẫn bị chặn ở 3 nếu toàn câu đơn.
2. **Mức 2 chết vì thiếu ví dụ**, không phải thiếu ý. Cần tầng riêng cho chuỗi luận điểm → vì sao → ví dụ cụ thể.
3. **4→5 là CẮT, không phải viết thêm.** Mức 4 vẫn được phép lặp/lạc ý; mức 5 thì không.
4. **Mức 1 là lỗi đọc đề.** Tầng đầu tiên phải là giải mã đề.

## Band map (dịch lên so với Part 2)

ETS: bài luận là thứ ngăn cách 140–160 với 170–200; người dưới 90 nên luyện Part 1/2 trước.

| Band | Trạng thái | Đích | Tầng |
|---|---|---|---|
| ≤90 | chưa tới lượt | on-ramp | T0 |
| 100–130 | có ý, chưa chứng minh | thoát 1–2, chạm mức 3 | T1–T4 |
| 140–160 | đủ ý, thiếu độ sâu | mức 3 → 4 | T5–T9 |
| 170+ | đủ chuẩn, thiếu đa dạng | mức 4 → 5 | T10–T12 |

## 6 dạng đề (không phải 4)

| id | Dạng | Khung đúng | Bẫy |
|---|---|---|---|
| `agree_disagree` | Đồng ý / phản đối | chọn 1 phe → 2–3 lý do → mỗi lý do 1 ví dụ | đứng giữa, không có luận điểm |
| `choice_2` | Chọn 1 trong 2 | chọn A → lý do → 1 câu nhượng bộ vì sao B kém | tả đều cả hai, quên chọn |
| `choice_3` | Chọn 1 trong 3+ | chọn 1 → **loại bỏ 2 cái kia có lý do** → bảo vệ lựa chọn | quên hai lựa chọn còn lại |
| `pros_cons` | Ưu & nhược | đoạn ưu → đoạn nhược → **kết bài mới ngả bên** | biến thành agree/disagree ngay mở bài |
| `open_q` | Câu hỏi mở (best way / what qualities) | **tự đặt 2–3 hạng mục** rồi chọn/xếp hạng | đứng hình 5–8 phút, không kịp 300 từ |
| `policy` | Nên / không nên | lập luận theo từng bên liên quan | chỉ nói cảm nghĩ cá nhân, ý mỏng |

`pros_cons` và `open_q` là hai dạng hỏng khuôn nhiều nhất, cần bài tập riêng.

## 14 tầng

| Tầng | Band | Trục | Loại bài tập |
|---|---|---|---|
| T0 Câu ý kiến | ≤90 | dựng câu | word_bank, word_order, translate |
| T1 Giải mã đề | 100–130 | trả lời đúng việc | mcq, labeling, mission_audit |
| T2 Chọn phe & luận điểm | 100–130 | trả lời đúng việc | mcq, error_spot, type_blank |
| T3 Chuỗi lý do–ví dụ | 100–130 | phát triển | ordering, matching, mcq |
| T4 Khung bốn đoạn | 100–130 | mạch bài | labeling, ordering |
| T5 Chung chung → cụ thể | 140–160 | phát triển | compare, type_blank, translate |
| T6 Mạch nối | 140–160 | mạch bài | word_bank, mcq (dùng lại ngân hàng module Liên từ) |
| T7 Cắt lặp và lạc ý | 140–160 | mạch bài | trim, mcq |
| T8 Sạch lỗi bài dài | 140–160 | độ chính xác | error_spot, type_blank |
| T9 Tốc độ sản xuất | 140–160 | đủ 300 từ / 30 phút | **timed_write** (80–100 từ / 6 phút) |
| T10 Đa dạng cấu trúc | 170+ | **độ đa dạng** | word_order, compare, translate |
| T11 Chọn từ | 170+ | **độ đa dạng** | word_bank, mcq, error_spot |
| T12 Mở bài & kết bài | 170+ | mạch bài + đa dạng | compare, error_spot |
| T13 Viết thật | mọi band | toàn bộ | **timed_write** 30 phút + SkillSubmission |

T10 là tầng đáng giá nhất (hệ quả phát hiện 1) và gần như không nơi nào dạy.

## Chi phí code

12/14 tầng dùng lại nguyên 13 loại bài tập của Part 2 (`lib/subskills/writing-part2/index.ts`).
Ba loại tưởng đặc thù email nhưng khớp rất đẹp:

- `mission_audit` → đề giao mấy việc, bài làm được mấy việc (phát hiện 4)
- `trim` → chặng 4→5 (phát hiện 3)
- `compare` → dạy "cụ thể hơn" / "đa dạng hơn", hai khái niệm chỉ thấy được khi đặt cạnh nhau

Renderer mới duy nhất: **`timed_write`** = textarea + đếm từ realtime + đồng hồ ngược + checklist tự soi.
Hai bộ tham số: T9 (6 phút / 80–100 từ), T13 (30 phút / 300 từ).
Nộp bài dùng lại `SkillSubmission` + `/journal/submissions` + `/admin/grading` (đã có).

## Data cần viết

| Hạng mục | SL | Ghi chú |
|---|---|---|
| Bài tập tự chấm | ~195 | 13 tầng × 3 cấp × 5 bài |
| Đề viết thật T13 | 24 | 6 dạng × 4 đề |
| Bài mẫu | 12 | **6 cặp mức-3/mức-5**, mỗi dạng một cặp cùng chung một đề |
| Đoạn văn nền (T5–T8, T12) | ~40 | bản nháp cài lỗi sẵn |

Phase: (1) khung + T1–T4 · (2) T5–T9 · (3) T10–T12 · (4) T13 + bộ đề + bài mẫu. Tất cả đã xong.

### Phase 4 — những gì đã dựng

| Thứ | Chi tiết |
|---|---|
| `tang13.ts` | 24 đề, 6 dạng × 4, missions tách theo dạng, 30 phút / 300 từ |
| `samples.ts` | 6 cặp mức-3/mức-5, mỗi dạng một cặp, kèm `gaps` tách theo 4 trục |
| `WritingP3ComposeClient` | Đồng hồ 30 phút + đếm từ + khung đúng/bẫy của dạng + checklist + `SubmissionPanel` |
| `WritingP3SamplesClient` | Xem song song hai bài, hoặc soi từng bài, kèm bảng khác nhau theo trục |
| `/part3/tang13` · `/part3/bai-mau` | Hai route mới |

**Unit nộp bài = `subskill-wp3-tang13`.** `scaleFor()` trả 5 cho unit này (rơi vào nhánh mặc định q8)
— đúng, vì Q8 chấm rubric 0–5. Trang hub đã được mở rộng để nhận cả `"q8"` lẫn `"subskill-wp3-tang13"`
làm tín hiệu ưu tiên 1 khi gợi ý band.

**Bài mức 3 trong 6 cặp được viết cố ý gần như KHÔNG có lỗi ngữ pháp.** Đó là toàn bộ bài học của
thư viện này: ETS mô tả mức 3 là "đúng nhưng hạn hẹp", nên sạch lỗi thôi chưa lên được mức 4.

### Đã dựng (Phase 1–3)

Mỗi tầng hiện có **1 bộ test**, nhân lên 5 bộ ở phase sau.

| Tầng | Bài | easy / medium / hard |
|---|---|---|
| T1 Giải mã đề | 15 | 6 · 5 · 4 |
| T2 Chọn phe & luận điểm | 14 | 5 · 5 · 4 |
| T3 Chuỗi lý do–ví dụ | 14 | 5 · 5 · 4 |
| T4 Khung bốn đoạn | 14 | 5 · 5 · 4 |
| T5 Chung chung → cụ thể | 12 | 4 · 4 · 4 |
| T6 Mạch nối | 13 | 4 · 5 · 4 |
| T7 Cắt lặp và lạc ý | 12 | 4 · 4 · 4 |
| T8 Sạch lỗi bài dài | 14 | 5 · 5 · 4 |
| T9 Tốc độ sản xuất | 9 | 3 · 3 · 3 |
| T10 Đa dạng cấu trúc | 13 | 4 · 5 · 4 |
| T11 Chọn từ | 13 | 4 · 5 · 4 |
| T12 Mở bài & kết bài | 12 | 4 · 4 · 4 |

Sai lệch so với blueprint, đều là cố ý:

- **T5 bỏ `type_blank`**, dùng `compare` ở cả easy lẫn medium. Medium là biến thể khó hơn: cả hai bản đều có chi tiết cụ thể, nhưng một bản dùng chi tiết TRANG TRÍ không phục vụ luận điểm. Phân biệt này đáng giá hơn điền chỗ trống.
- **T6 KHÔNG import module Liên từ.** `ConnGroupConfig` có `connectors` + `levels` gắn với UI riêng của nó; import vào sẽ kéo theo cả cấu trúc level. Ngân hàng từ viết thẳng trong JSON, dùng lại đúng các bẫy của module đó (because vs because of, despite vs although, chấm câu quanh however).
- **T9 chấm bằng số từ đạt được trong thời gian cho.** Đó là phần khách quan duy nhất máy chấm được; checklist tự soi hiện sau khi nộp và KHÔNG tính điểm.

**T10 có một bài cố tình bẫy ngược** (`t10-1-e3`): bản "đa dạng" hơn lại là bản thua, vì nó dài dòng tới mức làm mờ nghĩa. Không có bài này thì học viên rút ra bài học sai là "cứ chọn bản nặng nề hơn". ETS chấm "chọn từ phù hợp", không chấm độ khó của từ.

`timed_write` dùng `submitted` dẫn xuất (`submittedEarly || left === 0`) chứ không phải state riêng —
eslint `react-hooks/set-state-in-effect` và `react-hooks/refs` chặn cả hai cách làm quen thuộc.
`reportedRef` chốt để `onResult` chỉ chạy một lần dù nộp sớm hay hết giờ.

## Bản quyền

Prompt viết mới bằng câu chữ của mình theo khuôn ETS, giữ chủ đề — KHÔNG chép nguyên văn đề/bài mẫu của ETS hay sách luyện thi. Bài mẫu tự viết 100%. Cùng nguyên tắc với ghi chú tránh DMCA ở `/skills`.

## Cặp bài mẫu — dùng ở 3 chỗ

12 bài không nằm yên trong thư viện, chúng là nguyên liệu:

- **T5** — cắt từng cặp câu tương ứng ra làm `compare`: cùng một ý, bản nào có ví dụ cụ thể hơn.
- **T10** — cùng cặp câu đó, hỏi bản nào đa dạng cấu trúc hơn (chặng 3→4, phát hiện 1).
- **Thư viện bài mẫu** — xem trọn hai bài song song, bật/tắt đánh dấu chỗ khác nhau.

Công viết gấp đôi nhưng thu về 3 lần dùng, và tự sinh sẵn data cho hai tầng khó nhất.

## Gợi ý band — BẪY phải tránh

`SkillSubmission.band` do `estimateBand()` ghi khi giáo viên chấm, công thức
`điểm rubric ÷ thang × 200` ([lib/submissions/index.ts:209](../lib/submissions/index.ts)).
Với Q8 thang 5 → mức 2 ra **80 điểm**.

**KHÔNG lấy thẳng `band` của bài Q8 để chọn band Part 3.** Học viên được 2/5 sẽ rơi vào
"≤90 · chưa tới lượt", trong khi ETS nói người yếu bài luận thường là người tổng 140–160.
Điểm rubric một câu ≠ điểm nền Writing tổng.

Đọc tín hiệu theo thứ tự, và đọc **điểm rubric thô** chứ không đọc trường `band`:

| Ưu tiên | Tín hiệu | Suy ra band |
|---|---|---|
| 1 | Bài **Q8 đã chấm** gần nhất, lấy rubric thô 0–5 | 1–2 → `100–130` · 3 → `140–160` · 4–5 → `170+` |
| 2 | Chưa có Q8; có **Q1-5 / Q6-7 đã chấm** — lúc này `band` dùng được vì đúng là proxy nền chung | trung bình `band` → ánh xạ thẳng 4 dải |
| 3 | Chưa chấm bài Writing nào | không đoán; mở sẵn `100–130`, để tự chọn |

Band `≤90` **không bao giờ** được tự gợi ý — chỉ khi học viên tự chọn. T0 dù sao cũng luôn mở.

`scaleFor()` đã xử lý sẵn `writing/q8 → thang 5`, không cần sửa.
