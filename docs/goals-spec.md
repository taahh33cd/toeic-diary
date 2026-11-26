# Mục tiêu điểm — spec (chốt 26/11/2026)

## 1. Dải mục tiêu trên `/journal`
- Đặt **trên cùng, trên lời chào**, to, luôn hiện.
- Hiện mọi kỳ đã đặt (L&R và/hoặc S&W); kỳ chưa đặt thì ẩn. Chưa đặt kỳ nào → chỉ nhắc + nút "Đặt mục tiêu", không chặn.
- Mỗi kỳ: con số mục tiêu, hạn (tháng) + "còn N ngày" (tới cuối tháng hạn), điểm gần nhất (điểm tự nhập + full test online) và khoảng cách. Đạt → "✓ Đã đạt". Quá hạn chưa đạt → "Đã quá hạn" + nhắc đặt hạn mới.
- Nhãn người đặt: "GV đặt ngày …" khi GV sửa.

## 2. Mục tiêu tổng
- HV và GV đều đặt được (`goals/{code}` trên Firebase, ghi thêm `setByRole/setByName`). GV đặt → HV nhận thông báo.

## 3. Mục tiêu part theo tháng (chỉ L&R)
- **GV đặt, HV chỉ xem.** Lưu Postgres `part_goals (student_code, month)`.
- Mỗi part: ngưỡng nhập theo đề chuẩn (`5/6`) → so bằng % (`correct·of ≥ ngưỡng·gradable`, tức làm tròn lên), và số lần cần đạt (mặc định 5, riêng từng part).
- Một "lần" = một part trong: full test online · lượt luyện lẻ `/practice` (trọn 1 part của 1 đề) · điểm tự nhập có chi tiết part. **Không** tính `/reading-practice`.
- Bỏ lần có số câu chấm < 50% số câu chuẩn của part. Cùng đề làm lại → lấy lần tốt nhất. Điểm tự nhập: mỗi lần nhập tính riêng.
- Tính theo tháng lịch (giờ VN), kể cả bài làm trước khi GV đặt.
- Tiến độ: đạt part khi số lần đạt ≥ số lần cần; đạt tháng khi đạt mọi part đã đặt → chúc mừng + XP + huy hiệu.
- GV: gợi ý từ mục tiêu tổng, chép tháng trước, đặt hàng loạt, đặt trước tháng tương lai; tháng đã qua chỉ xem.
- Tháng chưa có mục tiêu → HV không thấy phần part.
- Nhắc GV: popup ở admin (tắt → hiện lại hôm sau) + badge menu "Mục tiêu". Từ ngày 25 nhắc tháng sau; trong tháng nhắc nếu còn thiếu. Đối tượng: HV đang học (không đóng băng), kỳ L&R; kèm danh sách HV chưa có mục tiêu tổng.
- HV bấm ô part → danh sách các lần trong tháng (đề, ngày, % đúng, đạt/chưa). Lịch sử các tháng ở `/journal/scores`.

## Ngoài phạm vi đợt này
Gộp với roadmap AI, S&W theo tháng, bảng theo lớp, push nhắc cuối tháng.
