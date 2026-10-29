# PLAN — Tích hợp Flashcard & Bộ từ vựng vào web học viên

> Nguồn: dự án **FlashCards Pro** (Vite + React 19, 13 file, `C:\Users\Admin\Documents\FULL_CODEBASE.txt` + bản build `dist/`)
> Đích: `toeic-dictation-master` (Next.js 16.2.3 + Prisma 7/Postgres + Firebase RTDB + Gemini)
> Lập: 2026-10-25 · Cập nhật: 2026-10-26

## Tiến độ

| Phase | Trạng thái | Commit |
|---|---|---|
| 0 — Gom SRS về một nguồn | ✅ xong, đo trên dữ liệu thật | `bc841a3` |
| 1A — Schema + migrate kho từ | ✅ xong, 39 bộ / 583 thẻ / 579 tiến độ | `d22bce7` |
| 1B.1 — API bộ thẻ (CRUD) | ✅ xong, 15/15 kiểm đạt | `43a807a` |
| 1B.2 — Đường ghi SRS + chuyển badge/cron sang Postgres | ✅ xong, 37+14 kiểm đạt | `16d24be` |
| 1B.3 — Trang vocab ghi vào Postgres | ✅ xong, đo trên phiên thật | `fb1d5ce` |
| 1B.4 — 3 trang bộ thẻ (lưới, chi tiết, tạo bộ) | ✅ xong | `931c771` |
| 1B.5 — Thân trang vocab đọc Postgres | ✅ xong, trang = badge | `53ad511` |
| 1C.1 — AI điền nghĩa/IPA/ví dụ cho danh sách dán vào | ✅ xong | `177451a` |
| 1C.2 — Sinh bộ từ nội dung đã học (4 nguồn) | ✅ xong | `0687234` |
| 1C.3 — Màn sửa thẻ trong bộ đã lưu | ✅ xong | `bd171e8` |
| 1D.1 — Link chia sẻ công khai | ✅ xong | `cdba9f5` |
| 1D.2 — GV giao bộ thẻ + theo dõi tiến độ | ✅ xong | `64cf02f` |
| 2.1 — Engine quiz 10 dạng + ghi phiên + XP | ✅ xong, 25/25 kiểm | `1a1e259e` |
| 2.2 — Ảnh (Pexels proxy + upload Cloudinary) | ⏳ đang tới | |
| 2.3 — Thống kê tiến độ | ⬜ | |
| 2.4 — Cron nhắc + hiệu chỉnh ngưỡng nhanh/chậm | ⬜ | |

**Lỗi công thức đã sửa (§5):** "nửa trọng số" ban đầu hiểu thành `ease × 0.5`,
cho hệ số 0.65–1.4 nên `round(1 × 1.25) = 1` — lật thẻ không bao giờ thoát mốc
1 ngày. Sửa thành nội suy `1 + (ease−1)/2`, cộng chốt "mỗi lượt đúng tiến ít
nhất 1 ngày". Test `scripts/test-srs-apply.ts` bắt được.

Việc **chưa** làm dù plan có ghi: thu hồi Pexels key cũ (phải làm ở dashboard
Pexels, em không làm thay được) — xem §2.2 #1.

---

## 0. Mười hai quyết định đã chốt

| # | Vấn đề | Chốt |
|---|--------|------|
| 1 | Quan hệ với `/journal/vocab` | **Thay thế** — nâng cấp trang hiện có thành trang bộ thẻ |
| 2 | Ai tạo/chia sẻ | Học viên tự tạo · chia sẻ link cho người ngoài · GV giao bài · (thư viện bộ mẫu: để sau) |
| 3 | Cơ chế link | **Short link đọc DB** `/flashcards/d/{slug}` — bỏ hẳn `?setId=` và `?data=` |
| 4 | AI | Dán danh sách → AI điền phần còn lại · Sinh bộ từ nội dung đã học trong hệ thống |
| 5 | Nơi lưu | **Postgres hết** (Prisma) |
| 6 | Migrate kho từ cũ | Tự tạo **7 bộ theo Part**, giữ nguyên `repCount`/`lastReview` |
| 7 | SRS | **Tự động suy từ kết quả quiz** — không bắt học viên tự đánh giá |
| 8 | Ảnh | Pexels qua route server (**thu hồi key cũ**) + học viên tự upload Cloudinary |
| 9 | Lật thẻ | **Có** nút Thuộc / Chưa thuộc, đẩy SRS với **nửa trọng số** so với quiz |
| 10 | Quiz | Giữ đủ 10 dạng gốc + **sửa lỗi 1 câu/thẻ** |
| 11 | Khách không login | Học được, tiến độ lưu localStorage, cuối phiên mời đăng ký |
| 12 | GV cần thấy | Ai đã làm bộ được giao + điểm · Tổng quan kho từ từng HV · Nhắc tự động khi bỏ ôn |

---

