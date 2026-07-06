# Plan — Subskill IPA (`/subskills/ipa`)

> Luyện phát âm theo IPA: **Interactive Phonemic Chart** + **bài tập vowel / diphthong / consonant** chia 3 mức (easy / medium / hard).
> Tham khảo: EnglishClub phonemic chart · agendaweb phonetic exercises.

---

## 0. Quyết định đã chốt (design decisions)

| Chủ đề | Quyết định |
|--------|-----------|
| **URL** | `/subskills/ipa` |
| **2 section** | (1) Interactive Phonemic Chart · (2) Bài tập theo nhóm âm |
| **Accent** | **American GA** (hợp TOEIC). Diphthongs = 5 âm GA (`eɪ aɪ ɔɪ oʊ aʊ`), **không** có centering diphthongs kiểu Anh-RP |
| **Nhóm âm (chart 3 khối)** | Monophthongs (vowels) · Diphthongs · Consonants (24) |
| **Ô chart** | Ký hiệu IPA + 1 từ ví dụ nhỏ bên dưới (vd `iː` / "sheep"). Hover/click để nghe. Click → link "luyện âm này" |
| **Dạng bài v1** | Minimal pairs (nghe→chọn) · Sound ID (nghe/nhìn→chọn âm) · Odd one out · Sort `-s/-ed` & Transcription |
| **Section bài tập** | `vowels` · `diphthongs` · `consonants`, mỗi section × 3 mức, mỗi mức **3–4 bài**, ~**5 item/bài** |
| **Audio** | **Giai đoạn đầu: Web Speech API** (đọc *từ ví dụ*, không đọc ký hiệu IPA rời). **Sau: Google Cloud TTS** → mp3 tĩnh trong `public/audio/ipa/`. Bọc qua lớp `playWord()` / `playPhoneme()` để swap không đổi UI |
| **Nội dung** | Tôi generate, từ vựng **chủ đề TOEIC** (office / travel / business), GA |
| **DB** | **Bảng riêng `IpaAttempt`** (Prisma migration), **có resume giữa chừng** (`itemIdx`, `correctCount`) như Part 2 |
| **Feedback** | **Instant** sau mỗi câu + giải thích ngắn (vd "âm /iː/ dài hơn /ɪ/") |
| **Pass threshold** | **80**, làm lại **không giới hạn**, **replay không giới hạn** |
| **Nav** | Thêm **card thứ 5 "IPA / Pronunciation"** trên `/subskills`, đặt **trước Listening** |
| **Kiến trúc** | Module riêng `lib/subskills/ipa/` + component `IpaClient` (engine riêng, **không** nhồi vào `mcq` của Part 2) |

---

## Phase 0 — Scaffold & Navigation
**Mục tiêu:** Dựng khung route + đưa IPA vào trang subskills.

- [ ] Route `app/subskills/ipa/page.tsx` (index: hero + chart + danh sách section bài tập) — dùng CSS variables theming như các trang cũ.
- [ ] Thêm card thứ 5 `IPA / Pronunciation` vào mảng `SKILLS` trong `app/subskills/page.tsx`, **đặt ở đầu (trước Listening)**.
- [ ] Placeholder cho 2 section (chart + exercises) để render được.

**Verify:** `/subskills` hiện 5 card, IPA đứng đầu; click vào `/subskills/ipa` render trang không lỗi (build pass).

---

## Phase 1 — Lớp Audio (placeholder Web Speech)
**Mục tiêu:** Có API phát âm hoạt động thật ngay, dễ swap sang mp3 sau.

- [ ] `lib/subskills/ipa/audio.ts`:
  - `playWord(word: string)` → `speechSynthesis` đọc từ (chọn voice `en-US`).
  - `playPhoneme(phonemeId: string)` → nội bộ đọc **từ ví dụ** của âm (không đọc ký hiệu).
  - Feature-detect + fallback êm khi trình duyệt không hỗ trợ (nút hiện trạng thái "không phát được").
- [ ] Xử lý ràng buộc autoplay mobile: chỉ phát khi có user gesture (click).

**Verify:** Trên desktop + Android, bấm nút phát ra tiếng đúng từ; Safari/iOS không crash (degrade êm).

---

## Phase 2 — Interactive Phonemic Chart
**Mục tiêu:** Bảng IPA tra cứu, click nghe, link sang bài tập.

- [ ] `lib/subskills/ipa/chart.ts` — dữ liệu GA inventory, 3 nhóm. Mỗi phoneme:
  `{ id, symbol, exampleWord, highlight, group }` (highlight = phần chữ trong từ ứng với âm).
- [ ] Component `PhonemicChart`:
  - 3 khối (Monophthongs / Diphthongs / Consonants), lưới ô responsive.
  - Mỗi ô: ký hiệu lớn + từ ví dụ nhỏ; hover/click → `playPhoneme`.
  - Click → panel chi tiết (ký hiệu to, từ ví dụ, nút nghe, nút **"Luyện âm này →"** deep-link tới section/mức liên quan).

**Verify:** Chart render đủ 3 nhóm; click bất kỳ ô phát tiếng; nút "luyện âm này" điều hướng đúng.

---

## Phase 3 — Engine & kiểu bài tập (module riêng)
**Mục tiêu:** Chạy trọn 1 bài với feedback instant, replay, resume — dùng data giả trước.

