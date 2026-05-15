# PLAN — Nâng cấp mytoeicdiary LMS

> Tổng hợp từ feature-inventory, screenshots bản HTML cũ, và codebase Next.js 16 hiện tại.
> Cập nhật: 2026-04-29

---

## Tổng quan chiến lược

**Thứ tự ưu tiên**: Teacher-first → Student upgrade → AI features → Billing
**Tech stack**: Next.js 16 + Prisma 7 (PostgreSQL) + Firebase RTDB + Gemini AI (free tier)
**Vocab strategy**: Gộp vào Prisma `SavedVocabulary` (thêm fields ipa, pos, def, example, audioUrl)
**Flashcard UX**: Giữ 3D CSS flip card
**Error Log AI**: Dùng Gemini (đã có `lib/ai/gemini.ts`) để phân loại lỗi tự động

---

## Phase 1 — Teacher: Student Editor ★★★

> Ưu tiên cao nhất. Đây là trang GV dùng nhiều nhất — hiện chỉ có route rỗng.
> Tham khảo: screenshot Student Editor (HTML cũ)

### Route: `/admin/students/[code]` (dynamic page)

### 1.1 Layout 2 cột (desktop) / 1 cột (mobile)
- **Cột trái (rộng)**: Thông tin + nhận xét + thông báo + điểm TOEIC + nhật ký lỗi summary
- **Cột phải**: Học phần, BTVN, lịch học

### 1.2 Thông tin cơ bản
- Form: họ tên, mã HV, tuần hiện tại
- Loại khoá học: dropdown (Lớp nhóm / 1-1 theo buổi / 1-1 trọn gói)
- Đơn giá/buổi hoặc Tổng học phí + Đã thanh toán (tuỳ loại)
- Auto-save debounce → Firebase `students/{code}`

### 1.3 Ghi chú nội bộ (chỉ GV thấy)
- Textarea auto-save debounce 1s
- Firebase path: `students/{code}/note`

### 1.4 Nhận xét gửi học viên
- Textarea + nút "Gửi nhận xét & thông báo"
- Lưu vào `students/{code}/comments/{timestamp}`
- Trigger push notification cho HV
- Hiển thị lịch sử nhận xét (sorted mới → cũ)

### 1.5 Gửi thông báo thủ công
- Form: tiêu đề + nội dung
- Ghi `notifications/{studentCode}/{timestamp}` → trigger push

### 1.6 Điểm TOEIC
- Danh sách điểm (sorted mới nhất), hiện: score lớn, tên đề, ngày, part chips (P1–P7)
- Nút "+ Thêm": modal nhập tên đề, ngày, ghi chú, 7 part (câu đúng) → auto-calc ETS scale
- Nút "×" xoá từng điểm
- Firebase path: `students/{code}/scores[]`

### 1.7 Nhật ký lỗi (read-only summary)
- Stat: số buổi, tổng lỗi LS, tổng lỗi RD
- Bar chart mini: top 3 lỗi LS + top 3 lỗi RD
- 3 buổi gần nhất (collapsed)
- Firebase path: `students/{code}/errorLog`

### 1.8 Tiến độ nhiệm vụ
- 7 BTVN gần nhất: ngày, progress bar, %, X/N mục

### 1.9 Link học viên
- Auto-generate URL: `{origin}/auth/login?auto={studentCode}`
- Copy to clipboard button

### 1.10 Học phần (Modules) — cột phải
- Thêm module: tên, tuần, tên tuần, loại, trạng thái
- Nhóm theo tuần, progress bar
- Inline dropdown đổi trạng thái → propagate Firebase
- Sửa / xoá module

### 1.11 BTVN cá nhân — cột phải
- Filter bar: Đang học / Tất cả / Hoàn thành / Hết hạn (badge count)
- Collapsible cards: ngày, label, deadline badge, progress
- Hiển thị link tổng hợp HV đã nộp
- Trạng thái từng item (link / ticked / chưa nộp)
- CRUD: thêm / sửa / xoá BTVN (modal 5 sections, multi-day, rich-text desc)