## 1. Hiện trạng — cái gì đã có, cái gì thiếu

### Web học viên đã có sẵn (phải tái dùng, không viết lại)

| Thành phần | Vị trí | Dùng vào đâu |
|---|---|---|
| Kho từ mỗi HV | RTDB `vocab/{studentCode}`, type `VocabWord` | Nguồn migrate |
| SRS + badge "đến hạn" | `journal/vocab/page.tsx`, `hooks/firebase/useNavBadges.ts` | Phải thống nhất lại (xem §2) |
| 5 chế độ luyện | `InlineFlashcard`, `FlashcardModal`, `WriteModal`, `ListenWriteModal`, `DifficultWordsSidebar` | Port sang engine mới |
| Tra từ + Gemini điền nghĩa | `QuickAddBar` + `/api/ai/word-meaning` (cache RTDB `vocab_word_cache`) | Luồng AI enrich |
| Sinh từ vựng từ transcript | `/api/ai/extract-vocabulary` (gemini-2.5-flash-lite) | Luồng AI từ nội dung |
| TTS chất lượng cao | `/api/tts` (Google Neural2-F) + fallback Web Speech | 4 dạng quiz nghe |
| Upload ảnh/media | `lib/cloudinary/upload.ts` + `browser-image-compression` | Ảnh thẻ |
| Giao bài tập | RTDB `homework/{code}`, `HwItem { text, link, desc }`, trang `/admin/homework` | GV giao bộ thẻ |
| XP / streak / push / cron | `lib/xp-client.ts`, hệ push + `app/api/cron` | Thưởng + nhắc ôn |
| Flashcard có queue "chưa thuộc" | `components/subskills/speaking/vocab/FlashcardDeck.tsx` | Mẫu cho nút Thuộc/Chưa thuộc |

### FlashCards Pro có mà web chưa có

- Khái niệm **bộ thẻ** (title/description) — web hiện chỉ gom phẳng theo Part 1-7
- **Ảnh trên thẻ** + 6/10 dạng quiz dựa vào ảnh
- **Link chia sẻ / giao bài**
- 10 dạng quiz (web có 5)

---

## 2. Lỗi phải sửa — gồm một lỗi đang có trên production

### 2.1 Lỗi của repo hiện tại (phát hiện khi đọc code, không phải do tích hợp)

**SRS lệch giữa badge và trang vocab.** Hai nơi định nghĩa interval khác nhau:

| | `journal/vocab/page.tsx:22` | `useNavBadges.ts:11` |
|---|---|---|
| Bảng interval | `[0, 1, 3, 7, 14, 30, 60]` | `[1, 3, 7, 14, 30, 90, 180]` |
| Từ chưa ôn lần nào | interval 0 → đến hạn ngay | `return true` → đến hạn ngay |
| Ngưỡng thuộc | bỏ từ có `repCount >= 10` | **không áp dụng** |

Hệ quả: badge trên nav và danh sách "đến hạn" trong trang **luôn lệch số**, và badge còn đếm cả từ đã thuộc. Phase 0 gom về một nguồn chân lý `lib/vocab/srs.ts`.

### 2.2 Lỗi/rủi ro của FlashCards Pro — không port sang

| # | Vấn đề | Xử lý |
|---|--------|-------|
| 1 | **Pexels API key hardcode trong client** (`SetCreator.jsx:19`, key đã lộ công khai trong cả bundle `dist/`) | **Thu hồi key ngay**, cấp key mới chỉ nằm ở env server, gọi qua `/api/flashcards/images` |
| 2 | Link giao bài `?setId=` đọc localStorage máy học viên | Bỏ hẳn — thay bằng short link đọc DB |
| 3 | Link `?data=` nén LZ-String, vỡ khi bộ > ~15-20 thẻ | Bỏ hẳn (bác đã chọn short link DB) |
| 4 | localStorage là nơi lưu duy nhất | Postgres |
| 5 | Proxy CORS `api.allorigins.win` (bên thứ ba lạ) | Gọi dictionary API **từ server**, không cần proxy |
| 6 | Mỗi thẻ sinh **1 câu, random 1 dạng** | Sinh câu cho **mọi dạng đã chọn** (§6.2) |
| 7 | Kết quả quiz không lưu | `VocabQuizSession` + `VocabQuizItem` |
| 8 | Không có SRS | Dùng SRS tự động (§5) |
| 9 | Toàn bộ style viết inline trong JSX | Viết lại theo Tailwind + CSS var của journal (chất liệu giấy) |

---

## 3. Schema Postgres

Nguyên tắc đã chốt: **nội dung thẻ thuộc bộ, tiến độ ôn thuộc TỪ.**
`VocabCard` giữ nội dung (mỗi bộ một bản, GV sửa bộ mình không ảnh hưởng ai);
`VocabProgress` khoá theo `(userId, wordKey)` nên học "negotiate" ở bộ nào cũng đẩy chung một tiến độ, và badge "đến hạn" không đếm trùng.

