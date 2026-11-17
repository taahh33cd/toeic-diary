# Spec: Luyện đọc / Shadow sau Dictation

Trạng thái: **đã chốt, chưa làm**. Chỉ bắt đầu giai đoạn 1 khi có lệnh.

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

- `Sentence.wordTimings Json?`: `[{ w, start, end }]`, theo thứ tự từ của `content`.
- `Sentence.stressOverride Json?`: chỉ số các từ đỉnh nhấn do admin sửa. Null thì dùng luật tự động.
- `Sentence.isStarred Boolean?`: câu ⭐ do admin ghi đè.
- Bảng `ShadowProgress`: `userId, sentenceId, lessonId, part, day (date)`, unique `(userId, sentenceId, day)`.
- Không lưu file ghi âm. Bản ghi chỉ nằm trong bộ nhớ trình duyệt suốt phiên học.

## Timing từng từ

- Pipeline: dùng `scripts/forced_align_timestamps.py` (stable-whisper forced alignment). Script này căn chính transcript có sẵn vào audio nên mốc từ khớp 1:1 với `content`, chính xác hơn ASR (nhận dạng lại từ đầu) ở chỗ số, ký hiệu `$`, từ viết tắt. Thêm bước ghi `wordTimings` vào DB. Script chạy trên máy admin, từng đề một.
- Fallback khi câu chưa có `wordTimings`: chia `startTime..endTime` theo số âm tiết của từng từ, cộng thêm khoảng nghỉ ở dấu câu.
- Phát chậm dùng `playbackRate` với `preservesPitch`. Highlight bám theo `audio.currentTime` nên vẫn khớp ở mọi tốc độ.

## Báo cáo

- **Bảng Kết quả HV (admin)**: thêm cột Shadow (số câu, số bài đã xong).
- **Streak**: tính shadow là hoạt động học trong ngày, theo luật ở trên.
- **Lộ trình**: loại nhiệm vụ mới "Shadow N câu Part X", kiểm tra qua `ShadowProgress`.
- **Trang tiến độ HV**: tổng số câu và số bài đã shadow.
- **Trang admin riêng**: danh sách câu theo đề/Part, sửa từ nhấn và câu ⭐ hàng loạt.

## Giai đoạn

1. **UI Shadow**: chạy với timing ước lượng, gồm ngữ điệu, highlight, ghi âm, so sánh, cao độ của HV, Tự chạy, phím tắt, CTA. Tiến độ tạm giữ ở state trên trình duyệt.
2. **Dữ liệu tiến độ**: migration, API ghi `ShadowProgress`, kiểm tra câu đạt, streak, trang tiến độ HV, ghi sự kiện đo lường.
3. **Báo cáo + admin**: cột Shadow trong bảng admin, nhiệm vụ trong lộ trình, trang admin sửa từ nhấn và câu ⭐.
4. **Timing thật**: script forced-align ghi `wordTimings` vào DB, chạy lần lượt từng đề.

## Rủi ro đã cân nhắc

| Rủi ro | Cách xử lý |
|---|---|
| Ghi âm im lặng để lách số liệu | Kiểm tra có tiếng nói ≥ 50% độ dài câu gốc |
| Đường ngữ điệu lệch với audio thật | Luật 1 đỉnh mỗi cụm + admin sửa |
| HV bỏ qua section tùy chọn | CTA ghi rõ thời gian ước tính cạnh "Bài tiếp", huy hiệu ✓ |
| Số câu quá nhiều gây ngán | Chỉ cần 3 câu ⭐ là xong bài |
| HV trình độ thấp không tự nghe ra lỗi | Nghe gốc → giọng mình liền nhau + đường cao độ vẽ chồng |
| Timing ước lượng bị lệch | Forced alignment ở giai đoạn 4 |
| Tiếng loa lọt vào mic khi đọc đồng thời | Nhắc đeo tai nghe, bật `echoCancellation` |