### 1.12 Lịch học cá nhân — cột phải
- Thêm / xoá (tiêu đề, ngày, giờ)
- Sorted, past events mờ đi

### 1.13 Đóng băng tài khoản
- Toggle button top-right (đỏ khi freeze)
- Firebase `students/{code}/frozen` → HV bị kick realtime

### Schema changes
- Không cần thay đổi Prisma schema (tất cả data GV quản lý nằm trong Firebase)
- Có thể thêm `Profile.courseType`, `Profile.pricePerSession`, `Profile.totalFee`, `Profile.paidAmount` vào Prisma nếu muốn persistent

### Files cần tạo/sửa
```
app/(teacher)/admin/students/[code]/page.tsx     — dynamic page
components/admin/StudentBasicInfo.tsx
components/admin/StudentNotes.tsx
components/admin/StudentComments.tsx
components/admin/StudentNotifications.tsx
components/admin/StudentScores.tsx
components/admin/StudentErrorSummary.tsx
components/admin/StudentHomeworkProgress.tsx
components/admin/StudentModules.tsx
components/admin/StudentHomework.tsx
components/admin/StudentSchedule.tsx
components/admin/StudentLink.tsx
lib/firebase/helpers.ts                          — thêm CRUD functions
lib/ets-scale.ts                                 — ETS score conversion table
```

---

## Phase 2 — Teacher: Classes Detail ★★★

> Hiện `/admin/classes` có route nhưng cần kiểm tra mức hoàn thiện.
> Tham khảo: screenshot Classes (HTML cũ)

### Route: `/admin/classes/[id]` (dynamic page)

### 2.1 Header lớp
- Tên lớp, mô tả, lịch học cố định (badges thứ/giờ)
- Nút "Sửa lớp" + "Giao BTVN lớp"

### 2.2 Thành viên
- Tags HV với nút "×" xoá
- Dropdown "Thêm HV vào lớp" → auto propagate modules + HW

### 2.3 Học phần lớp
- Nhóm theo tuần, progress bar
- CRUD module: tên, tuần, tên tuần, loại, trạng thái
- Thay đổi trạng thái → propagate sang tất cả HV trong lớp

### 2.4 BTVN lớp
- Card: date range, tên bài, % nộp, progress bar
- **Mini grid học viên**: tên HV + trạng thái (✓ đã nộp link / ✓ tick items / — chưa nộp)
- CRUD: thêm / sửa / xoá → propagate tất cả HV
- Backfill khi thêm HV mới vào lớp

### Files cần tạo/sửa
```
app/(teacher)/admin/classes/[id]/page.tsx
components/admin/ClassHeader.tsx
components/admin/ClassMembers.tsx
components/admin/ClassModules.tsx
components/admin/ClassHomework.tsx
components/admin/ClassHwStudentGrid.tsx
```

---

## Phase 3 — Teacher: Dashboard Upgrade ★★☆

> Hiện có `/admin` nhưng cần match UI bản cũ.

### 3.1 Stat cards (3 ô lớn)
- Tổng học viên | Hoàn thành hôm nay (X/N) | Lịch chờ duyệt

### 3.2 Student card grid
- Card: tên, mã HV, điểm TOEIC hiện tại / mục tiêu, progress bar, trạng thái nộp bài hôm nay
- Filter + Search: tìm theo tên/mã, lọc trạng thái (Đã nộp / Chưa nộp / Không có BT)
- Click card → navigate `/admin/students/[code]`

### 3.3 Lagging panel
- HV nộp quá hạn hôm qua

### 3.4 Attendance embedded
- Mode toggle: Cá nhân / Theo lớp
- **Cá nhân**: danh sách HV trái + calendar phải (cell màu, click mark)
- **Theo lớp**: danh sách lớp trái + matrix bảng (HV × ngày) phải
- Filter, sort, summary pills

### Files cần sửa
```
app/(teacher)/admin/page.tsx
app/(teacher)/admin/_dashboard-client.tsx         — nâng cấp lớn
components/admin/AttendancePanel.tsx               — mới
components/admin/AttendanceCalendar.tsx             — mới
components/admin/AttendanceClassMatrix.tsx          — mới
```