```prisma
model VocabDeck {
  id          String   @id @default(cuid())
  ownerId     String   @map("owner_id")
  owner       Profile  @relation("DeckOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  title       String
  description String?  @db.Text
  slug        String   @unique                      // 10 ký tự base58, dùng cho link public
  visibility  String   @default("private")          // "private" | "link" | "library"
  source      String   @default("manual")           // "manual" | "ai_bulk" | "ai_content" | "migrated"
  sourceRef   String?  @map("source_ref")           // lessonId / passageId / "error-log"
  part        Int?                                  // 1-7, tuỳ chọn
  cardCount   Int      @default(0) @map("card_count")
  clonedFrom  String?  @map("cloned_from")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  cards       VocabCard[]
  assignments VocabDeckAssignment[]
  sessions    VocabQuizSession[]

  @@index([ownerId, updatedAt])
  @@index([visibility])
  @@map("vocab_decks")
}

model VocabCard {
  id            String    @id @default(cuid())
  deckId        String    @map("deck_id")
  deck          VocabDeck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  word          String
  wordKey       String    @map("word_key")          // normalizeWord(word) — khoá nối tiến độ
  ipa           String?
  pos           String?                              // "n" | "v" | "adj" | "adv" | "phrase"
  meaningVi     String?   @map("meaning_vi")
  definition    String?   @db.Text
  example       String?   @db.Text
  imageUrl      String?   @map("image_url")
  imagePublicId String?   @map("image_public_id")   // Cloudinary — để xoá được ảnh
  audioUrl      String?   @map("audio_url")
  order         Int       @default(0)
  createdAt     DateTime  @default(now()) @map("created_at")

  @@unique([deckId, wordKey])                        // không trùng từ trong một bộ
  @@index([deckId, order])
  @@map("vocab_cards")
}

model VocabProgress {
  id           String    @id @default(cuid())
  userId       String    @map("user_id")
  profile      Profile   @relation(fields: [userId], references: [id], onDelete: Cascade)
  wordKey      String    @map("word_key")
  word         String                                 // dạng hiển thị gần nhất
  repCount     Int       @default(0) @map("rep_count")
  intervalDays Int       @default(0) @map("interval_days")
  ease         Float     @default(2.5)
  lapses       Int       @default(0)
  seenCount    Int       @default(0) @map("seen_count")
  wrongCount   Int       @default(0) @map("wrong_count")
  mastered     Boolean   @default(false)
  lastReview   DateTime? @map("last_review")
  dueAt        DateTime? @map("due_at")               // tính sẵn → badge chỉ 1 câu COUNT
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@unique([userId, wordKey])
  @@index([userId, dueAt])
  @@index([userId, mastered])
  @@map("vocab_progress")
}

model VocabQuizSession {
  id           String    @id @default(cuid())
  userId       String?   @map("user_id")              // null = khách qua link public
  guestKey     String?   @map("guest_key")            // id ẩn danh từ localStorage, chỉ để đếm
  deckId       String    @map("deck_id")
  deck         VocabDeck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  assignmentId String?   @map("assignment_id")
  modes        String[]                                // ["word-to-image", "listen-to-typing", ...]
  runMode      String    @default("practice") @map("run_mode") // "practice" | "exam"
  total        Int       @default(0)
  correct      Int       @default(0)
  durationMs   Int?      @map("duration_ms")
  startedAt    DateTime  @default(now()) @map("started_at")
  finishedAt   DateTime? @map("finished_at")

  items        VocabQuizItem[]

  @@index([userId, finishedAt])
  @@index([deckId, finishedAt])
  @@map("vocab_quiz_sessions")
}

model VocabQuizItem {
  id        String           @id @default(cuid())
  sessionId String           @map("session_id")
  session   VocabQuizSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  wordKey   String           @map("word_key")
  quizType  String           @map("quiz_type")
  correct   Boolean
  answerMs  Int?             @map("answer_ms")
  given     String?                                    // học viên gõ gì (dạng typing)

  @@index([sessionId])
  @@index([wordKey, correct])                           // "top từ hay sai"
  @@map("vocab_quiz_items")
}

model VocabDeckAssignment {
  id          String    @id @default(cuid())
  deckId      String    @map("deck_id")
  deck        VocabDeck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  assignedBy  String    @map("assigned_by")            // Profile.id của GV
  studentCode String    @map("student_code")           // khớp hệ RTDB hiện có
  classId     String?   @map("class_id")
  activity    String    @default("quiz")               // "study" | "quiz"
  modes       String[]
  minScore    Int?      @map("min_score")              // % để tính "xong"
  dueDate     DateTime? @map("due_date")
  homeworkId  String?   @map("homework_id")            // hw id ở RTDB để đối chiếu
  createdAt   DateTime  @default(now()) @map("created_at")

  @@unique([deckId, studentCode])
  @@index([studentCode, dueDate])
  @@map("vocab_deck_assignments")
}
```

