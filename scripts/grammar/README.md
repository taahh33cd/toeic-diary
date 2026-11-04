# Pipeline data cho khu `/grammar`

Hai script, chạy theo thứ tự. Cả hai đều **thuần tính toán lại từ nguồn gốc**, chạy
bao nhiêu lần cũng ra cùng kết quả — không bao giờ cộng dồn vào data đã có.

```bash
node scripts/grammar/parse-docs.mjs              # Docs -> parsed.json
node scripts/grammar/build-questions.mjs         # chấm độ khó, xem báo cáo (không ghi)
node scripts/grammar/build-questions.mjs --write # ghi lib/grammar/questions.ts
```

## Nguồn

Google Docs **"BÀI TẬP NGỮ PHÁP"**, id `1H0Pi__jHc8lpztuo42acICaLGYExd2xMY64iUau2zlc`.
Doc chia **6 thẻ (tab)**, mỗi thẻ là một `.txt` trong `scripts/data/grammar-docs/`:

| File | Thẻ trong Docs | Topic ở /grammar | Câu |
|---|---|---|---|
| `01-part5-tong-hop-1.txt` | PART 5 TỔNG HỢP (1) | Part 5 tổng hợp | 416 |
| `02-part5-tong-hop-2.txt` | PART 5 TỔNG HỢP (2) | Part 5 tổng hợp | 350 |
| `03-dong-tu-khuyet-thieu.txt` | ĐỘNG TỪ KHUYẾT THIẾU | Động từ khuyết thiếu | 50 |
| `04-danh-dong-tu-nguyen-the.txt` | DANH ĐỘNG TỪ VÀ ĐỘNG TỪ NGUYÊN THỂ | Danh động từ & Nguyên thể | 50 |
| `05-menh-de-danh-ngu.txt` | MỆNH ĐỀ DANH NGỮ | Mệnh đề danh ngữ | 50 |
| `06-so-sanh.txt` | SO SÁNH | So sánh (nối vào bank cũ) | 50 |

Tải lại khi Docs đổi — **phải tải từng thẻ**, vì bản export không tham số chỉ gộp
nội dung mà không in tên thẻ nên không còn mốc nào phân biệt thẻ 1 với thẻ 2:

```bash
curl -sL -o scripts/data/grammar-docs/03-dong-tu-khuyet-thieu.txt "https://docs.google.com/document/d/1H0Pi__jHc8lpztuo42acICaLGYExd2xMY64iUau2zlc/export?format=txt&tab=t.lkpazl2zek0p"
```

Tab id của 6 thẻ, theo thứ tự bảng trên: `t.8h3jgxk9ni9k`, `t.f2u7qndu81k4`,
`t.lkpazl2zek0p`, `t.j7w9y4w97wp4`, `t.jj0y0d422ol8`, `t.uwxrngcmzkrv`. Lấy lại danh
sách khi Docs thêm thẻ: tải trang `/preview` rồi grep `{"ty":"ac","d":["t.`.

## `parse-docs.mjs`

Doc được soạn nhiều lần nên có **4 format câu hỏi lẫn nhau**, parser nhận cả 4:

1. `1. Câu hỏi: <câu> A. x B. y C. z D. w` — tất cả trên một dòng.
2. `Câu 1` rồi câu hỏi và A/B/C/D mỗi dòng một đáp án.
3. `6. Câu hỏi:` để trống, câu hỏi xuống dòng dưới, có thêm trường `Phân loại câu hỏi:`.
4. Như trên nhưng mọi nhãn bị gắn bullet: `* Đáp án:`, `* * Giải thích:`, `* Câu 3: …`.

Nhãn trường cũng hai kiểu: `Đáp án:` / `Đáp án đúng:`, `Từ vựng:` / `Từ vựng quan trọng:`.
Riêng `Từ vựng:` kiểu 1 có loại từ (`Settle (v): giải quyết`), kiểu 2 không có
(`* Organizer: người tổ chức`) nên `core_vocabulary[].type` sẽ rỗng ở phần đó.