---

## Phase 4 — Student: Scores Upgrade ★★☆

> Hiện `/journal/scores` chỉ hiển thị read-only. Cần thêm nhập liệu.

### 4.1 Goal card
- Đặt mục tiêu điểm + deadline
- Lưu Firebase `goals/{studentCode}` + localStorage

### 4.2 Stat cards
- Cao nhất | Trung bình | Thấp nhất | Tổng bài test | Trend | Gap tới goal

### 4.3 Nhập điểm test mới
- Form: tên đề, ngày, ghi chú
- 7 part inputs (câu đúng) → **live preview** auto-calc ETS scale (LS + RD + Total)
- Submit → Firebase `students/{code}/scores[]`

### 4.4 Edit / Delete
- Modal sửa (prefill) với auto-calc
- Nút xoá với confirm

### Shared module
```
lib/ets-scale.ts    — bảng quy đổi ETS (Listening 0-100 → 5-495, Reading 0-100 → 5-495)
                      Dùng chung cho cả Phase 1.6 và Phase 4.3
```

---

## Phase 5 — Student: Error Log + Paraphrase ★★☆

### 5.1 Error Log — Route: `/journal/error-log`

#### Tab: Form nhập
- Chọn ngày, tên đề (autocomplete), loại luyện (Full test / Part lẻ)
- Stepper +/− cho 9 loại lỗi Listening + 7 loại lỗi Reading
- Tooltip giải thích từng loại lỗi
- Chi tiết từng câu sai: Part, số câu, nội dung, paraphrase, trạng thái ôn lại
- **AI assist (Gemini)**: nút "AI phân loại" → gửi mô tả lỗi → Gemini trả về category suggestion
- Firebase path: `students/{code}/errorLog/{id}`

#### Tab: Dashboard
- Stat cards: số buổi, tổng lỗi LS, tổng lỗi RD, đã ôn lại
- Bar chart top lỗi (dùng CSS bars, không cần thư viện chart)
- Lịch sử buổi luyện (unified timeline errorLog + scores)

#### Tab: Paraphrase
- Form thêm: từ gốc → paraphrase, Part (3/4/7), ghi chú
- Danh sách với SRS badge (đến hạn / sắp đến / ổn)
- Firebase path: `students/{code}/paraphraseLog/{id}`

### Files
```
app/(student)/journal/error-log/page.tsx
components/journal/ErrorLogForm.tsx
components/journal/ErrorLogDashboard.tsx
components/journal/ParaphraseList.tsx
hooks/firebase/useErrorLog.ts
hooks/firebase/useParaphraseLog.ts
```

---

## Phase 6 — Student: Flashcards & Practice ★★☆

### 6.1 Vocab Flashcard — Route: `/journal/vocab/flashcard`

- **Mode Picker**: Đến hạn ôn / Toàn bộ / Theo Part / Ngẫu nhiên
- **3D flip card**: CSS `transform: rotateY(180deg)` + `backface-visibility: hidden`
  - Mặt trước: từ EN + IPA + POS + nút phát âm (Web Speech API)
  - Mặt sau: nghĩa VI + EN def + example
- Toggle VN→EN (đảo chiều)
- Nút: ✅ Nhớ rồi / 🔁 Chưa nhớ → cập nhật SRS (Prisma `SavedVocabulary`)
- Progress bar, done screen, confetti (CSS animation, không cần lib)
- Retry forgotten cards

### 6.2 Vocab Write Mode — Route: `/journal/vocab/write`

- **Listen mode**: Web Speech API phát âm → gõ lại từ
- **Meaning mode**: hiện nghĩa VI → gõ từ EN
- Kiểm tra Levenshtein distance (chấp nhận sai ≤2 ký tự tuỳ độ dài)
- Feedback đúng/sai, hiện từ đúng, retry, done screen

### 6.3 Paraphrase Flashcard — Route: `/journal/error-log/flashcard`

- Tái dùng FlipCard component từ 6.1
- Mode Picker: Đến hạn / Toàn bộ / Theo Part (3/4/7) / Ngẫu nhiên
- Flip: từ gốc ↔ paraphrase