Thêm vào `model Profile`:
```prisma
  ownedDecks     VocabDeck[]        @relation("DeckOwner")
  vocabProgress  VocabProgress[]
```

**Chuẩn hoá từ** — `lib/vocab/normalize.ts`:
```ts
export function normalizeWord(w: string) {
  return w.trim().toLowerCase().replace(/\s+/g, " ");
}
```
Giữ dấu gạch nối và khoảng trắng giữa từ (để `take off` ≠ `takeoff`), chỉ gộp khoảng trắng thừa.

**Migration**: viết tay theo đúng lệ của repo — `prisma/manual-migrations/008_vocab_decks.sql`, chạy qua Supabase MCP (`apply_migration`). `prisma/migrations/` trong repo đang rỗng, DDL không đi qua pooler.

---

## 4. Migrate kho từ RTDB → Postgres

Script `scripts/migrate-vocab-to-decks.ts` (chạy `tsx`, có `--dry-run`):

1. Đọc `vocab/` toàn bộ → map `studentCode` sang `Profile.id` qua `profiles.student_code`.
2. Mỗi học viên: nhóm từ theo `part` (1-7, không có part → nhóm "Khác").
3. Mỗi nhóm tạo 1 `VocabDeck`: `title = "Từ vựng Part N"`, `source = "migrated"`, `part = N`, `visibility = "private"`.
4. Mỗi từ tạo 1 `VocabCard` (word, ipa, pos, meaningVi ← `vi`, definition ← `def`, example, audioUrl).
5. Mỗi từ tạo/cập nhật 1 `VocabProgress`:
   - `repCount` ← giữ nguyên
   - `intervalDays` ← `[0,1,3,7,14,30,60][min(repCount, 6)]` (bảng của **trang vocab**, không phải của badge)
   - `ease` ← `2.5`
   - `lastReview` ← `lastReview` cũ
   - `dueAt` ← `lastReview + intervalDays`; không có `lastReview` → `dueAt = now()` (đến hạn ngay, giống hành vi cũ)
   - `mastered` ← `repCount >= 10`
   - Từ trùng ở nhiều part: **một** `VocabProgress`, lấy `repCount` lớn nhất.
6. In báo cáo: số HV, số bộ, số thẻ, số từ trùng, số từ không map được.

**An toàn**: giữ nhánh RTDB `vocab/` nguyên vẹn ít nhất 1 tháng (chỉ đọc) để rollback. Trang mới đọc Postgres; không ghi RTDB `vocab/` nữa.
Nhớ dọn luôn `saveForgottenWords` / `loadForgottenWords` trong `lib/firebase/helpers.ts` khi đã chuyển xong.

---

## 5. SRS tự động — `lib/vocab/srs.ts`

Một nguồn chân lý duy nhất cho cả badge, trang, API. SM-2 rút gọn, chất lượng suy ra từ kết quả chứ không hỏi học viên.

### Tín hiệu vào → chất lượng

| Hành động | Chất lượng | Tác động |
|---|---|---|
| Quiz **sai** | 1 (lapse) | `intervalDays = 0`, `ease -= 0.20` (sàn 1.3), `lapses++`, `wrongCount++`, `repCount` giữ nguyên |
| Quiz **đúng chậm** | 3 | `intervalDays = max(1, round(interval × ease × 0.8))`, `repCount++` |
| Quiz **đúng nhanh** | 4 | `intervalDays = max(1, round(interval × ease))`, `ease += 0.05` (trần 2.8), `repCount++` |
| Lật thẻ → **Thuộc** | 3, **nửa trọng số** | chỉ áp dụng khi thẻ đang đến hạn; `intervalDays = max(1, round(interval × ease × 0.5))`, `repCount++`, `seenCount++` |
| Lật thẻ → **Chưa thuộc** | 1 | `intervalDays = 0`, `ease -= 0.10`, **không** tăng `wrongCount` (chưa thuộc ≠ trả lời sai) |

- Lần đầu gặp từ (`repCount = 0`): đúng → `intervalDays = 1`; sai → `0`.
- `dueAt = lastReview + intervalDays` (ngày, theo giờ VN).
- `mastered = repCount >= 10 || intervalDays >= 60` — giữ ngưỡng 10 cũ để không đổi cảm giác của học viên.

### Ngưỡng "nhanh / chậm" — **cần đo lại, đừng đoán**

Đề xuất khởi điểm, theo dạng câu hỏi:

| Nhóm dạng | Ngưỡng "nhanh" |
|---|---|
| Chọn đáp án chữ (`word-to-meaning`, `meaning-to-word`) | ≤ 6 giây |
| Chọn đáp án ảnh (`word-to-image`, `image-to-word`, `listen-to-image`) | ≤ 8 giây |
| Gõ từ (`*-to-typing`) | ≤ 15 giây |

