# PLAN — Lộ trình học cá nhân hoá bằng AI

> Tính năng: sau khi học viên mới làm **đề test đầu vào**, hệ thống chẩn đoán điểm yếu
> và sinh **mục tiêu + nhiệm vụ theo ngày / tuần / tháng**, bám vào kho bài tập đang có.
>
> Ngày lập: 2026-11-12 · Trạng thái: chưa code dòng nào
> Tên file: `plan-roadmap-ai.md` (không dùng `plan.md` vì trên Windows nó trùng
> với `PLAN.md` đang có — ghi đè mất kế hoạch LMS cũ).

---

## 0. Những điều đã chốt

| # | Vấn đề | Quyết định |
|---|--------|-----------|
| 1 | Vai trò AI | **Lai**: code (rule) chẩn đoán + chọn bài từ catalog thật; Gemini sắp ưu tiên, viết lời, tinh chỉnh khối lượng |
| 2 | Nguồn chẩn đoán | **Full test L&R có sẵn** (`/skills/full-tests`, EST 2026) — đã có `partScores` + thang ETS |
| 3 | Vị trí UI | Khu riêng `/journal/roadmap` (toàn cảnh) + đổ việc hôm nay vào `/journal/missions` |
| 4 | Tầm kế hoạch | Khung tháng + chi tiết theo tuần, **cuốn chiếu** |
| 5 | Duyệt | HV nhận ngay; GV sửa được sau ở `/admin` |
| 6 | Thông tin hoàn cảnh | Form ngắn 4–5 câu **trước** khi làm test |
| 7 | Tái lập kế hoạch | Cuối tuần tự động + sau mỗi full test mới + khi bỏ lỡ quá nhiều ngày |
| 8 | Độ chi tiết nhiệm vụ | Link thẳng tới bài + điều kiện hoàn thành, **tự tích xong** |
| 9 | Đối tượng | Mọi tài khoản đăng nhập (không phân biệt free/trả phí) |
| 10 | Phạm vi kỹ năng | Phase 1 chỉ **L&R**; S&W để phase sau |
| 11 | Tích hợp | Push nhắc việc · XP/streak/huy hiệu · trang GV ở `/admin` · biểu đồ tiến độ |
| 12 | Quan hệ với BTVN | **BTVN ưu tiên** — ngày có BTVN thì lộ trình tự giảm tải |
| 13 | Bỏ lỡ ngày | Lịch mềm: dồn tối đa 1–2 việc quan trọng sang hôm sau, phần còn lại đánh dấu "lỡ" |
| 14 | HV cũ | **Chỉ dành cho HV mới** (xem §15 — điểm này còn một chỗ cần bạn chốt lại) |
| 15 | Nơi lưu | **Postgres/Prisma**, bảng mới |
| 16 | Quy mô | MVP gọn trước, mở rộng sau; mỗi phase chạy được độc lập |

---

## 1. Phạm vi

### Làm (phase 1–3)
- Form onboarding 5 câu → lưu `Goal` + hồ sơ hoàn cảnh.
- Lấy một đề EST 2026 làm đề đầu vào, chấm bằng engine sẵn có.
- Engine chẩn đoán: từ `partScores` ra bảng xếp hạng điểm yếu.
- Catalog nội dung: ánh xạ "điểm yếu" → bài tập thật đang có trên web.
- Planner: ngân sách thời gian → lịch tuần → nhiệm vụ ngày có link + điều kiện đạt.
- Lớp AI: sắp ưu tiên, viết mục tiêu tháng/tuần bằng tiếng Việt, tinh chỉnh tải.
- Trang `/journal/roadmap` + khối "Lộ trình hôm nay" trong `/journal/missions`.
- Tự tích xong bằng dữ liệu làm bài thật (không tự khai báo).
- Cron tái lập kế hoạch cuối tuần + khi bỏ lỡ nhiều ngày.

### Làm sau (phase 4–6)
- Push nhắc việc, XP/streak/huy hiệu riêng cho lộ trình.
- Trang GV `/admin` xem & sửa lộ trình.
- Biểu đồ "đường điểm dự kiến vs thực tế" gắn vào `/journal/progress`.
- Speaking/Writing vào lộ trình.

### Không làm
- Không sinh **nội dung bài tập mới** bằng AI. Lộ trình chỉ trỏ tới bài đã có.
- Không để AI tự do bịa URL. AI chỉ được chọn `catalogId` trong danh sách đưa vào prompt.
- Không đụng vào luồng BTVN của giáo viên (RTDB `homework/*`) — chỉ **đọc** để giảm tải.
- Không làm đề test đầu vào riêng ở phase này.

---

## 2. Luồng học viên

