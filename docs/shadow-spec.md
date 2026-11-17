# Spec: Luyện đọc / Shadow sau Dictation

Trạng thái: **xong giai đoạn 2** (đã ghi mốc từng từ cho 98.9% số câu trên production). Giai đoạn 3 chờ lệnh.

Code: `components/practice/shadow/` (giao diện, ghi âm), `lib/shadow/` (luật ngữ điệu, chọn câu ⭐, phân tích giọng, mốc từ).
Huy hiệu ✓ trên danh sách bài cần lưu tiến độ nên dời sang giai đoạn 3.

## Mục tiêu

Sau khi nộp dictation, HV đọc theo audio gốc của chính bài đó: thấy đường ngữ điệu, từ đang đọc được làm nổi bật, ghi âm và tự so sánh giọng mình với bản gốc.

**Thước đo thành công (4 tuần sau ra mắt):** ≥ 30% số bài dictation đã nộp có shadow đủ 3 câu ⭐.
Ghi sự kiện: `shadow_open`, `shadow_record`, `shadow_sentence_done`, `shadow_lesson_done`.

## Phạm vi

- Cả 4 Part, sau **mọi Level** (1–4). Tiến độ tính theo lesson, không theo Level.
- Không bắt buộc, không chặn nút "Bài tiếp".
- Trừ thời gian dùng thử như dictation (UsageGate).
- Chưa làm (để bản sau): AI chấm điểm, giáo viên giao bài, lưu file ghi âm, bản dịch.

## User journey

1. Nộp bài, màn kết quả hiện CTA **"🎙 Shadow 3 câu (~2 phút)"** cạnh nút "Bài tiếp", section Shadow nằm dưới transcript.
2. Mặc định chế độ **Từng câu** (◀ Câu 2/8 ▶). Hiện mọi câu, 3 câu ⭐ được gợi ý luyện trước.
3. **Nghe**: phát đúng đoạn audio của câu, từ đang đọc phóng to + đổi màu.
4. **Ghi âm**, theo 1 trong 2 kiểu (HV tự chọn, nhớ lựa chọn):
   - *Nghe rồi lặp lại* (mặc định): audio gốc phát hết, app tự bật mic.
   - *Đọc đồng thời*: audio gốc phát và HV nói cùng lúc, app nhắc đeo tai nghe.
5. **So sánh**: phát câu gốc rồi đến giọng HV ngay sau. Đường cao độ thật của HV (đo trên trình duyệt) vẽ chồng lên đường mẫu.
6. Câu đạt yêu cầu thì có dấu ✓. Lesson tính "xong" khi đủ 3 câu ⭐ thì hiện huy hiệu ✓ trên bài học.
7. Chế độ **Cả bài**: audio phát liên tục, highlight chạy theo, tự cuộn.
8. Chế độ **Tự chạy** (tùy chọn): app tự đi vòng nghe → ghi → nghe lại → sang câu tiếp, tự dừng ghi khi HV im lặng khoảng 1 giây.

## UI

- **Highlight từ**: từ đang đọc phóng to 1.25× + đổi màu, đọc qua thì trở lại bình thường. Dùng `transform` để giữ layout, dòng không bị xô.
- **Đường ngữ điệu**: SVG đặt trên chữ, **mỗi dòng ngắt có một đường riêng**. Hiện sẵn, có nút tắt.
- Part 3–4: nhãn người nói W/M, mỗi người một màu. Part 1–2: câu hỏi và từng đáp án A/B/C/D tính là các câu riêng.
- Điều khiển: Nghe · Nghe chậm (0.75×/0.5×) · Ghi âm · So sánh · Bật/tắt ngữ điệu · Toàn màn hình · Từng câu/Cả bài · Kiểu ghi · Tự chạy.
- Responsive. Trên mobile, các nút gom thành một hàng dưới đáy màn hình.
- Phím tắt: `Space` nghe · `R` ghi/dừng · `←/→` câu trước/sau · `P` nghe lại giọng mình. Gợi ý phím tắt theo kiểu `KeyboardHints`.
- HV từ chối quyền mic: ẩn ghi âm, vẫn nghe và đọc theo được, hiện hướng dẫn bật lại quyền.

## Luật nghiệp vụ