Ba số này là **phỏng đoán**, phải hiệu chỉnh bằng dữ liệu `VocabQuizItem.answerMs` thật sau 2 tuần (giống cách đã làm với ngưỡng subskill Chunking). Để trong một hằng số riêng `SPEED_THRESHOLD_MS` để sửa một chỗ.

---

## 6. Engine quiz

### 6.1 Mười dạng (giữ nguyên id của bản gốc để tái dùng được logic)

| id | Mô tả | Cần ảnh | Cần TTS |
|---|---|---|---|
| `word-to-image` | Nhìn từ → chọn ảnh | ✓ | |
| `image-to-word` | Nhìn ảnh → chọn từ | ✓ | |
| `image-to-typing` | Nhìn ảnh → gõ từ | ✓ | |
| `word-to-meaning` | Từ → chọn nghĩa | | |
| `meaning-to-word` | Nghĩa → chọn từ | | |
| `meaning-to-typing` | Nghĩa → gõ từ | | |
| `listen-to-word` | Nghe → chọn từ | | ✓ |
| `listen-to-image` | Nghe → chọn ảnh | ✓ | ✓ |
| `listen-to-meaning` | Nghe → chọn nghĩa | | ✓ |
| `listen-to-typing` | Nghe → gõ từ | | ✓ |

### 6.2 Sửa lỗi "1 câu/thẻ"

Bản gốc: mỗi thẻ random **một** dạng → chọn 10 dạng với bộ 20 thẻ vẫn chỉ ra 20 câu.
Mới: sinh câu cho **mọi dạng đã chọn mà thẻ đủ dữ liệu** → 20 thẻ × 3 dạng = 60 câu, xáo trộn, chặn hai câu cùng từ nằm liền nhau.

Thứ tự ưu tiên khi số câu vượt mức học viên muốn làm:
1. Từ **đến hạn** trước
2. Trong đó, dạng mà từ đó **hay sai nhất** (từ `VocabQuizItem`) trước
3. Còn lại xáo trộn

Thẻ thiếu ảnh thì tự loại khỏi 4 dạng cần ảnh (giống bản gốc), và báo rõ trên màn chọn dạng: "3/20 thẻ chưa có ảnh — dạng ảnh sẽ bỏ qua các thẻ này".

### 6.3 Phương án nhiễu (distractor)

Bản gốc lấy ngẫu nhiên trong bộ. Nâng nhẹ: ưu tiên từ **cùng loại từ** (`pos`) và **khác nghĩa rõ ràng**, để không ra đáp án nhiễu vô nghĩa. Bộ < 4 thẻ thì chuyển dạng gõ (không đủ phương án).

---

## 7. AI — hai luồng đã chọn

### 7.1 Dán danh sách → AI điền phần còn lại

`POST /api/flashcards/ai/enrich` — nhận `{ words: string[] }` (hoặc `word\tmeaning` mỗi dòng), trả về thẻ đã điền.

Thứ tự gọi, rẻ trước đắt sau, **tất cả ở server** (không còn proxy CORS):
1. **Cache** RTDB `vocab_word_cache/{key}` — đã có sẵn, dùng ngay
2. `api.dictionaryapi.dev` → IPA, `pos`, definition, `audioUrl`
3. `api.datamuse.com` (`md=r&ipa=1`) → IPA khi bước 2 trượt
4. **Gemini** (`gemini-2.5-flash-lite`) → nghĩa Việt + câu ví dụ TOEIC — tái dùng hẳn prompt của `/api/ai/word-meaning`
5. `MyMemory` → nghĩa Việt khi Gemini lỗi
6. Ghi lại cache

Gộp cả danh sách vào **một** lần gọi Gemini (danh sách JSON vào, JSON ra) thay vì một lần mỗi từ — 50 từ hiện tại sẽ là 50 request.

### 7.2 Sinh bộ từ nội dung học viên đã học

`POST /api/flashcards/ai/from-content` — nhận `{ source, ref }`:

| `source` | Lấy dữ liệu từ | Ghi chú |
|---|---|---|
| `lesson` | `Sentence` của `Lesson` (bài dictation/listening) | Nối transcript, dùng `/api/ai/extract-vocabulary` |
| `reading` | `ReadingPassage.content` | Giới hạn 1.200 ký tự như route hiện có |
| `wrong-answers` | `GrammarAttempt` + `FullTestAttempt` + `PartPracticeAttempt` sai | **Giá trị sư phạm cao nhất** — ôn đúng chỗ yếu |
| `error-log` | RTDB sổ lỗi của HV | |

Sau khi AI trả về danh sách từ → đi tiếp qua luồng §7.1 để điền IPA/ảnh → tạo `VocabDeck` với `source`, `sourceRef` để truy nguồn.

### 7.3 Rate limit — hiện **chưa có gì**

`@upstash/ratelimit` + `@upstash/redis` đã cài trong `package.json` nhưng **không nơi nào dùng** (grep sạch). Hai route AI mới là nơi đầu tiên cần:

| Route | Đề xuất |
|---|---|
| `/api/flashcards/ai/enrich` | 10 lần/ngày/HV, mỗi lần ≤ 50 từ |
| `/api/flashcards/ai/from-content` | 5 lần/ngày/HV |
| `/api/flashcards/images` | 60 lần/giờ/HV (Pexels free: 200 req/giờ toàn hệ thống → **buộc phải cache**) |

Bác xác nhận hoặc đổi con số. Gate quyền: dùng lại `/api/vocab/access` (chỉ HV có `studentCode`; teacher/admin luôn được).

---

## 8. Ảnh

- `GET /api/flashcards/images?q=...` — proxy Pexels, key ở `PEXELS_API_KEY` (env server). Cache kết quả theo truy vấn vào RTDB `pexels_cache/{slug}` (TTL 30 ngày) để không đụng trần 200 req/giờ.
- Upload: `lib/cloudinary/upload.ts` có sẵn + `browser-image-compression` (nén về ≤ 300 KB, cạnh dài ≤ 800px trước khi upload). Lưu `imagePublicId` để xoá được qua `/api/cloudinary/delete`.
- **Không dùng Supabase Storage** cho ảnh — bucket audio đã từng vượt 1 GB và khoá cả Auth.
- Thẻ không ảnh vẫn hợp lệ; chỉ 4 dạng quiz ảnh bị bỏ qua.

---

## 9. Link chia sẻ & khách không đăng nhập

- Bật chia sẻ → `visibility = "link"`, sinh `slug` 10 ký tự base58 (không đoán được).
- Route **public**, nằm ngoài group `(student)` nên không bị layout journal ép đăng nhập: `app/flashcards/d/[slug]/page.tsx`.
- `GET /api/flashcards/public/[slug]` chỉ trả **nội dung thẻ** — không trả `ownerId`, không trả tiến độ của ai.
- Khách học và quiz được; tiến độ ghi `localStorage` key `fc_guest_progress_{slug}`. Phiên quiz của khách vẫn ghi `VocabQuizSession` với `userId = null` + `guestKey` (để chủ bộ thấy "đã có 12 người làm") — **không** ghi `VocabProgress`.
- Cuối phiên: thẻ mời "Đăng nhập để lưu tiến độ và nhận nhắc ôn", có nút chuyển tiến độ localStorage vào tài khoản sau khi đăng nhập.
- Chống lạm dụng: khách **không** gọi được route AI và route ảnh; rate limit theo IP cho `/api/flashcards/public/*`.
- Tắt chia sẻ → `visibility = "private"`, link cũ trả 404.

---

## 10. Phía giáo viên

| Việc | Nơi làm | Cách |
|---|---|---|
| Giao bộ thẻ | `/admin/homework` | Thêm nút "Chèn bộ thẻ" vào `ItemRow`: chọn bộ → tạo `VocabDeckAssignment` + điền `HwItem { text: "Flashcard: <tên bộ>", link: "/flashcards/d/<slug>" }` vào section `vocab`. Hệ homework/submissions hiện có tự tính xong/chưa. |
| Ai đã làm, điểm bao nhiêu | `/admin/homework` + `/admin/classes/[id]` | Query `VocabQuizSession` theo `assignmentId`; "xong" = `correct/total × 100 >= minScore` |
| Tổng quan kho từ từng HV | `/admin/students/[code]` | Panel mới: tổng số từ, % thuộc, số từ đến hạn, lần ôn cuối, 10 từ hay sai nhất |
| Nhắc tự động khi bỏ ôn | `app/api/cron` + hệ push sẵn có | Cron ngày: HV có `> N` từ đến hạn hoặc `> 3` ngày không ôn → push cho HV. Cần bác chốt N và có báo cho GV không. |

Lưu ý: "top từ cả lớp hay sai" bác không chọn — bỏ, nên **chưa cần** chạm vào `classes` ở RTDB (nhánh này theo ghi chú của bác vẫn chưa scope quyền).

---

## 11. Bản đồ route & file

### Trang

| Route | Việc |
|---|---|
| `/journal/vocab` | **Viết lại**: tab "Bộ thẻ" (grid) + tab "Tất cả từ" (giữ danh sách phẳng cũ, lọc Part / đến hạn / hay sai) |
| `/journal/vocab/decks/new` | Tạo bộ: thủ công · dán danh sách + AI · từ nội dung đã học |
| `/journal/vocab/decks/[id]` | Chi tiết bộ, sửa thẻ, nút Học / Quiz / Chia sẻ |
| `/journal/vocab/decks/[id]/study` | Lật thẻ + nút Thuộc / Chưa thuộc |
| `/journal/vocab/decks/[id]/quiz` | Chọn dạng → làm quiz |
| `/flashcards/d/[slug]` | **Public**, không cần đăng nhập |
| `/admin/students/[code]` | Thêm panel từ vựng |
| `/admin/homework` | Thêm picker bộ thẻ |