```
[HV mới đăng nhập]
      │
      ▼
/journal/roadmap  ──►  "Bạn chưa có lộ trình. Làm bài test đầu vào (2 tiếng) để bắt đầu."
      │
      ▼
/journal/roadmap/start   ← Form 5 câu:
      │                     1. Thi L&R hay S&W?            (phase 1 khoá ở L&R)
      │                     2. Mục tiêu điểm?               → Goal.target
      │                     3. Dự kiến thi ngày nào?        → Goal.deadline
      │                     4. Mỗi ngày học được bao nhiêu phút?   (15/30/45/60/90)
      │                     5. Mỗi tuần học được mấy ngày?        (3/4/5/6/7)
      │                     (+ tuỳ chọn) Ưu tiên kỹ năng nào?
      ▼
/skills/full-tests/est-2026/test-N   ← đề đầu vào, chế độ "thi thử", tính giờ
      │                                 (engine, UI, chấm điểm: dùng y nguyên cái đang có)
      ▼
Nộp bài → FullTestAttempt.status = "done", có listening/reading/total/partScores
      │
      ▼
POST /api/roadmap/generate   ← chẩn đoán + planner + AI
      │
      ▼
/journal/roadmap/result   ← màn hình "Kết quả chẩn đoán":
      │                       • Điểm hiện tại 465 → mục tiêu 700, còn 12 tuần
      │                       • 3 điểm yếu lớn nhất (có biểu đồ cột theo part)
      │                       • Mục tiêu tháng 1 · Chủ đề 4 tuần
      │                       • "Bắt đầu học hôm nay" →
      ▼
/journal/missions   ← mỗi ngày mở ra thấy 2–4 việc, bấm vào là vào thẳng bài
      │
      ├─ làm xong bài → hệ thống tự tích xanh (§9)
      │
      ▼
Chủ nhật 21:00 → cron tái lập kế hoạch tuần sau
      │
      ▼
Cuối tháng / sau mỗi full test mới → cập nhật baseline, vẽ lại mục tiêu tháng
```

---

## 3. Kiến trúc — 4 lớp tách bạch

```
┌──────────────────────────────────────────────────────────────┐
│ 1. DIAGNOSE  (lib/roadmap/diagnose.ts)          — thuần code │
│    FullTestAttempt.partScores  →  WeaknessReport             │
│    Không gọi AI. Có test đơn vị. Kết quả luôn giống nhau.    │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. CATALOG   (lib/roadmap/catalog.ts)           — dữ liệu    │
│    Danh mục mọi bài tập trên web, gắn thẻ part/skill/mức/    │
│    thời lượng/cách đo xong. Nguồn chân lý DUY NHẤT về href.  │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. PLANNER   (lib/roadmap/planner.ts)           — thuần code │
│    WeaknessReport + Intake + Catalog  →  DraftPlan            │
│    Chia ngân sách phút, rải bài, né ngày có BTVN, đặt mốc.   │
│    ★ Chạy được KHÔNG CẦN AI — đây là mạng lưới an toàn.      │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. NARRATOR  (lib/roadmap/ai.ts)                — Gemini     │
│    DraftPlan  →  đổi thứ tự ưu tiên trong biên độ cho phép,  │
│    viết mục tiêu tháng/tuần/lời khuyên tiếng Việt.           │
│    Trả JSON, validate bằng zod. Hỏng → dùng thẳng DraftPlan. │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên tắc xương sống**: AI không bao giờ là đường duy nhất tới kết quả.
Gemini sập, hết quota, trả JSON rác → học viên vẫn có lộ trình (bản rule), chỉ là
lời lẽ khô hơn. Đây là điều kiện để dám bật cho mọi tài khoản.

---

## 4. Mô hình dữ liệu (Prisma)

Thêm vào `prisma/schema.prisma`. Migration viết tay đặt ở
`prisma/manual-migrations/` theo đúng lệ của dự án (xem `project_skill_submissions`:
migration chạy tay, không `prisma migrate deploy` trên Vercel).

```prisma
/// Lộ trình học cá nhân hoá. Một học viên chỉ có TỐI ĐA 1 bản active.
/// Tái lập kế hoạch KHÔNG tạo plan mới — chỉ sinh StudyWeek mới và tăng `version`.
model StudyPlan {
  id       String  @id @default(uuid())
  userId   String  @map("user_id")
  profile  Profile @relation(fields: [userId], references: [id], onDelete: Cascade)

  status   String  @default("active")  // "active" | "archived" | "completed"
  examType String  @default("lr")      // "lr" | "sw"  (phase 1 chỉ "lr")

  /// Bài test đầu vào — nguồn của baseline
  baselineAttemptId String? @map("baseline_attempt_id")

  /// Ảnh chụp lúc tạo: { total, listening, reading, parts: [{part, accuracy, correct, gradable}] }
  baseline Json

  /// Mốc hiện tại (cập nhật sau mỗi full test mới) — cùng shape với baseline
  current  Json?

  /// Form onboarding: { minutesPerDay, daysPerWeek, preferredSkills[], startDate }
  intake   Json

  targetScore Int?      @map("target_score")
  deadline    DateTime?

  /// Mục tiêu từng tháng do AI viết:
  /// [{ monthIndex, label, targetScore, focus[], summary }]
  monthGoals  Json      @default("[]") @map("month_goals")

  version   Int      @default(1)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  weeks  StudyWeek[]
  tasks  StudyTask[]
  events PlanEvent[]

  @@index([userId, status])
  @@map("study_plans")
}

/// Một tuần của lộ trình. Sinh cuốn chiếu: tuần N+1 chỉ ra đời vào cuối tuần N.
model StudyWeek {
  id     String    @id @default(uuid())
  planId String    @map("plan_id")
  plan   StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  userId String    @map("user_id")

  weekIndex Int      @map("week_index")   // 1,2,3...
  startDate DateTime @map("start_date") @db.Date  // luôn là thứ Hai
  endDate   DateTime @map("end_date")   @db.Date

  theme    String                      // "Vững thì & chủ-động-bị-động"
  goalText String  @map("goal_text")   // câu mục tiêu AI viết cho HV đọc
  targetMinutes Int @map("target_minutes")

  status String @default("current")    // "current" | "done" | "future"

  /// Tổng kết cuối tuần (cron ghi): { doneTasks, totalTasks, minutes, accuracyByPart, note }
  review Json?

  tasks StudyTask[]

  @@unique([planId, weekIndex])
  @@index([userId, startDate])
  @@map("study_weeks")
}