- [ ] `lib/subskills/ipa/types.ts` — định nghĩa kiểu bài:
  - `audiochoice` (minimal pairs: nghe 1 từ → chọn từ đúng trong cặp/nhóm).
  - `soundid` (từ/audio → chọn âm chứa trong đó).
  - `oddoneout` (4 từ → chọn từ khác âm).
  - `sort` (xếp từ vào cột `/s/ /z/ /ɪz/` hoặc `/t/ /d/ /ɪd/`).
  - `transcription` (chọn phiên âm IPA đúng của từ / hoặc từ ↔ IPA).
- [ ] `lib/subskills/ipa/grade.ts` — chấm điểm **thuần, không AI**, per-item + tổng %.
- [ ] Component `IpaClient`:
  - Render từng item, **feedback instant** + giải thích ngắn.
  - Nút **replay không giới hạn**.
  - Thanh tiến độ, điểm, `passThreshold = 80`, cho **làm lại**.
  - Hạ tầng **resume** (đọc `itemIdx`/`correctCount` khi vào lại).

**Verify:** Với 1 exercise mock mỗi kiểu: chấm đúng %, feedback instant hiện, replay hoạt động, thoát giữa chừng vào lại đúng câu.

---

## Phase 4 — Nội dung (TOEIC-themed, GA)
**Mục tiêu:** Đủ data v1 cho 3 section × 3 mức.

- [ ] JSON theo `lib/subskills/ipa/data/{section}.{difficulty}.json`
  (vowels/diphthongs/consonants × easy/medium/hard) — mỗi mức **3–4 bài**, ~**5 item**.
  - Easy: nguyên âm đơn, minimal pairs cơ bản, letter→sound.
  - Medium: phụ âm khó (θ/ð, ʃ/tʃ, ʒ/dʒ, n/ŋ), đuôi `-s`/`-ed`, diphthongs.
  - Hard: âm dễ nhầm, transcription cả từ.
- [ ] Từ vựng ưu tiên ngữ cảnh TOEIC; mỗi item có giải thích ngắn cho feedback.
- [ ] Loader trong `lib/subskills/ipa/index.ts` (import JSON như Part 2).

**Verify:** Mọi set load không lỗi schema; đếm đúng số bài/mức; chạy thử vài bài thấy nội dung hợp lý.

---

## Phase 5 — Tracking tiến độ (bảng `IpaAttempt`)
**Mục tiêu:** Lưu điểm + resume + hiển thị tiến độ.

- [ ] Prisma model `IpaAttempt` (`section`, `difficulty`, `exerciseIndex`, `score`, `passed`, `itemIdx?`, `correctCount?`, timestamps, index `[userId, section, difficulty]`) + **migration**.
- [ ] API route lưu/đọc attempt (theo pattern route Part 2 hiện có).
- [ ] Wire vào `IpaClient`: lưu mid-exercise (resume) + khi hoàn thành.
- [ ] `/subskills/ipa` index: best score theo section/mức + stat card; card ở `/subskills` hiện dòng tiến độ.

**Verify:** Làm 1 bài → DB có bản ghi; thoát giữa chừng → vào lại resume; trang index hiện đúng best score.

---

## Phase 6 — Audio thật (Google Cloud TTS) — *chạy khi có key*
**Mục tiêu:** Thay Web Speech bằng mp3 GA chất lượng cao.

- [ ] `scripts/generate-ipa-audio.ts` dùng `@google-cloud/text-to-speech` (voice `en-US`, Neural2), đọc:
  - Toàn bộ từ ví dụ trong chart + mọi từ trong item bài tập.
  - Xuất `public/audio/ipa/<word>.mp3` + manifest map word→file.
- [ ] Đổi `audio.ts`: ưu tiên `new Audio('/audio/ipa/...')`, fallback Web Speech nếu thiếu file.
- [ ] Chạy generate 1 lần, commit mp3 (audio nhỏ nên OK cho repo).

**Verify:** Network tab thấy mp3 phục vụ; chart + bài tập phát mp3; offline Web Speech vẫn fallback.

---

## Phase 7 — Polish & Deploy
- [ ] Responsive chart (mobile), dark mode qua CSS vars, a11y (keyboard/aria cho nút âm), empty/error states.
- [ ] `npm run build` pass.
- [ ] Commit + push (deploy theo quy ước dự án).

**Verify:** Build sạch; kiểm mobile + dark mode; deploy xong smoke-test `/subskills/ipa` trên prod.

---

## Thứ tự & phụ thuộc
```
P0 → P1 → P2 ┐
              ├→ P3 → P4 → P5 → P7
        (P6 chèn sau khi có Google TTS key; trước đó Web Speech gánh)
```
- P0–P5 + P7 chạy được **độc lập với key TTS** (nhờ Web Speech placeholder).
- P6 là bước "nâng cấp audio", không chặn phần còn lại.

## Rủi ro / lưu ý
- **Web Speech không đọc ký hiệu IPA rời** → luôn đọc *từ ví dụ*. (Đã thống nhất.)
- **iOS/Safari** Web Speech kém ổn định → cần fallback êm; audio thật (P6) giải quyết triệt để.
- **Autoplay mobile**: chỉ phát sau user gesture.
- Diphthongs GA chỉ 5 âm (khác EnglishClub Anh-RP) — chart & nội dung theo GA.