### Files
```
components/journal/FlipCard.tsx                    — shared 3D flip card
components/journal/FlashcardSession.tsx             — shared session logic
components/journal/VocabFlashcard.tsx
components/journal/VocabWriteMode.tsx
components/journal/ParaphraseFlashcard.tsx
app/(student)/journal/vocab/flashcard/page.tsx
app/(student)/journal/vocab/write/page.tsx
app/(student)/journal/error-log/flashcard/page.tsx
lib/levenshtein.ts
```

---

## Phase 7 — Student: Overview Upgrade + Schedule ★★☆

### 7.1 Journal Dashboard upgrade (`/journal`)

Nâng cấp `DashboardClient`:
- **Thanh điểm TOEIC**: fill animation, score ticks (0/300/600/990)
- **Goal row**: mục tiêu, khoảng cách, deadline
- **Nhận xét từ GV**: comment mới nhất (từ Firebase `comments`)
- **Widget "Nhiệm vụ hôm nay"**: tóm tắt sections + progress bar + CTA
- **Lịch sắp tới**: 2 tuần, gộp lịch cá nhân + lớp + booking đã duyệt

### 7.2 Schedule — Route: `/journal/schedule`

- Tổng hợp: lịch cá nhân + lịch lớp (weeklySchedule) + booking approved
- Nhóm theo tuần
- Card ngày: ngày/tháng, thứ, tiêu đề, giờ, tag (Lớp / 1-1)
- Highlight "Hôm nay"

### 7.3 Modules view — Route: `/journal/modules`

- HV xem học phần nhóm theo tuần
- Trạng thái: ✓ done / ● current / ○ locked
- Badge "LỚP" nếu từ class module

---

## Phase 8 — Student: Vocab Upgrade (Prisma migration) ★★☆

### 8.1 Schema migration

```prisma
model SavedVocabulary {
  // existing fields...
  ipa         String?
  pos         String?   // n / v / adj / adv
  defEn       String?   @map("def_en") @db.Text
  example     String?   @db.Text
  audioUrl    String?   @map("audio_url")
  partNumber  Int?      @map("part_number") // 1-7
  addedDate   DateTime  @default(now()) @map("added_date")
  repCount    Int       @default(0) @map("rep_count")
  lastReview  DateTime? @map("last_review")
  // remove isMastered, replace with SRS interval logic
  srsInterval Int       @default(0) @map("srs_interval") // days: 0→1→3→7→14→30
  nextReview  DateTime? @map("next_review")
}
```

### 8.2 Form thêm từ mới
- Nhập: từ, Part, ngày gặp, ví dụ
- **Auto-fill** từ Free Dictionary API: IPA, POS, definition EN
- **Auto-translate** VI qua MyMemory API (hoặc Gemini)
- **Phát âm**: Web Speech API (speechSynthesis)
- Delete từ

### 8.3 Migration script
- Đọc Firebase `vocab/{studentCode}/*` → bulk insert vào Prisma
- Map fields tương ứng
- Chạy 1 lần per student

### Files
```
prisma/migrations/XXXX_vocab_upgrade/migration.sql
lib/dictionary-api.ts
app/api/vocab/route.ts                             — CRUD API
components/journal/VocabAddForm.tsx
```

---

## Phase 9 — AI Features: Weekly Report + Smart Review ★☆☆

### 9.1 Weekly Report — Route: `/journal/report`

- Auto-generate mỗi tuần (hoặc on-demand)
- Nội dung: XP earned, streak, số bài dictation, điểm TB, top lỗi tuần, từ vựng mới
- **Gemini** tổng hợp narrative (1 đoạn khuyến khích + 1 đoạn gợi ý cải thiện)
- Card UI đẹp, có thể share screenshot

### 9.2 Smart Review

- Phân tích pattern sai từ dictation (Prisma `UserProgress.userAnswer`)
- Gemini extract weak areas → suggest vocab/paraphrase cần ôn
- Hiển thị trong `SuggestionsWidget` trên journal dashboard
- Route: `/journal/smart-review` (danh sách đầy đủ)