Output: `parsed.json` (966 câu) + `parse-report.txt` (số câu từng test, cảnh báo).

### `overrides.json` — vá tay chỗ Docs ghi thiếu

Docs có chỗ chỉ ghi dòng `Đáp án` mà không liệt kê A/B/C/D (hiện 7 câu ở
`PART 5 TỔNG HỢP (1)` > `SUBMARINE 2024` > `Lesson 4` > `Test 2`). Thay vì sửa file
`.txt` — tải lại Docs là mất — thì điền vào `overrides.json`, parser đọc và đè lên.

Khoá là **nội dung câu hỏi**, so khớp sau khi bỏ dấu câu và gộp mọi chỗ trống thành
`___`; không dùng id vì id đánh theo vị trí, Docs thêm/bớt một câu là lệch hết. Nếu
Docs sửa lại câu hỏi thì khoá hết khớp và `parse-report.txt` in cảnh báo
"vá KHÔNG khớp câu nào" — đừng bỏ qua, nó có nghĩa là câu đó lại thiếu đáp án.

Đánh dấu `"distractors_authored": true` cho câu mà 3 đáp án nhiễu là tự soạn, không
lấy được từ phần Giải thích trong Docs.

## `build-questions.mjs`

Dựng `lib/grammar/questions.ts` từ đúng hai file, nên idempotent:

- `base-questions.json` — 3.025 câu của bank cũ, **ảnh chụp trước khi import**. Đừng sửa.
- `parsed.json` — data Docs. Câu nào vẫn thiếu A/B/C/D sau khi áp `overrides.json` thì
  bị bỏ và liệt kê trong báo cáo (hiện 0 câu).

Biên test lấy từ `testSizes` trong `lib/grammar/topics.ts` — đó là nguồn duy nhất.
Test cũ giữ nguyên câu nào thuộc test nào; test từ Docs nối vào sau. Script tự đối
chiếu `testSizes` khai báo với số câu thực tế và in mục "LỆCH testSizes" nếu vênh;
khai thiếu một test là test đó mất khỏi web mà không báo lỗi gì.

### Rubric độ khó

Bốn tiêu chí, mỗi tiêu chí quy về **phân vị 0–10 trên toàn bank** rồi mới cộng theo
trọng số (đơn vị gốc khác nhau, cộng thẳng là một tiêu chí đụng trần sẽ lấn hết):

| Tiêu chí | Trọng số | Đo bằng |
|---|---|---|
| Dạng ngữ pháp con | 0.35 | Từ khoá trong phần giải thích, 5 bậc; lấy bậc cao nhất khớp được |
| Độ gây nhiễu đáp án | 0.25 | 4 đáp án càng ít giống nhau càng khó (phải hiểu nghĩa, không đoán hậu tố được); đáp án nhiều từ thì cộng thêm |
| Độ phức tạp câu | 0.20 | Số từ + số mệnh đề + số dấu phẩy |
| Độ khó từ vựng | 0.20 | Tỉ lệ từ ≥ 6 ký tự không nằm trong danh sách từ hay gặp, cộng thêm theo độ dài từ |

Trong mỗi test, câu được sắp **tăng dần theo điểm tổng**. Nhãn `difficulty`
(Dễ / Trung bình / Khó) chia theo phân vị 1/3 – 2/3 của **toàn bank**, không theo
từng test, để nhãn "Khó" ở test nào cũng cùng nghĩa — nên có test không có câu nào
nhãn "Dễ", đó là đúng.

Danh sách từ hay gặp (`COMMON`) là heuristic viết tay, không phải từ điển tần số.
Muốn đổi cách chấm thì sửa `GRAMMAR_TIERS` / `WEIGHTS` / `COMMON` rồi chạy lại.

Output: `difficulty-report.csv` (mỗi câu một dòng: thứ tự cũ → mới, điểm từng tiêu
chí, bậc) + `build-report.txt`.
