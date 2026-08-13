# Data còn thiếu — full test

Cập nhật 2026-07-27. Số liệu lấy trực tiếp từ `lib/full-tests/data/*.json` sau lần dựng gần nhất.

Bổ sung bằng cách thêm khối vào `scripts/full-tests/overrides.json` rồi chạy lại:

```bash
python scripts/full-tests/build_est2024.py --all
```

Override được áp **sau** khi parse nên chạy lại parser bao nhiêu lần cũng không mất.

---

## EST 2026 — không thiếu gì

10/10 đề đủ 200 câu, 200 đáp án, không câu hỏng. Câu 114 đề 1 đã vá qua override.

---

## 1. Thiếu đáp án — đang khoá 3 đề (ưu tiên cao nhất)

Đề nào còn thiếu đáp án thì **tự khoá**, người dùng không vào được. Bổ sung đủ là tự mở.

| Đề | Thiếu | Câu |
|---|---|---|
| EST 2024 đề 8 | **50 câu** | 101–150 (trọn Part 5 + Part 6) |
| EST 2024 đề 6 | 5 câu | 154, 157, 168, 169, 181 |
| EST 2024 đề 7 | 3 câu | 182, 185, 188 |

Đề 8 thiếu nhiều vì file `TEST 8-2024.docx` chỉ có phần Listening — không nhắc Part 5/6 lấy một lần, số `101` không xuất hiện trong toàn bộ file.

**Chỉ cần đáp án là đủ để mở khoá.** Dạng tối giản:

```json
{
  "est-2024-test-8": {
    "101": { "answer": "B" },
    "102": { "answer": "D" }
  }
}
```

Có giải thích thì thêm luôn, không bắt buộc:

```json
"101": {
  "answer": "B",
  "explanation": {
    "translation": "…",
    "reasoning": "…",
    "glossary": [{ "term": "…", "pos": "n", "ipa": "", "meaning": "…" }]
  }
}
```

---

## 2. Đáp án cần rà tay — 13 câu

Những câu này các nguồn trong file đáp án **mâu thuẫn nhau**. Parser đã lấy nguồn tin cậy hơn (bảng đáp án và nhãn rõ ràng thắng nguồn suy luận), nhưng nên xác minh vì sai đáp án tệ hơn thiếu đáp án.

| Đề | Câu (đáp án đang dùng) |
|---|---|
| 2 | 79 (D), 99 (A), 156 (D) |
| 3 | 70 (A), 105 (D) |
| 7 | 199 (A) |
| 8 | 85 (D), 90 (A) |
| 9 | 36 (C), 167 (D), 198 (B) |
| 10 | 186 (C), 190 (C) |

Sai thì sửa bằng override y như trên: `{ "79": { "answer": "B" } }`.

---

## 3. Part 1/2 thiếu phương án — 40 câu

Transcript 2024 là ASR thô, một số câu không cắt được đủ 4 (Part 1) hoặc 3 (Part 2) phương án.

**Không ảnh hưởng lúc làm bài** — Part 1/2 vốn không hiện chữ, thí sinh chỉ nghe. Chỉ ảnh hưởng trang review: những câu này hiện transcript thô thay vì các dòng A/B/C/D tách bạch.

| Đề | Câu |
|---|---|
| 1 | 1, 2, 4, 5, 6, 19 |
| 3 | 12 |
| 6 | 8, 30 |
| 7 | 8, 9, 15, 17, 21, 23, 31 |
| 8 | 7, 9, 13, 15, 17, 20, 27, 28 |
| 9 | 7, 17, 19, 23, 25, 26, 27, 30 |
| 10 | 6, 7, 12, 18, 22, 25, 26, 31 |

Bổ sung dạng:

```json
"19": {
  "options": { "A": "…", "B": "…", "C": "…" }
}
```

---

## 4. Passage đôi/ba Part 7 bị gộp — 50 set

Mỗi đề EST 2024 có 5 set gồm 2–3 văn bản (câu 176–180, 181–185, 186–190, 191–195, 196–200).

`TEST N RC.docx` là **text phẳng**: không ngắt trang, không bảng, không style, không dấu ngăn nào. Nên không có cách nào tách hai văn bản một cách đáng tin — hiện đang gộp thành một khối.

Nội dung **không mất chữ**, chỉ là không có nhãn "Passage 1 / Passage 2" như EST 2026.

**Cách sửa rẻ nhất**: chèn một dòng chỉ có `***` vào giữa hai văn bản trong docx, giống EST 2026. Parser đã hiểu ký hiệu đó sẵn — chỉ cần bỏ giới hạn 1 passage trong `parse_reading`.