- **Ngữ điệu**: mỗi cụm ý có **1 đỉnh chính**, rơi vào từ nội dung cuối của cụm (cùng luật với `lib/subskills/chunking/speak.ts`). Các từ nội dung khác chỉ gợn nhỏ, từ chức năng nằm ở đáy. Cuối câu đi xuống, riêng câu hỏi Yes/No thì đi lên.
- **Câu ⭐**: mặc định chọn 3 câu theo thứ tự ưu tiên: câu HV vừa chép sai nhiều nhất, rồi câu chứa đáp án đúng, rồi câu dài nhất. Admin có thể ghi đè.
- **Câu đạt**: bản ghi có tiếng nói (phát hiện qua âm lượng) chiếm ≥ 50% độ dài câu gốc. Phân tích ngay trên trình duyệt, không gọi API.
- **Đếm**: mỗi câu chỉ được tính 1 lần mỗi ngày. Shadow lại câu cũ vào ngày khác vẫn được tính.
- **Streak**: cần ≥ 5 câu đạt trong ngày thì tính là hoạt động học của ngày đó.

## Dữ liệu

- `Sentence.wordTimings Json?` (cột `word_timings`): `[[start, end], ...]`, mỗi cặp ứng với một token của `content.split(/\s+/)`. Null thì chỉ highlight cả câu.
- `Sentence.stressOverride Json?`: chỉ số các từ đỉnh nhấn do admin sửa. Null thì dùng luật tự động.
- `Sentence.isStarred Boolean?`: câu ⭐ do admin ghi đè.
- Bảng `ShadowProgress`: `userId, sentenceId, lessonId, part, day (date)`, unique `(userId, sentenceId, day)`.
- Không lưu file ghi âm. Bản ghi chỉ nằm trong bộ nhớ trình duyệt suốt phiên học.

## Timing từng từ

- Pipeline: forced alignment **cả bài** (stable-ts, model `small`) trên audio production, căn transcript `Sentence.content` vào file. Ghi `wordTimings` vào DB. Script chạy trên máy admin, từng đề một. Audio phải tải từ Supabase Storage: file trong `scripts/data/*/audio` bị lệch 1 track so với `parsed.json`.
- Sau khi căn, đánh dấu những từ có độ dài 0s hoặc dài hơn 2.5s. Câu chứa từ như vậy thì căn lại riêng câu đó, rồi đưa vào danh sách để admin kiểm tra.
- Part 1/2: thêm phần audio có đọc mà transcript không có ("Number N.", chữ "A./B./C.") vào văn bản đem căn, rồi bỏ đi khi ghi kết quả. Lỗi hiện tại tập trung ở từ đầu câu Part 2.
- **Không dùng ước lượng theo âm tiết làm phương án dự phòng.** Đo được chỉ 12% số từ lệch dưới 100ms. Câu chưa có `wordTimings` thì chỉ highlight cả câu, không highlight từng từ.
- Phát chậm dùng `playbackRate` với `preservesPitch`. Highlight bám theo `audio.currentTime` nên vẫn khớp ở mọi tốc độ.

### Kết quả đo (2026-11-17, 31 bài × 10 đề EST 2024, 2.171 từ)

So mốc đầu mỗi từ với Whisper nhận dạng lại (ASR, faster-whisper `small`). ASR dùng cùng model với forced alignment, nên con số này là **độ đồng thuận**, chưa phải độ chính xác. Độ chính xác thật đo bằng tai qua trang nghe thử.

| Cách | Từ có mốc hợp lệ | Lệch < 100ms | Lệch < 200ms | Trung vị | p90 |
|---|---|---|---|---|---|
| A1 căn cả bài | 97.8% | **91.8%** | 95.9% | 0ms | 80ms |
| A2 căn từng câu theo khung trong DB | 93.8% | 89.5% | 92.7% | 10ms | 110ms |
| C ước lượng theo âm tiết | 99.9% | 12.4% | 23.1% | 486ms | 1.569ms |