/// Một đầu việc. Luôn trỏ tới một entry có thật trong catalog.
model StudyTask {
  id     String    @id @default(uuid())
  planId String    @map("plan_id")
  plan   StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  weekId String    @map("week_id")
  week   StudyWeek @relation(fields: [weekId], references: [id], onDelete: Cascade)
  userId String    @map("user_id")

  date  DateTime @db.Date            // ngày dự kiến làm
  order Int                          // thứ tự trong ngày

  catalogId String @map("catalog_id") // khoá trong lib/roadmap/catalog.ts
  title     String                    // "Part 5 · Thì hiện tại hoàn thành — Level 2"
  href      String                    // chụp lại lúc sinh, phòng khi catalog đổi
  kind      String                    // "subskill" | "part_practice" | "full_test" | "vocab" | "dictation" | "grammar"

  /// Điều kiện hoàn thành, ví dụ:
  /// { type: "subskill", part: "part5-hien-tai-hoan-thanh", level: "l2", minScore: 80 }
  /// { type: "part_practice", skill: "reading", part: 5, minItems: 20, minAccuracy: 0.75 }
  /// { type: "vocab", deckId: "...", minCards: 20 }
  target Json

  estMinutes Int    @map("est_minutes")
  priority   String @default("core")  // "core" | "bonus"  (dồn ngày chỉ dồn "core")

  status String @default("pending")   // "pending" | "done" | "skipped" | "rolled" | "missed"

  /// Bằng chứng hoàn thành: { source: "subskill_attempts", refId, score, at }
  evidence Json?

  rolledFromDate DateTime? @map("rolled_from_date") @db.Date
  completedAt    DateTime? @map("completed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([userId, date, status])
  @@index([weekId, date])
  @@map("study_tasks")
}

/// Nhật ký mọi lần sinh/đổi lộ trình. Vừa để dò lỗi, vừa là chỗ DUY NHẤT
/// đếm hạn mức AI mỗi tháng (học bài từ cột `aiGradedAt` của SkillSubmission:
/// đừng đếm bằng updatedAt vì nó bị ghi đè bởi đủ thứ việc khác).
model PlanEvent {
  id     String    @id @default(uuid())
  planId String    @map("plan_id")
  plan   StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  userId String    @map("user_id")

  type String   // "created" | "replan_weekly" | "replan_after_test" | "replan_missed" | "teacher_edit" | "ai_failed"
  /// { weekIndex, model, promptTokens?, reason, diff }
  payload Json  @default("{}")
  /// null nếu lần đó không gọi AI (bản rule thuần) — cột đếm quota
  aiCalledAt DateTime? @map("ai_called_at")

  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId, type, aiCalledAt])
  @@map("plan_events")
}
```

Thêm quan hệ ngược trong `model Profile`:
```prisma
  studyPlans  StudyPlan[]
  studyWeeks  StudyWeek[]
  studyTasks  StudyTask[]
  planEvents  PlanEvent[]