### API (`app/api/flashcards/`)

```
decks/route.ts                      GET danh sách · POST tạo
decks/[id]/route.ts                 GET · PATCH · DELETE
decks/[id]/cards/route.ts           POST thêm/sửa/xoá thẻ (batch)
decks/[id]/share/route.ts           POST bật/tắt chia sẻ → slug
decks/[id]/clone/route.ts           POST nhân bản về kho mình
public/[slug]/route.ts              GET (không auth)
review/route.ts                     POST 1 lượt lật thẻ → cập nhật SRS
sessions/route.ts                   POST mở phiên quiz
sessions/[id]/finish/route.ts       POST gửi items → cập nhật SRS + XP
due/route.ts                        GET số từ đến hạn (cho badge)
ai/enrich/route.ts                  POST
ai/from-content/route.ts            POST
images/route.ts                     GET proxy Pexels
assignments/route.ts                GET · POST (GV)
```

### Lib

```
lib/vocab/srs.ts            Nguồn chân lý SRS — dùng cho cả badge, trang, API
lib/vocab/normalize.ts      normalizeWord
lib/vocab/quiz.ts           Sinh câu hỏi, chọn distractor, xếp ưu tiên
lib/vocab/enrich.ts         Chuỗi dictionary → datamuse → Gemini → MyMemory
```

### Phải sửa file đang có

| File | Sửa gì |
|---|---|
| `hooks/firebase/useNavBadges.ts` | Bỏ SRS tự tính; `vocabDueCount` lấy từ `/api/flashcards/due`. **Hết lệch số.** |
| `app/(student)/journal/vocab/page.tsx` | Viết lại theo mô hình bộ thẻ; port 5 modal cũ sang engine mới |
| `prisma/schema.prisma` | 6 model mới + 2 quan hệ trong `Profile` |
| `lib/firebase/helpers.ts` | Dọn `updateVocabWord`/`deleteVocabWord`/`*ForgottenWords` sau khi chuyển xong |
| `lib/journal/chapters.ts` | Không đổi (vẫn 1 trang `/journal/vocab`) — chỉ xác nhận lại khi xong |

---

## 12. Các phase, kèm tiêu chí xác minh

### Phase 0 — Dọn nền (nửa ngày)
> Mục tiêu: sửa lỗi SRS lệch và bịt lỗ bảo mật, trước khi xây gì mới.

1. Thu hồi Pexels key cũ, cấp key mới vào `PEXELS_API_KEY` ở Vercel → verify: key cũ gọi vào Pexels trả 401
2. Viết `lib/vocab/srs.ts`, cho `useNavBadges` và trang vocab dùng chung → **verify: badge trên nav và số "đến hạn" trong trang hiện đúng cùng một số, từ `mastered` không bị đếm**

### Phase 1A — Nền dữ liệu + migrate (2-3 ngày)
> Mục tiêu: dữ liệu nằm đúng chỗ ở Postgres, không mất một từ nào của học viên.

1. `prisma/manual-migrations/008_vocab_decks.sql` + cập nhật `schema.prisma`, chạy qua Supabase MCP → verify: `list_tables` thấy 6 bảng, `prisma generate` sạch
2. `scripts/migrate-vocab-to-decks.ts --dry-run` → verify: báo cáo khớp số từ đang có trên RTDB
3. Chạy thật → **verify: với 3 học viên mẫu, số thẻ và `repCount` trong Postgres khớp từng từ với RTDB; `dueAt` tính ra đúng ngày như trang cũ hiển thị**

### Phase 1B — Trang bộ thẻ của tôi (3-4 ngày)
> Mục tiêu: học viên dùng được y như trước, cộng thêm khái niệm bộ thẻ.

1. API decks/cards CRUD → verify: tạo/sửa/xoá bộ qua `curl`, không rò bộ của người khác (thử `ownerId` khác → 404)
2. Tab "Bộ thẻ" + tab "Tất cả từ" → verify: mở `/journal/vocab`, thấy 7 bộ migrate sẵn, tab "Tất cả từ" lọc Part/đến hạn đúng như bản cũ
3. Port lật thẻ + nút Thuộc/Chưa thuộc + `/api/flashcards/review` → **verify: lật 5 thẻ bấm Thuộc, `dueAt` và `repCount` trong DB đổi đúng theo công thức nửa trọng số**
4. Port `WriteModal` + `ListenWriteModal` → verify: TTS kêu, gõ đúng/sai ghi nhận được

### Phase 1C — AI tạo bộ (2-3 ngày)
> Mục tiêu: học viên tạo bộ 30 từ trong dưới 1 phút mà không gõ nghĩa nào.