- **Kiểm tra bằng tai** (50 câu, highlight theo A1, chấm trên trang nghe thử): **Khớp 48 (96%) · Lệch nhẹ 2 (4%) · Sai 0**. Khoảng tin cậy 95% của tỷ lệ Khớp là 86–99%. Không có câu Sai nghĩa là tỷ lệ Sai thật nhiều khả năng dưới 6%. Hai câu Lệch nhẹ đều là câu Part 4 dài: T1 Q89–91 câu 2 (có "30-second", "20-second") và T4 Q71–73 câu 5. Cả 8 câu Part 2 đều Khớp.
- Theo Part, cách A1 lệch dưới 100ms ở: P1 91.7%, P2 **82.3%**, P3 92.9%, P4 91.6%.
- A2 kém hơn vì phụ thuộc mốc câu trong DB, mà mốc này có chỗ sai.
- Mốc câu trong DB: trung vị bắt đầu sớm hơn tiếng đọc 0.42s (do cố ý chừa đệm). Riêng 13/228 câu (5.7%) bắt đầu **muộn** hơn tiếng đọc từ 0.7 đến 3.3s, phần lớn là câu cuối bài. Phần chừa `LEAD_IN = 0.2s` không bù được, nên học viên nghe từng câu sẽ mất mấy từ đầu.

### Kết quả chạy toàn bộ (2026-11-17)

Đã chạy `scripts/shadow/align_word_timings.py` trên **1.265 bài / 6.723 câu**, mất khoảng 4,7 giờ trên CPU. Các bước: căn cả bài → căn lại riêng câu lỗi trong khung giữa hai câu tốt gần nhất → ASR dự phòng → hậu kiểm.

| Part | Câu có mốc |
|---|---|
| P1 | 478/480 (99.6%) |
| P2 | 2.561/2.600 (98.5%) |
| P3 | 2.170/2.192 (99.0%) |
| P4 | 1.442/1.451 (99.4%) |
| **Tổng** | **6.651/6.723 (98.9%)** |

- 793 câu được căn lại riêng, 820 câu lấy mốc từ ASR. 72 câu không căn được nên để null (giao diện highlight cả câu).
- Đã ghi vào `sentences.word_timings` trên production. Kiểm tra lại: 6.651 câu có mốc, khớp với kết quả căn.
- Khi thêm đề mới: `export-lessons.ts --only-missing` → `align_word_timings.py` → `apply-word-timings.ts --apply`.

## Báo cáo

- **Bảng Kết quả HV (admin)**: thêm cột Shadow (số câu, số bài đã xong).
- **Streak**: tính shadow là hoạt động học trong ngày, theo luật ở trên.
- **Lộ trình**: loại nhiệm vụ mới "Shadow N câu Part X", kiểm tra qua `ShadowProgress`.
- **Trang tiến độ HV**: tổng số câu và số bài đã shadow.
- **Trang admin riêng**: danh sách câu theo đề/Part, sửa từ nhấn và câu ⭐ hàng loạt.

## Giai đoạn

1. **UI Shadow**: gồm ngữ điệu, highlight, ghi âm, so sánh, cao độ của HV, Tự chạy, phím tắt, CTA. Câu chưa có `wordTimings` thì highlight cả câu. Tiến độ tạm giữ ở state trên trình duyệt.
2. **Timing thật** (làm trước khi ra mắt, vì không có phương án dự phòng dùng được): migration `wordTimings`, script forced-align cả bài kèm bước căn lại các câu lỗi, chạy hết các đề.
3. **Dữ liệu tiến độ**: migration, API ghi `ShadowProgress`, kiểm tra câu đạt, streak, trang tiến độ HV, ghi sự kiện đo lường.
4. **Báo cáo + admin**: cột Shadow trong bảng admin, nhiệm vụ trong lộ trình, trang admin sửa từ nhấn và câu ⭐.

## Rủi ro đã cân nhắc

| Rủi ro | Cách xử lý |
|---|---|
| Ghi âm im lặng để lách số liệu | Kiểm tra có tiếng nói ≥ 50% độ dài câu gốc |
| Đường ngữ điệu lệch với audio thật | Luật 1 đỉnh mỗi cụm + admin sửa |
| HV bỏ qua section tùy chọn | CTA ghi rõ thời gian ước tính cạnh "Bài tiếp", huy hiệu ✓ |
| Số câu quá nhiều gây ngán | Chỉ cần 3 câu ⭐ là xong bài |
| HV trình độ thấp không tự nghe ra lỗi | Nghe gốc → giọng mình liền nhau + đường cao độ vẽ chồng |
| Timing lệch | Forced alignment cả bài (91.8% từ lệch < 100ms), tự căn lại câu lỗi, câu chưa có mốc từ thì chỉ highlight cả câu |
| Tiếng loa lọt vào mic khi đọc đồng thời | Nhắc đeo tai nghe, bật `echoCancellation` |