```

> **Lưu ý DB**: theo `project_db_connectivity`, DDL phải đi qua Supabase MCP /
> migration tay, local chỉ chạy được DML qua pooler. Nên bước tạo bảng làm
> trước, tách riêng khỏi bước code.

---

## 5. Catalog nội dung — phần quan trọng nhất

Đây là thứ quyết định lộ trình có dùng được hay không. Catalog là **một file TypeScript
khai báo**, không phải dữ liệu AI sinh.

```ts
// lib/roadmap/catalog.ts
export type CatalogEntry = {
  id: string;            // "sub.part5.hien-tai-hoan-thanh.l2"  — ổn định, không đổi
  title: string;         // "Part 5 · Hiện tại hoàn thành — Level 2"
  href: string;          // "/subskills/reading/part5/hien-tai-hoan-thanh/l2"
  kind: "subskill" | "part_practice" | "full_test" | "vocab" | "dictation" | "grammar";

  /** Bài này chữa cho part nào của đề thi */
  parts: (1|2|3|4|5|6|7)[];
  skill: "listening" | "reading" | "both";

  /** Nhãn kỹ năng nền, để AI hiểu bài này dạy gì */
  tags: string[];        // ["tenses", "grammar-core"] | ["wh-question", "listening-decode"]

  /** Dải điểm phù hợp — không giao bài 800+ cho HV 350 */
  bandMin: number;       // 300
  bandMax: number;       // 650

  estMinutes: number;    // 15
  /** Bài phải làm trước (catalogId) */
  prereq?: string[];
  /** Cách biết là đã làm xong — §9 */
  evidence: EvidenceSpec;
};
```

### Nguồn để dựng catalog (đã có sẵn trên web)

| Khu | Route mẫu | Chữa part | Ghi chú |
|-----|-----------|-----------|---------|
| Part 2 subskill | `/subskills/listening/part2/[questionWord]` | 2 | 10 loại câu hỏi × 3 mức (`*.json`, `*.medium.json`, `*.hard.json`) |
| Part 3/4 subskill | `/subskills/listening/part3/[level]/[drill]` | 3, 4 | 5 cấp, pipeline 2 script đã sinh data |
| Nghe sâu | `/subskills/listening/part3/nghe-sau/[groupId]` | 3, 4 | |
| Part 5 theo thì | `/subskills/reading/part5/[tense]/[level]` | 5, 6 | 12 thì × 6 level (`l1`–`l6`) |
| Liên từ/từ nối | `/subskills/reading/connectors/[group]/[level]` | 5, 6 | 10 nhóm × 6 level (xong 4/10) |
| Part 7 subskill | `/subskills/reading/part7` | 7 | |
| Ngữ pháp Part 5 | `/grammar/[topic]` | 5 | 3.984 câu / 16 thẻ, có rubric phân vị |
| Động từ bất quy tắc | `/subskills/verbs/[group]/[level]` | 5 | 120 động từ, L1–L4 |
| Chunking | `/subskills/chunking/[branch]/[level]` | 3, 4 | nhánh Nghe dùng cho L&R |
| IPA | `/subskills/ipa/[section]` | 1, 2 | nền phát âm |
| Dịch Anh–Việt | `/subskills/translation/[topic]/[level]` | 6, 7 | |
| Chính tả/nghe chép | `/dictation` | 3, 4 | engine dictation sẵn có |
| Luyện từng part | `/skills/listening/partN`, `/skills/reading/partN` | 1–7 | 2 chế độ thi thử / luyện tập |
| Full test | `/skills/full-tests/[exam]/[test]` | 1–7 | dùng làm mốc kiểm tra hằng tháng |
| Flashcard | `/journal/vocab` | 5, 7 | SRS, có `VocabProgress` |

### Cách dựng
1. `scripts/roadmap/build-catalog.mjs` quét các registry sẵn có
   (`lib/subskills/reading/index.ts` → 12 thì × 6 level, `lib/subskills/data/*.json`
   → 10 loại câu hỏi Part 2, `lib/grammar/topics.ts`, `lib/skills/structure.ts`,
   `lib/full-tests/data/`) và sinh ra `lib/roadmap/catalog.generated.ts`.
2. `lib/roadmap/catalog.meta.ts` viết tay phần **không suy ra được từ data**:
   `bandMin/bandMax`, `estMinutes`, `prereq`, `tags`. Ước chừng ~15 dòng cho mỗi
   nhóm chứ không phải mỗi entry (meta khai theo nhóm, script nhân ra từng entry).
3. `lib/roadmap/catalog.ts` gộp hai cái trên và **xác minh href tồn tại**.

### Chốt chặn bắt buộc
`npm run check:catalog` — script đối chiếu mọi `href` trong catalog với cây route
thật (`app/**/page.tsx` + các slug trong data). Lệch một cái là fail. Chạy trong
CI/trước deploy. **Đây là cái chặn "lộ trình đẹp nhưng bấm vào 404"** — lỗi chí
mạng duy nhất của tính năng này.

---

## 6. Engine chẩn đoán (`lib/roadmap/diagnose.ts`)

Vào: `FullTestAttempt` đã `done` (`partScores`, `listening`, `reading`, `total`).
Ra: `WeaknessReport`.

```ts
type PartDiagnosis = {
  part: 1|2|3|4|5|6|7;
  accuracy: number;        // 0..1
  relativeGap: number;     // accuracy trung bình toàn đề − accuracy part này
  absoluteFloor: boolean;  // accuracy < 0.5
  leverage: number;        // hệ số "dễ cải thiện", cố định trong code
  weight: number;          // số câu của part trong đề
  priority: number;        // điểm xếp hạng cuối
};
```

**Công thức**

```
overall      = tổng correct / tổng gradable
relativeGap  = overall − accuracy(part)                 // >0 là yếu hơn mặt bằng của chính mình
gapScore     = max(relativeGap, 0) + (absoluteFloor ? 0.15 : 0)
priority     = gapScore × sqrt(weight) × leverage
```

**Hệ số leverage** (cố định, nêu rõ lý do trong comment để sau này còn cãi nhau được):

| Part | Số câu | leverage | Vì sao |
|------|--------|----------|--------|
| 5 | 30 | 1.00 | Ngữ pháp, cải thiện nhanh nhất, có sẵn 3.984 câu + subskill theo thì |
| 2 | 25 | 0.90 | Luyện theo loại câu hỏi là lên rõ, có đủ 10 nhóm |
| 6 | 16 | 0.80 | Cùng gốc ngữ pháp với Part 5 |
| 1 | 6 | 0.75 | Dễ lên nhưng ít câu, không kéo điểm được nhiều |
| 3 | 39 | 0.60 | Cần nền nghe, lên chậm |
| 4 | 30 | 0.60 | Như Part 3 |
| 7 | 54 | 0.50 | Lên chậm nhất, phụ thuộc từ vựng + tốc độ đọc |

**Tại sao không so với "chuẩn theo band"**: so với chính mặt bằng của học viên thì
không cần bảng chuẩn ngoài (vốn dễ sai và khó bảo trì), lại đúng tinh thần "chữa
chỗ lệch nhất". `absoluteFloor` bù lại trường hợp học viên yếu đều — khi đó mọi
`relativeGap` đều ~0 mà vẫn cần giao bài nền.

**Đầu ra còn có**:
- `band`: dải điểm hiện tại (`<400`, `400–595`, `600–745`, `750–855`, `860+`) — dùng
  để lọc `bandMin/bandMax` của catalog.
- `gapToTarget`: mục tiêu − hiện tại; `weeksLeft`: từ `deadline`.
- `feasibility`: `"comfortable" | "tight" | "unrealistic"` — tính thô theo
  "≈ +50 điểm / tháng với 45 phút/ngày". Nếu `unrealistic` thì màn hình kết quả
  **nói thẳng** và đề nghị dời hạn hoặc tăng giờ, thay vì hứa suông.

---

## 7. Planner (`lib/roadmap/planner.ts`) — chạy không cần AI

### Ngân sách
```
minutesPerWeek = minutesPerDay × daysPerWeek
```
Rải vào đúng `daysPerWeek` ngày; chọn ngày theo thứ tự ưu tiên: ngày HV đã từng
hoạt động nhiều nhất (đọc `XpEvent` nếu có) → mặc định T2/T4/T6/T7...

### Quy tắc chia mỗi ngày
- **60%** thời lượng cho part ưu tiên #1 và #2.
- **25%** cho kỹ năng nền (`tags` chứa `grammar-core`, `listening-decode`, `vocab`).
- **15%** cho duy trì: part đang khá, để khỏi tụt.
- Mỗi ngày tối đa **3 việc core + 1 bonus** — quá nữa là nhìn đã nản.
- Xen kẽ Nghe/Đọc giữa các ngày liền nhau, không dồn 3 ngày Part 5 liên tiếp.
- Tuần nào cũng có **1 ngày nghỉ** kể cả khi `daysPerWeek = 7` (đổi thành ngày
  "ôn nhẹ 10 phút").

### Mốc kiểm tra
- Cuối mỗi tuần: 1 bài `part_practice` của part ưu tiên #1 ở chế độ thi thử →
  dùng chính `PartPracticeAttempt` làm thước đo tiến bộ.
- Cuối mỗi tháng: 1 `full_test` mới → cập nhật `StudyPlan.current`, vẽ lại mục tiêu.

### Né BTVN của giáo viên
Trước khi rải việc, đọc RTDB `homework/{studentCode}` (chỉ với HV có `studentCode`):
- Ngày đã có BTVN → chỉ giữ **1 việc core ngắn nhất**, bỏ bonus.
- Ngày có buổi học trên lớp (`ClassSession.day`, đã có `lib/schedule-day.ts` quy
  chuẩn 3 định dạng ngày) → cũng giảm tải như trên.

### Dồn ngày bỏ lỡ (lịch mềm)
Chạy lúc HV mở `/journal/missions`, hoặc cron 00:30 giờ VN:
- Task `pending` của ngày đã qua: giữ lại **tối đa 2 task `core`** có `order` nhỏ
  nhất → set `date = hôm nay`, `status = "pending"`, `rolledFromDate = ngày cũ`.
- Các task còn lại → `status = "missed"`.
- Ngày hôm nay đã có ≥3 core thì không dồn thêm, tất cả thành `missed`.
- Dồn ≥3 ngày liên tiếp hoặc tuần < 50% → kích hoạt `replan_missed` (§11).

---

## 8. Lớp AI (`lib/roadmap/ai.ts`)

Dùng `@google/genai` + `gemini-2.5-flash-lite` như `lib/ai/gemini.ts` đang dùng,
`responseMimeType: "application/json"`.

### AI được làm
1. Đổi thứ tự ưu tiên trong **biên độ cho phép** (chỉ hoán vị trong danh sách
   catalogId đã lọc sẵn; không thêm id lạ).
2. Viết `monthGoals[].summary`, `StudyWeek.goalText`, một câu động viên cho ngày.
3. Tinh chỉnh khối lượng: tăng/giảm tối đa **±1 task/ngày**.

### AI không được làm
- Không sinh `href`. Không sinh `title` cho bài không có trong catalog.
- Không đặt `minScore`/`minItems` (điều kiện đạt do planner quyết).
- Không đổi `deadline`, `targetScore`.

### Hợp đồng JSON
```ts
const PlanAiOutput = z.object({
  monthGoals: z.array(z.object({
    monthIndex: z.number().int().min(1).max(12),
    label: z.string().max(60),
    targetScore: z.number().int().min(10).max(990),
    focus: z.array(z.string()).max(4),
    summary: z.string().max(400),      // tiếng Việt, xưng "bạn"
  })).max(6),
  week: z.object({
    theme: z.string().max(60),
    goalText: z.string().max(300),
    taskOrder: z.array(z.string()),    // catalogId — phải là tập con của danh sách vào
    adjust: z.enum(["lighter", "keep", "heavier"]),
  }),
  encouragement: z.string().max(200),
});
```
Validate xong còn kiểm thêm: `taskOrder ⊆ allowedCatalogIds`. Sai → ghi
`PlanEvent{type:"ai_failed"}` và dùng DraftPlan. **Không retry quá 1 lần.**

### Hạn mức
- Sinh lộ trình lần đầu: 1 lần gọi/HV.
- Tái lập hằng tuần: 1 lần/tuần/HV (cron).
- HV tự bấm "Tính lại": **2 lần/tháng**, đếm bằng
  `PlanEvent.aiCalledAt` trong 30 ngày gần nhất.
- Vượt hạn → vẫn tính lại được, nhưng bằng rule thuần, báo rõ cho HV.

### Giọng văn
Tiếng Việt, xưng "bạn", không sáo. Không hứa điểm số chắc chắn. Khi
`feasibility = "unrealistic"` thì phải nói thật là lịch này căng.

---

## 9. Tự tích xong — bảng evidence

Không có checkbox tự khai. Mỗi `StudyTask.target` có một `EvidenceSpec` trỏ vào
bảng dữ liệu thật:

| `kind` | Bảng đối chiếu | Điều kiện đạt |
|--------|----------------|---------------|
| `subskill` | `SubskillAttempt` | có bản ghi `(part, questionWord/tense, exerciseIndex)` khớp, `score ≥ minScore`, `completedAt ≥ task.date` |
| `part_practice` | `PartPracticeAttempt` | `status="done"`, `skill/part` khớp, `gradable ≥ minItems`, `correct/gradable ≥ minAccuracy` |
| `full_test` | `FullTestAttempt` | `status="done"`, `completedAt` trong tuần của task |
| `grammar` | `GrammarAttempt` | số câu đúng ≥ ngưỡng trong khoảng thời gian |
| `dictation` | `UserProgress` | `bestScore ≥ 70` cho `lessonId` |
| `vocab` | `VocabProgress` | ≥ N thẻ được ôn trong ngày |

**Khi nào chạy đối chiếu**
1. Mỗi lần mở `/journal/missions` hoặc `/journal/roadmap` → `GET /api/roadmap/today`
   (tự chạy matcher cho task `pending` của hôm nay + 2 ngày trước).
2. Ngay sau khi nộp bài ở các khu có task (hook nhẹ, gọi `POST /api/roadmap/tasks/sync`
   fire-and-forget) — để học viên thấy tích xanh ngay chứ không phải quay về rồi F5.

Cho phép **tích tay** một task (`status = "skipped"` + lý do) vì đôi khi HV làm bài
ở ngoài web; nhưng việc tích tay không cộng XP và không tính vào thống kê tiến bộ.

---

## 10. API

| Route | Method | Việc |
|-------|--------|------|
| `/api/roadmap/intake` | POST | Lưu form 5 câu vào `Goal` + bộ nhớ tạm, trả về slug đề đầu vào được chọn |
| `/api/roadmap/generate` | POST | Chẩn đoán + planner + AI → tạo `StudyPlan` + `StudyWeek[1]` + tasks. Idempotent theo `baselineAttemptId` |
| `/api/roadmap` | GET | Toàn cảnh: plan + tháng + tuần hiện tại + tiến độ |
| `/api/roadmap/today` | GET | Task hôm nay (đã chạy dồn ngày + đối chiếu evidence) |
| `/api/roadmap/tasks/sync` | POST | Đối chiếu lại evidence cho các task đang mở |
| `/api/roadmap/tasks/[id]` | PATCH | Tích tay / bỏ qua / đổi ngày (HV) |
| `/api/roadmap/replan` | POST | HV bấm "Tính lại lộ trình" (có hạn mức) |
| `/api/cron/roadmap-weekly` | GET | Chủ nhật: tổng kết tuần + sinh tuần kế |
| `/api/cron/roadmap-rollover` | GET | Hằng ngày 00:30 VN: dồn việc, đánh dấu `missed`, kích hoạt `replan_missed` |
| `/api/admin/roadmap/[userId]` | GET/PATCH | GV xem & sửa (phase 5) |

Cron thêm vào `vercel.json` (đang có 2 cron, thêm 2):
```json
{ "path": "/api/cron/roadmap-rollover", "schedule": "30 17 * * *" },
{ "path": "/api/cron/roadmap-weekly",   "schedule": "0 14 * * 0" }
```
> Giờ Vercel là UTC. `30 17 * * *` = 00:30 VN; `0 14 * * 0` = 21:00 VN Chủ nhật.
> Mọi phép tính ngày trong engine phải quy về **Asia/Ho_Chi_Minh**, không dùng
> `new Date().toISOString().slice(0,10)` của máy chủ — đây là bẫy kinh điển sẽ làm
> lệch một ngày toàn bộ lịch.

---

## 11. Tái lập kế hoạch

| Ngòi nổ | Lúc nào | Làm gì | Gọi AI? |
|---------|---------|--------|---------|
| `replan_weekly` | CN 21:00 VN | Ghi `StudyWeek.review`, sinh tuần kế theo tỉ lệ hoàn thành + độ chính xác tuần vừa rồi | Có (1 lần/tuần) |
| `replan_after_test` | Ngay sau khi nộp full test mới | Cập nhật `StudyPlan.current`, chẩn đoán lại, vẽ lại `monthGoals`, sinh lại tuần đang chạy | Có |
| `replan_missed` | Bỏ lỡ ≥3 ngày liên tiếp, hoặc tuần < 50% | **Giảm tải**: cắt `minutesPerDay` còn 2/3, bỏ bonus, giữ đúng part ưu tiên #1 | Không (rule) |
| `manual` | HV bấm nút | Như `replan_weekly` | Có, trong hạn mức |
| `teacher_edit` | GV sửa ở `/admin` | Ghi đè task, không sinh lại | Không |

Quy tắc điều chỉnh tải theo tuần vừa qua:

| Hoàn thành | Độ chính xác trung bình | Tuần sau |
|------------|------------------------|----------|
| ≥ 85% | ≥ 80% | Tăng 1 bậc độ khó (level +1), giữ thời lượng |
| ≥ 85% | < 65% | Giữ độ khó, thêm bài nền cùng chủ đề |
| 50–85% | — | Giữ nguyên |
| < 50% | — | Giảm còn 2/3 thời lượng, chỉ giữ part ưu tiên #1 |

---

## 12. UI

### `/journal/roadmap` — trang toàn cảnh
Theo lớp giấy của sổ (`project_journal_notebook_ui`: color-mix, bẫy background inline).
- **Dải tháng**: 3–6 thẻ tháng, thẻ tháng hiện tại mở rộng, có mục tiêu điểm.
- **Tuần hiện tại**: 7 ô ngày, ô có việc hiện chấm tròn theo trạng thái
  (xám chưa tới · vàng đang mở · xanh xong · đỏ lỡ), bấm vào xem việc của ngày.
- **Thanh tiến độ**: điểm hiện tại → mục tiêu, kèm mốc các lần thi thử.
- **Nút**: "Tính lại lộ trình" (hiện số lần còn lại trong tháng).

### `/journal/missions` — thêm khối "Lộ trình hôm nay"
Đặt **trên** khối BTVN (vì BTVN có hạn nộp rõ ràng còn lộ trình là việc hằng ngày —
nếu để dưới sẽ bị cuộn qua). Mỗi dòng: tên bài · thời lượng ước tính · điều kiện đạt ·
nút vào bài. Việc dồn từ hôm qua có nhãn "dồn từ 11/11".
Không đụng vào logic BTVN hiện tại (`lib/journal/homework.ts`, khoá RTDB
`{hwId}_{section}_{index}` — giữ nguyên, chỉ đọc để giảm tải).

### `/journal/roadmap/start` — form onboarding
Một màn, 5 câu, mỗi câu một dòng chip chọn nhanh. Cuối màn nói rõ:
"Bài test mất khoảng 2 tiếng, làm một mạch mới ra kết quả chính xác."
Có nút "Để sau" → lưu nháp intake.

### `/journal/roadmap/result` — màn hình chẩn đoán
Khoảnh khắc quan trọng nhất của tính năng. Phải có:
- Điểm tổng + Listening/Reading, so với mục tiêu.
- Biểu đồ cột 7 part (độ chính xác), tô đỏ 2–3 part ưu tiên.
- Một đoạn AI giải thích "vì sao lộ trình của bạn bắt đầu từ Part 5".
- Lịch tuần 1 hiện ngay bên dưới, nút "Bắt đầu học hôm nay".

---

## 13. Các phase

> Mỗi phase phải tự chạy được và deploy được. Theo lệ dự án: xong phase nào
> commit + push phase đó ngay.

### Phase 1 — Nền dữ liệu & chẩn đoán (không UI)
**Mục tiêu**: từ một `FullTestAttempt` ra được `WeaknessReport` và một `DraftPlan`
tuần 1 đúng, chạy bằng script.
- 4 bảng Prisma + migration tay.
- `lib/roadmap/diagnose.ts` + test đơn vị (3 hồ sơ mẫu: yếu đều 350, lệch nghe 550, lệch đọc 600).
- `scripts/roadmap/build-catalog.mjs` + `catalog.meta.ts` + `catalog.ts`.
- `npm run check:catalog` chặn href chết.
- `lib/roadmap/planner.ts` (chưa AI).
- **Verify**: `node scripts/roadmap/dry-run.mjs --attempt <id>` in ra lịch 1 tuần,
  mọi href mở được, tổng phút khớp ngân sách ±10%.

### Phase 2 — Sinh lộ trình thật + màn hình kết quả
**Mục tiêu**: học viên làm test xong là thấy lộ trình.
- `lib/roadmap/ai.ts` + zod + fallback.
- `/api/roadmap/intake`, `/api/roadmap/generate`, `/api/roadmap`.
- `/journal/roadmap/start`, `/journal/roadmap/result`, `/journal/roadmap`.
- **Verify**: tài khoản test mới → làm 1 đề (có thể nộp sớm) → có plan + tuần 1 +
  4 tuần khung tháng; tắt `GEMINI_API_KEY` vẫn ra lộ trình (bản rule).

### Phase 3 — Nhiệm vụ hằng ngày + tự tích xong
**Mục tiêu**: vòng lặp hằng ngày khép kín.
- `/api/roadmap/today`, `/api/roadmap/tasks/sync`, `/api/roadmap/tasks/[id]`.
- Khối "Lộ trình hôm nay" trong `/journal/missions`.
- Bảng evidence cho 6 `kind`.
- Dồn ngày (rollover) + cron `roadmap-rollover`.
- **Verify**: làm thật 1 bài subskill → task tự xanh trong ≤1 lần tải trang;
  để qua đêm 1 ngày không làm → hôm sau thấy đúng 1–2 việc dồn, phần còn lại "lỡ".

### Phase 4 — Tái lập kế hoạch
- Cron `roadmap-weekly`, `replan_after_test`, `replan_missed`, nút "Tính lại".
- `StudyWeek.review` + hạn mức AI.
- **Verify**: giả lập tuần hoàn thành 95% → tuần sau level +1; giả lập 30% →
  tuần sau nhẹ đi đúng 1/3.

### Phase 5 — Tích hợp hệ sinh thái
- Push nhắc việc (tái dùng engine push đã có; cẩn thận VAPID phải thống nhất 4 nơi
  theo `project_push_vapid`).
- XP: thêm `XpSource` `"roadmap_task"` (5 XP) và `"roadmap_day"` (20 XP), huy hiệu
  tuần/tháng. Chỉ cộng XP cho task **tự tích tự động**, không cộng cho tích tay.
- Trang GV `/admin/students/[code]` thêm tab Lộ trình: xem, đổi/xoá/thêm task, ghi chú tuần.
- Biểu đồ điểm dự kiến vs thực tế ở `/journal/progress`.

### Phase 6 — Mở rộng
- Speaking/Writing vào lộ trình (dùng AI chấm sẵn có làm thước đo; chú ý hạn mức AI
  đã có cột riêng theo `project_ai_grading`).
- Mini-test đầu vào rút gọn 45 phút cho người ngại làm 2 tiếng.
- Mở cho học viên cũ (xem §15).

---

## 14. Rủi ro và bẫy đã biết

| Rủi ro | Cách chặn |
|--------|-----------|
| **Link chết trong lộ trình** — lỗi chí mạng | `check:catalog` chạy trước deploy; `StudyTask.href` chụp lại lúc sinh; UI bắt 404 → nút "báo lỗi bài" |
| AI trả JSON rác / hết quota | zod + whitelist catalogId + fallback DraftPlan; không retry quá 1 lần; ghi `PlanEvent{ai_failed}` |
| Lệch múi giờ 1 ngày | Mọi phép tính ngày qua helper `lib/roadmap/vn-date.ts` (Asia/Ho_Chi_Minh), cấm `toISOString().slice(0,10)` trong engine |
| Build Vercel chết vì font / module | Theo `feedback_vercel_font_build_fail`: nếu lỗi `next/font/google` hàng loạt dù local sạch → deploy lại `--force` |
| DDL không chạy được từ local | Tạo bảng qua Supabase MCP / migration tay trước, tách khỏi bước code (`project_db_connectivity`) |
| Giao quá sức → HV bỏ | Trần 3 core + 1 bonus/ngày; 1 ngày nghỉ/tuần; `replan_missed` tự giảm tải; `feasibility` nói thật khi lịch căng |
| Lộ trình đá nhau với BTVN giáo viên | Ngày có BTVN/có lớp chỉ giữ 1 core; GV sửa đè được |
| Hai nguồn chân lý về "đã làm xong" | Lộ trình **không** có trạng thái riêng — luôn suy từ bảng làm bài thật (§9) |
| Chi phí AI phình | Mỗi HV ≈ 1 lần sinh + 4 lần/tháng tái lập + tối đa 2 lần tự bấm ≈ 7 lần gọi/tháng với `flash-lite` |
| HV làm test đầu vào dở dang | Chỉ nhận `FullTestAttempt.status="done"` và đủ 7 part (`total` khác null); thiếu part → báo "làm đủ 7 part mới chẩn đoán được" |
| Script test phải là module | Theo `feedback_build_fixes`: script trong `scripts/` dùng `.mjs` |

---

## 15. Điểm còn cần bạn chốt

1. **"Học viên mới" định nghĩa thế nào?**
   Bạn chọn "chỉ dành cho HV mới", nhưng cần một ranh giới chạy được bằng code.
   Đề xuất: *hiện lối vào lộ trình cho tài khoản chưa có `StudyPlan` nào* — tức là
   gồm cả người đã dùng web lâu nhưng chưa từng tạo lộ trình. Nếu bạn muốn nghĩa hẹp
   (chỉ tài khoản tạo sau ngày bật tính năng) thì nói, tôi đổi điều kiện thành
   `Profile.createdAt >= FEATURE_LAUNCH_DATE`.
   Dù chọn cách nào, HV đã thi thử full test trong 30 ngày gần nhất nên được dùng
   luôn kết quả đó thay vì bắt làm lại.

2. **Đề đầu vào lấy đề nào trong 10 đề EST 2026?**
   Đề xuất: ghim cố định `est-2026-test-1` cho mọi HV mới (so sánh giữa các HV được,
   và giữ 9 đề còn lại làm mốc kiểm tra hằng tháng). Nếu sợ lộ đề thì xoay vòng
   theo `userId % 3` trong 3 đề đầu.

3. **Thời lượng lộ trình tối đa** khi HV không đặt ngày thi: đề xuất mặc định 3 tháng.

---

## 16. Thứ tự bắt tay vào việc

```
1. Tạo 4 bảng Prisma (qua Supabase MCP)        → verify: \d study_plans
2. diagnose.ts + test 3 hồ sơ mẫu              → verify: npm test
3. build-catalog.mjs + check:catalog           → verify: 0 href chết
4. planner.ts + dry-run.mjs                    → verify: lịch 1 tuần hợp lý
5. ai.ts + fallback                            → verify: tắt API key vẫn ra lộ trình
6. API generate + 3 trang UI                   → verify: chạy thật 1 tài khoản mới
7. Nhiệm vụ hằng ngày + evidence + rollover    → verify: làm bài → tự xanh
8. Cron tái lập + nút tính lại                 → verify: giả lập 2 kịch bản tuần
```