1. `lib/vocab/enrich.ts` + `/api/flashcards/ai/enrich` → verify: dán 30 từ, ≥ 90% có IPA và nghĩa Việt, một lần gọi Gemini duy nhất
2. Rate limit Upstash → verify: gọi lần thứ 11 trong ngày trả 429
3. `/api/flashcards/ai/from-content` 4 nguồn → **verify: với 1 lesson, 1 passage, và 1 học viên có câu sai, mỗi nguồn ra ≥ 5 từ hợp lý và `sourceRef` truy được về đúng bài**
4. Màn tạo bộ 3 chế độ → verify: tạo được bộ từ cả 3 đường

### Phase 1D — Link chia sẻ + GV giao bài (2-3 ngày)
> Mục tiêu: một link gửi được cho người ngoài, và GV giao được bộ thẻ như giao bài tập.

1. `share` + route public + trang `/flashcards/d/[slug]` → **verify: mở link ở cửa sổ ẩn danh (chưa đăng nhập) học được, không bị đẩy về `/auth/login`**
2. Tiến độ khách ở localStorage + thẻ mời đăng ký → verify: khách làm xong, đóng tab, mở lại thấy tiến độ cũ
3. Tắt chia sẻ → verify: link trả 404
4. Picker bộ thẻ ở `/admin/homework` + `VocabDeckAssignment` → verify: GV giao 1 bộ, học viên thấy trong Nhiệm vụ, làm xong thì ô bài tập tự tick
5. Panel từ vựng ở `/admin/students/[code]` → verify: số khớp với trang của chính học viên đó

### Phase 2 — Quiz 10 dạng + ảnh + thống kê (sau khi Phase 1 chạy ổn)

1. `/api/flashcards/images` + cache + upload Cloudinary
2. `lib/vocab/quiz.ts` — 10 dạng, sinh đủ câu cho mọi dạng đã chọn, distractor theo `pos`
3. Ghi `VocabQuizSession`/`VocabQuizItem`, cập nhật SRS theo §5, cộng XP
4. Dashboard: % thuộc theo bộ, top từ hay sai, chuỗi ngày ôn
5. Cron nhắc bỏ ôn
6. Hiệu chỉnh `SPEED_THRESHOLD_MS` bằng dữ liệu `answerMs` thật

### Phase 3 — Để sau, chưa làm
- Thư viện bộ mẫu của thầy (schema đã chừa cờ `visibility = "library"` + `clonedFrom`)
- Dạng quiz TOEIC-hoá: điền từ vào câu ngữ cảnh Part 5, chọn word form, dictation 1 câu
- Chế độ thi (hết thời gian, ẩn đáp án đến cuối) tách khỏi chế độ luyện
- AI xếp lịch ôn / chọn dạng quiz theo điểm yếu
- Học offline qua service worker

---

## 13. Việc còn chờ bác chốt

1. **Ngưỡng nhanh/chậm** (§5): tạm 6s / 8s / 15s theo dạng — đồng ý để sau 2 tuần đo lại bằng dữ liệu thật?
2. **Rate limit AI** (§7.3): 10 lần enrich (≤ 50 từ) + 5 lần from-content mỗi ngày mỗi học viên?
3. **Nhắc bỏ ôn** (§10): bao nhiêu ngày không ôn thì push? Có báo cho GV hay chỉ nhắc học viên?
4. **XP**: cộng bao nhiêu cho 1 phiên lật thẻ / 1 phiên quiz? (các phần khác trong hệ đang cộng mức nào thì em theo mức đó)
5. **`minScore`** mặc định để tính "xong bài được giao": 70%?
6. **Giao diện**: trang mới theo chất liệu giấy của journal (nhất quán với commit mới nhất) — hay bác muốn giữ nét glassmorphism + màu `#43E8E4` của FlashCards Pro cho riêng khu flashcard?
7. **Dọn RTDB**: sau khi migrate xong, 1 tháng sau xoá nhánh `vocab/` hay giữ vĩnh viễn?

---

## 14. Phải đọc trước khi viết code

Theo `AGENTS.md` — bản Next.js này có breaking change so với hiểu biết sẵn, đọc trong `node_modules/next/dist/docs/`:

- `01-app/01-getting-started/15-route-handlers.md` — toàn bộ API mới
- `01-app/03-api-reference/03-file-conventions/route.md` + `dynamic-routes.md` — `[slug]`, `[id]`
- `01-app/03-api-reference/03-file-conventions/route-groups.md` — route public nằm ngoài `(student)`
- `01-app/01-getting-started/08-caching.md` + `02-guides/caching-without-cache-components.md` — trang public có cache được không
- `01-app/01-getting-started/07-mutating-data.md` — server action vs route handler cho form tạo bộ
- `01-app/01-getting-started/05-server-and-client-components.md` — ranh giới client cho các modal quiz

Lưu ý triển khai đã biết từ các lần trước: DDL đi qua Supabase MCP (`apply_migration`), DML local qua pooler được; deploy bằng Vercel CLI không push git; `vercel env pull` ghi key sensitive thành rỗng nên đừng để nó đè `.env`.