### Files
```
app/(student)/journal/report/page.tsx
app/(student)/journal/smart-review/page.tsx
app/api/weekly-report/route.ts
lib/ai/weekly-report.ts
lib/ai/smart-review.ts
```

---

## Phase 10 — Student: Fee / Billing ★☆☆

### 10.1 Route: `/journal/fee`

#### Lớp nhóm / 1-1 theo buổi
- Month navigation (‹ / ›)
- Stat cards: buổi có mặt, buổi vắng, tổng học phí tháng
- Danh sách buổi (từ lịch lớp + attendance), badge trạng thái
- Tổng = số buổi có mặt × đơn giá

#### 1-1 Trọn gói
- Stat cards: đã thanh toán, còn lại, tổng
- Progress bar %

#### Biên lai
- Auto-generate HTML (bảng buổi học, QR Techcombank, nội dung CK)
- Print/PDF qua `window.print()` với print stylesheet
- QR zoom overlay

### Files
```
app/(student)/journal/fee/page.tsx
components/journal/FeeMonthly.tsx
components/journal/FeePackage.tsx
components/journal/Receipt.tsx
```

---

## Phase 11 — Polish & Misc ★☆☆

### 11.1 Daily Digest Popup
- Hiện 1 lần/ngày (localStorage check)
- Nội dung: bài quá hạn + từ SRS đến hạn + paraphrase đến hạn
- Shortcut buttons đến từng section

### 11.2 Freeze account detection
- Firebase listener trên `students/{code}/frozen`
- Nếu `true` → redirect `/auth/frozen` + clear session

### 11.3 Navigation update
- Thêm các tab mới vào `TabBar.tsx` + `MobileBottomNav.tsx`
- Sắp xếp: Tổng quan | Nhiệm vụ | Điểm | Lỗi | Từ vựng | Lịch | Học phí | Cài đặt

### 11.4 Admin UX improvements
- "Thêm học viên" flow từ sidebar (tạo profile + student code + invite link)
- "Bật thông báo" nút trong sidebar

---

## Lộ trình ước tính

| Phase | Tên | Sessions ước tính | Phụ thuộc |
|-------|-----|-------------------|-----------|
| **1** | Teacher: Student Editor | 3-4 | — |
| **2** | Teacher: Classes Detail | 2-3 | — |
| **3** | Teacher: Dashboard Upgrade | 2 | Phase 1 (student cards link) |
| **4** | Student: Scores Upgrade | 1-2 | `lib/ets-scale.ts` from Phase 1 |
| **5** | Student: Error Log + Paraphrase | 2-3 | — |
| **6** | Student: Flashcards | 2 | Phase 5 (paraphrase data), Phase 8 (vocab data) |
| **7** | Student: Overview + Schedule | 2 | Phase 4, 5 (data cần hiển thị) |
| **8** | Student: Vocab Upgrade | 2 | — |
| **9** | AI: Weekly Report + Smart Review | 1-2 | Phase 4, 5, 8 (cần data) |
| **10** | Student: Fee | 2 | Phase 1 (course type data) |
| **11** | Polish | 1 | All above |

**Tổng ước tính: ~20-25 sessions**

---

## Nguyên tắc kỹ thuật

1. **Firebase data = source of truth** cho teacher-managed data (students, homework, scores, attendance, classes, slots, bookings)
2. **Prisma/PostgreSQL = source of truth** cho dictation progress, vocab (sau migration), XP, profiles
3. **Server Components** cho data fetching khi có thể, `"use client"` chỉ khi cần interactivity
4. **Optimistic updates** cho mọi Firebase write (update UI trước, ghi DB sau)
5. **Debounce auto-save** cho text fields (1s delay)
6. **Shared components**: FlipCard, ProgressRing, StatCard, FilterBar — tái dùng across phases
7. **Mobile-first**: responsive layout, MobileBottomNav cập nhật theo tabs mới
8. **Đọc `node_modules/next/dist/docs/`** trước khi dùng bất kỳ Next.js API nào (breaking changes)
