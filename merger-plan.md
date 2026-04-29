# 📋 mytoeicdiary — Merger Plan

> **Tích hợp `STUDENT.html` + `teacher.html` + dictation app hiện tại thành một platform thống nhất.**
> Brand: **Anh Hiếu²** · Domain: `mytoeicdiary` (sẽ mua sau) · Hosting: Vercel

---

## 📑 Mục lục

1. [Executive Summary](#1-executive-summary)
2. [Locked-in Decisions](#2-locked-in-decisions)
3. [Architecture Overview](#3-architecture-overview)
4. [Timeline tổng thể](#4-timeline-tổng-thể)
5. [Phase 0 — Foundation](#phase-0--foundation)
6. [Phase 1A — Student Journal](#phase-1a--student-journal)
7. [Phase 1B — Teacher Admin](#phase-1b--teacher-admin)
8. [Phase 2 — Cross-features](#phase-2--cross-features)
9. [Phase 3 — Polish](#phase-3--polish)
10. [Phase 4 — Soft launch](#phase-4--soft-launch)
11. [Schema spec](#11-schema-spec)
12. [File/folder structure](#12-filefolder-structure)
13. [Risk register](#13-risk-register)
14. [Post-launch roadmap](#14-post-launch-roadmap)
15. [Definition of Done per Phase](#15-definition-of-done-per-phase)

---

## 1. Executive Summary

### Mục tiêu
Một Next.js app **`mytoeicdiary`** chứa 3 không gian:
- **`/practice`** — Dictation app (đã có, dark theme)
- **`/journal`** — Student portal (warm beige/terracotta theme — match logo)
- **`/admin`** — Teacher panel (light theme, gold accent)

### Strategy
- **Dual backend**: Supabase (auth + dictation + identity) + Firebase RTDB (student/teacher content data, giữ nguyên)
- **No data migration**: học viên/teacher mới đăng ký fresh, học viên cũ tiếp tục dùng STUDENT.html
- **Backwards compat**: 2 HTML cũ vẫn online vĩnh viễn làm backup

### Resource
- **Solo dev, part-time** (~3-4h/day)
- **Timeline**: ~7-8 tháng (calendar time)
- **No deadline**

---

## 2. Locked-in Decisions

| # | Quyết định | Đáp án |
|---|---|---|
| 1 | Sequence | Parallel (1A + 1B chạy interleaved) |
| 2 | Auth model | Email + password (Supabase Auth) |
| 3 | Feature scope | Port toàn bộ — không skip module nào |
| 4 | Volume | <50 users hiện tại, scale sau |
| 5 | Multi-teacher | 1 student → 1 teacher (`teacherId` field) |
| 6 | Realtime | Bắt buộc — Firebase listeners |
| 7 | Design themes | 3 themes riêng (dark/warm/light) chia sẻ shell layout |
| 8 | New features | Streak gamification + dictation results vào journal |
| 9 | Old HTML sunset | Giữ vĩnh viễn làm backup |
| 10 | Hosting | Vercel; domain mua sau |
| 11 | Existing students | **Fresh start** — STUDENT.html cũ giữ nguyên cho user cũ |
| 12 | Firebase security | **Permissive rules** (tradeoff cho backwards compat) → tighten ở Phase 4+ |
| 13 | Admin account | Seed script tạo thầy Hiếu admin |
| 14 | Email service | Supabase Auth built-in |
| 15 | Firebase Auth bridge | Supabase Edge Function exchange |
| 16 | TTS | Web Speech API browser-side |
| 17 | Class-teacher | Classes độc lập với teacher assignment |

---

## 3. Architecture Overview

```
                              ┌──────────────────────────────┐
                              │   mytoeicdiary.com (Vercel)   │
                              │     Next.js 16 App Router      │
                              │                                │
   /practice  ←── Dictation app (existing, dark theme)         │
   /journal   ←── Student Portal (warm beige theme)            │
   /admin     ←── Teacher Panel (light theme)                  │
                              │                                │
                              └────┬───────────────────┬───────┘
                                   │                   │
                       ┌───────────▼─────┐    ┌────────▼────────┐
                       │    Supabase      │    │  Firebase RTDB   │
                       │ ───────────────  │    │ ───────────────  │
                       │ • Auth           │    │ • students/      │
                       │ • Profile        │    │ • classes/       │
                       │ • Lessons        │    │ • bookings/      │
                       │ • UserProgress   │    │ • slots/         │
                       │ • TestSeries     │    │ • homework/*     │
                       │ • XpEvent        │    │ • daylinks/      │
                       │ • TeacherInvite  │    │ • attendance/    │
                       │ • Achievements   │    │ • notifications/ │
                       └──────────────────┘    └──────────────────┘
                          (source of truth         (source of truth
                           for identity +          for student/teacher
                           dictation +             content + missions)
                           gamification)

    ┌────────────────────────────────────────────────────────┐
    │  GitHub Pages (legacy, vẫn online)                      │
    │  • taahh33cd.github.io/student-site (STUDENT.html)      │
    │  • taahh33cd.github.io/teacher-panel (teacher.html)     │
    │  ─────────────────────────────────────────────────────  │
    │  Đọc/ghi cùng Firebase RTDB → data sync với app mới     │
    └────────────────────────────────────────────────────────┘
```

---

## 4. Timeline tổng thể

> **Solo dev, ~3.5h/day part-time** ≈ ~17-18 working hours/tuần

```
Tháng 1       │ ████░░░░░░░░░░░░ Phase 0 (Foundation)
Tháng 2       │ ░░░░██████████░░ Phase 1A (Journal) ─┐ alternating
Tháng 3       │ ████░░░░██░░░░░░ Phase 1B (Admin)   ─┘ focus
Tháng 4       │ ░░██████████████ ... 1A + 1B ...
Tháng 5       │ ████████░░░░░░░░ ... 1A + 1B done
Tháng 6       │ ░░░░██████████░░ Phase 2 (Cross-features)
Tháng 7       │ ████████████░░░░ Phase 3 (Polish)
Tháng 8       │ ░░░░░░░░██████░░ Phase 4 (Launch)
```

**Tổng**: ~7-8 tháng calendar time. Có thể nhanh hơn nếu rảnh, chậm hơn nếu bận.

---

## PHASE 0 — Foundation

> **3-4 tuần part-time** · **Critical phase**, không thể rush.

### 🎯 Goal
Hạ tầng auth + realtime + theming sẵn sàng để Phase 1A/1B chạy không bị block.

### 0.1 Firebase client integration *(2-3 ngày)*

- [ ] `npm install firebase react-firebase-hooks`
- [ ] Tạo `lib/firebase/client.ts`:
  ```typescript
  import { initializeApp, getApps } from "firebase/app";
  import { getDatabase } from "firebase/database";
  import { getAuth } from "firebase/auth";

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: "quanlyhocvien-b1796.firebaseapp.com",
    databaseURL: "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quanlyhocvien-b1796",
    storageBucket: "quanlyhocvien-b1796.firebasestorage.app",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  export const firebaseApp = getApps()[0] ?? initializeApp(config);
  export const firebaseDb = getDatabase(firebaseApp);
  export const firebaseAuth = getAuth(firebaseApp);
  ```
- [ ] Update `.env.local` + `.env.example`
- [ ] Add Firebase env vars vào Vercel project settings
- [ ] Tạo `app/_test/firebase/page.tsx` (dev-only) đọc `students/` để verify connection

### 0.2 Realtime hooks layer *(3-4 ngày)*

> **Quan trọng nhất** của Phase 0. Viết đúng 1 lần, tái dùng khắp nơi.

- [ ] `hooks/firebase/useStudent.ts`:
  ```typescript
  export function useStudent(studentCode: string) {
    const [snap, loading, error] = useObject(ref(firebaseDb, `students/${studentCode}`));
    return { student: snap?.val(), loading, error };
  }
  ```
- [ ] Hooks cần viết:
  - `useStudent(code)` — 1 student realtime
  - `useAllStudents()` — list (teacher view, filtered by teacherId)
  - `useHomework(code)` — homework array của 1 student
  - `useDayLinks(code)` — submissions
  - `useBookings(filter)` — pending/approved/all
  - `useSlots()` — available slots
  - `useClasses()` — list classes
  - `useClass(id)` — class detail với members
  - `useNotifications(code)` — notifications cho student
  - `useAttendance(code)` — attendance records
- [ ] Write helpers (transactional):
  ```typescript
  export async function updateStudent(code: string, partial: Partial<Student>);
  export async function pushHomework(code: string, hw: Homework);
  export async function submitDayLink(code: string, hwId: string, url: string);
  export async function requestBooking(code: string, slotId: string, note: string);
  ```
- [ ] Loading/error UI standardization (shadcn-style skeleton + toast)
- [ ] Auto-cleanup listeners on unmount (built into `react-firebase-hooks`)
- [ ] Optimistic update wrapper

### 0.3 Supabase schema updates *(2 ngày)*

Migration file: `prisma/migrations/YYYYMMDD_journal_admin_foundation.sql`

```prisma
model Profile {
  // ... existing fields
  role            String    @default("student")  // "student"|"teacher"|"admin"
  studentCode     String?   @unique              // map → Firebase students/{code}
  teacherId       String?                        // for students: assigned teacher (Profile.id)
  invitedBy       String?
  invitedAt       DateTime?
  acceptedAt      DateTime?

  // gamification
  totalXp         Int       @default(0)
  level           Int       @default(1)
  longestStreak   Int       @default(0)
  lastActiveDate  DateTime?

  managedStudents Profile[] @relation("TeacherStudent")
  teacher         Profile?  @relation("TeacherStudent", fields: [teacherId], references: [id])

  xpEvents        XpEvent[]
  invitesSent     TeacherInvite[]
}

model TeacherInvite {
  id          String    @id @default(cuid())
  email       String
  studentCode String?                     // teacher pre-fills nếu muốn
  teacherId   String                      // người invite
  token       String    @unique
  role        String    @default("student") // student | teacher
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime  @default(now())

  teacher     Profile   @relation(fields: [teacherId], references: [id])
  @@index([token])
  @@index([email])
}

model XpEvent {
  id        String   @id @default(cuid())
  userId    String
  source    String   // "dictation_lesson"|"vocab_review"|"homework_submit"|"test_score"|"streak_bonus"|"login"
  xp        Int
  metadata  Json?
  createdAt DateTime @default(now())

  user      Profile  @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
  @@index([source])
}
```

- [ ] Apply migration
- [ ] Update RLS policies (XpEvent: user only reads own; Profile: teacher reads managed students)
- [ ] Seed script `prisma/seed.ts`:
  ```typescript
  // Tạo admin account thầy Hiếu
  const admin = await supabase.auth.admin.createUser({
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    email_confirm: true,
  });
  await prisma.profile.upsert({
    where: { id: admin.id },
    create: { id: admin.id, role: "admin", displayName: "Anh Hiếu", ... },
    update: { role: "admin" },
  });
  console.log("✅ Admin account created:", admin.email);
  ```
- [ ] Run seed → admin login OK

### 0.4 Auth bridge: Supabase JWT → Firebase Custom Token *(3-4 ngày)*

> Đây là điểm phức tạp nhất kỹ thuật của Phase 0.

**Flow:**
```
1. User logs in qua Supabase Auth → có Supabase JWT
2. Client gọi /api/firebase-token với JWT
3. Edge Function verify JWT, đọc role + studentCode từ Profile
4. Edge Function dùng Firebase Admin SDK tạo Custom Token với claims
5. Client signInWithCustomToken(token) → Firebase Auth state có claims
6. Firebase rules kiểm tra claims để allow/deny (LATER trong Phase 4)
```

- [ ] Tạo Firebase service account key (Firebase Console → Project Settings → Service accounts)
- [ ] Lưu key vào Supabase Vault (encrypted) hoặc Vercel env (`FIREBASE_SERVICE_ACCOUNT_JSON`)
- [ ] Supabase Edge Function `firebase-token`:
  ```typescript
  // supabase/functions/firebase-token/index.ts
  import { initializeApp, cert } from "firebase-admin/app";
  import { getAuth } from "firebase-admin/auth";

  serve(async (req) => {
    const { user } = await getSupabaseUser(req);
    const profile = await getProfile(user.id);
    const customToken = await firebaseAuth.createCustomToken(user.id, {
      role: profile.role,
      studentCode: profile.studentCode,
      teacherId: profile.teacherId,
    });
    return new Response(JSON.stringify({ token: customToken }));
  });
  ```
- [ ] Client hook `useFirebaseAuthBridge()` — auto sign in Firebase khi Supabase user xuất hiện
- [ ] Test end-to-end: Supabase login → Firebase auth state có đầy đủ claims

> ⚠️ **Note Phase 4**: Firebase Security Rules sẽ check claims này. Trong Phase 0 vẫn để rules permissive.

### 0.5 Layout shells & theming *(2 ngày)*

CSS architecture:
```css
/* globals.css */
:root.theme-dictation { /* dark — existing */ }
:root.theme-journal {
  --bg: #F5EFE6; --paper: #FBF7F2; --ink: #2C1E0F;
  --orange: #C4622D; --orange2: #E8885C; ...
}
:root.theme-admin {
  --bg: #F0F2F7; --s1: #FFFFFF; --gold: #B07D1A;
  --sb-bg: #1E2235; ...
}
```

- [ ] `app/(student)/journal/layout.tsx` — apply `theme-journal` class
- [ ] `app/(teacher)/admin/layout.tsx` — apply `theme-admin` class với sidebar
- [ ] Existing dictation routes — apply `theme-dictation`
- [ ] Top-level navigation switcher (icon-based, học viên thấy /practice + /journal, teacher thấy thêm /admin)
- [ ] Logo `Anh Hiếu²` ở header → tạo `components/Brand.tsx` reusable

### 0.6 Routing guards *(1 ngày)*

`middleware.ts`:
```typescript
export async function middleware(req: NextRequest) {
  const { user, profile } = await getSession(req);

  if (req.url.includes("/admin")) {
    if (!user || (profile?.role !== "teacher" && profile?.role !== "admin")) {
      return NextResponse.redirect("/auth/login");
    }
  }

  if (req.url.includes("/journal")) {
    if (!user) return NextResponse.redirect("/auth/login");
    if (!profile?.studentCode) return NextResponse.redirect("/auth/onboarding-incomplete");
  }
}
```

- [x] Test với 3 accounts (student / teacher / admin) — proxy.ts guards `/admin` & `/journal`
- [x] Smart redirect post-login dựa role — login.tsx + `/auth/post-login` route
- [x] `/auth/onboarding-incomplete` page khi student thiếu studentCode
- [x] `/journal` layout server-side guard fetch profile.studentCode
- [x] `/api/auth/signout` route cho logout button

### 0.7 Email templates *(1 ngày)* ✅

Supabase Auth có sẵn email templates, customize tiếng Việt:
- [x] Confirm signup → "Chào mừng tới Anh Hiếu² ..." (`supabase/templates/confirmation.html`)
- [x] Reset password → "Đặt lại mật khẩu..." (`supabase/templates/recovery.html`)
- [x] Magic link → cho teacher invite flow (`supabase/templates/magic_link.html`)
- [x] Invite email (`supabase/templates/invite.html`)
- [x] Email change (`supabase/templates/email_change.html`)
- [x] Branding: warm beige `#F5EFE6` + orange `#C4622D` + Anh Hiếu² logo
- [x] `supabase/config.toml` wires templates vào Auth

> Apply: paste HTML vào Supabase Dashboard → Auth → Email Templates, hoặc `supabase db push` nếu dùng local CLI.

### Phase 0 Definition of Done
- ✅ `npm run dev` start không error
- ✅ Login/logout flow OK với 3 role types
- ✅ Tạo invite từ admin → nhận email → click link → tạo password → login OK
- ✅ Firebase listener chạy, real-time test OK (mở 2 tab, edit ở 1 tab thấy update tab kia)
- ✅ 3 themes hiển thị đúng
- ✅ Middleware chặn đúng các route
- ✅ Seed admin chạy được, login admin OK

---

## PHASE 1A — Student Journal

> **8-10 tuần part-time** · Chạy interleaved với 1B.

### 1A.1 Dashboard tab *(4-5 ngày)*

- [ ] Welcome card:
  - Tên học viên (từ Supabase Profile)
  - Tuần học hiện tại (từ Firebase `students/{code}/currentWeek`)
  - Pull quote / motivation (Firebase `students/{code}/note` từ teacher)
- [ ] TOEIC score progress:
  - Big number (latest score) + target (`students/{code}/goal`)
  - Visual bar 0-990
  - Sublabel: "+15 từ test trước"
- [ ] Quick stats grid:
  - Streak hiện tại (Supabase Profile.lastActiveDate logic)
  - XP + Level
  - Hôm nay: X mission tasks, Y vocab to review
  - Tổng thời gian học (từ UserProgress)
- [ ] Upcoming schedule (3 items)
- [ ] **NEW**: Dictation widget (Phase 2 sẽ làm) — placeholder ngày này

### 1A.2 Scores tab *(3 ngày)*

- [ ] Line chart điểm theo time (Recharts/Chart.js)
- [ ] History list (card per test):
  - Score, date, parts breakdown
  - Edit/delete (own scores only)
- [ ] Form nhập điểm mới:
  - Date picker
  - 7 inputs cho Part 1-7
  - Auto-sum total
  - Note (optional)
  - Submit → ghi `students/{code}/scores` array
- [ ] Compare với target → progress %
- [ ] Best/avg/recent stats

### 1A.3 Vocabulary tab *(7-10 ngày)* — module phức tạp nhất

- [ ] Vocab card list:
  - Sort theo SRS due date
  - Color tags: due (đỏ) / soon (cam) / ok (xanh)
  - Filter theo Part (1-7) + tag
  - Search bar
- [ ] Add new word form:
  - Input từ → blur → auto-lookup `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
  - Auto-fill IPA, definition, examples, audio URL
  - Manual override fields
  - POS dropdown (n/v/adj/adv/...)
  - Translation VN (manual)
  - Tag Part dropdown
  - Submit → ghi `students/{code}/vocab/{wordId}`
- [ ] Audio playback:
  - Web Speech API: `new SpeechSynthesisUtterance(word).speak()`
  - Hoặc dùng audio URL từ dictionaryapi.dev nếu có
  - Visual playing animation
- [ ] Review session mode:
  - Full-screen card flip UI
  - "Biết" / "Không biết" buttons
  - Update `repCount`, `nextReview` (SRS algorithm)
- [ ] SRS algorithm (Leitner box):
  ```
  rep 0 → review tomorrow
  rep 1 → 3 days
  rep 2 → 7 days
  rep 3 → 14 days
  rep 4 → 30 days
  rep 5 → 60 days (mastered)
  Wrong answer → reset rep to 0
  ```
- [ ] XP integration:
  - Review 1 card → +2 XP (call `recordXp(userId, "vocab_review", 2)`)
  - Master a word → +20 XP

### 1A.4 Missions tab *(6-7 ngày)*

- [ ] Day-by-day calendar UI port từ STUDENT.html:
  - Big calendar date block (D + Month + weekday)
  - Progress ring per day (% completion)
  - Color states: today (orange) / done (green) / overdue (red) / future (neutral)
  - Click expand/collapse
- [ ] Day body:
  - Day link submission zone (input URL + submit)
  - 5 sections: vocab / reading / listening / practice / other
  - Checkbox items với type tags
  - Click checkbox → mark done (Firebase write)
- [ ] Animations:
  - Ring fill animation
  - Bounce khi 100% done
  - Checkbox check animation
- [ ] XP integration: hoàn thành mission task → +5 XP

### 1A.5 Tasks tab *(2 ngày)*

- [ ] Filter: All / Today / Upcoming / Overdue
- [ ] Type filter: L/R/G/V/W/O tags (multi-select)
- [ ] Group by date hoặc by type
- [ ] Same data source as Missions, khác cách render

### 1A.6 Error Log tab *(3 ngày)*

- [ ] Form ghi lỗi sau test:
  - Section: Listening / Reading
  - Sub-category dropdown:
    - Listening: word_recognition / distractor / inference / pacing
    - Reading: vocab / grammar / logic / detail / inference
  - Question detail (text)
  - Test reference (link sang test set)
- [ ] List errors theo session
- [ ] Stats heatmap: errors by type
- [ ] Lưu Firebase `students/{code}/errorLog/{sessionId}`

### 1A.7 Paraphrase tab *(2 ngày)*

- [ ] Add cặp từ đồng nghĩa:
  - Word A
  - Word B (paraphrase)
  - Context (optional)
  - Tag Part
- [ ] Card review giống vocab SRS
- [ ] Lưu `students/{code}/paraphraseLog`

### 1A.8 Schedule tab *(2 ngày)*

- [ ] Read-only week view
- [ ] Class schedule (từ class members → `classes/{id}/weeklySchedule`)
- [ ] 1-1 booking history
- [ ] Today highlight

### 1A.9 Booking tab *(3 ngày)*

- [ ] List available slots (`slots/`):
  - Filter date range
  - Show slot time + teacher
- [ ] Đặt lịch 1-1:
  - Click slot → modal note → submit
  - Ghi `bookings/{id}` với status="pending"
- [ ] My bookings list:
  - Pending / approved / declined badges
  - Cancel button (nếu pending)
- [ ] Realtime update khi teacher approve

### 1A.10 PWA install prompt (optional, có thể defer Phase 3)

### Phase 1A Definition of Done
- ✅ Tất cả 9 tabs render đúng
- ✅ Mọi action ghi data đều realtime sync (mở 2 tab → thấy update)
- ✅ XP events được ghi đúng
- ✅ Mobile responsive
- ✅ Theme warm beige consistent
- ✅ Test với account học viên dummy OK end-to-end

---

## PHASE 1B — Teacher Admin

> **8-10 tuần part-time** · Chạy interleaved với 1A.

### 1B.1 Sidebar shell + Dashboard *(3 ngày)*

- [ ] Sidebar layout (port từ teacher.html):
  - Logo + role badge
  - Nav items với badge counts (pending bookings, lagging students)
  - Bottom: btn add student + logout
- [ ] Top stats cards:
  - Tổng học viên đang manage
  - Tasks completed today
  - Pending bookings
- [ ] Today overview:
  - Học viên có homework hôm nay
  - Lagging students (overdue homework)
- [ ] **Multi-teacher**: filter `students/` by `teacherId === currentUser.id`
  - Admin role: thấy tất cả

### 1B.2 Students module *(5-6 ngày)*

- [ ] Card grid:
  - Avatar + tên + studentCode
  - Latest score / target
  - Progress bar
  - Today's homework status
  - Frozen badge nếu applicable
- [ ] Search + filter (active/frozen/lagging/by class)
- [ ] Student detail drawer:
  - Profile: name, code, target, current score
  - Editable fields
  - Note (private teacher-only) + Comments (visible to student)
  - Frozen toggle
  - Homework list (recent 7)
  - Score history
  - Quick actions
- [ ] Add student modal:
  - Email input
  - Tên
  - Optional: studentCode (auto-generate nếu để trống)
  - Target score
  - Submit → tạo TeacherInvite + gửi email
- [ ] Onboarding tracking:
  - Pending invites list
  - Resend / cancel invite

### 1B.3 Homework assignment *(6-7 ngày)*

- [ ] Form tạo homework:
  - Date range (startDate, endDate)
  - 5 section tabs: vocab / reading / listening / practice / other
  - Per item: text + link (optional) + description (optional)
  - Add/remove items dynamically
- [ ] Assign target:
  - Single student (chọn từ list)
  - Cả class (auto fan-out tới members)
- [ ] Edit/duplicate/delete homework
- [ ] Submission viewer:
  - Click student → list day links đã nộp
  - Per-day expansion with submitted URL + timestamp
  - Mark as reviewed / leave comment
- [ ] Filter: by date / by student / by class

### 1B.4 Progress dashboard *(3 ngày)*

- [ ] Filter: by week / by student / by class
- [ ] Progress bars per student
- [ ] Lagging alert (red border):
  - Bài quá hạn nhưng chưa nộp
  - Days overdue badge
- [ ] Click student → jump to detail

### 1B.5 Classes module *(4 ngày)*

- [ ] CRUD class (Firebase `classes/{id}`)
- [ ] Manage members (add/remove students)
  - Drag & drop hoặc multi-select
- [ ] Weekly schedule per class:
  - Up to 3 sessions/week
  - Day + time + room/link
- [ ] Class-level homework:
  - Assign 1 lần cho cả lớp
  - Auto fan-out tới `students/{code}/homework`

### 1B.6 Score review *(1-2 ngày)*

- [ ] List điểm mới nhập (sort by date desc)
- [ ] Card: name + score + parts breakdown + date
- [ ] Quick comment

### 1B.7 Booking & Slots management *(4 ngày)*

- [ ] Tạo available slots:
  - Date + time + duration + note
  - Recurring option
- [ ] Pending bookings:
  - Approve / decline buttons
  - Trigger notification → `notifications/{studentCode}`
- [ ] Calendar view tuần này
- [ ] Approved bookings list

### 1B.8 Attendance *(3 ngày)*

- [ ] Mark attendance per session:
  - Class session list
  - Per student: present / absent / late
- [ ] Lưu `attendance/{classId}/{date}/{studentCode}`
- [ ] Stats: % attendance per student

### 1B.9 Teacher management (admin-only) *(2 ngày)*

- [ ] List teachers
- [ ] Invite teacher mới (email + role="teacher")
- [ ] Re-assign students giữa teachers
- [ ] Demote/promote roles

### 1B.10 Notifications composer *(1 ngày)*

- [ ] Send announcement tới 1 student / class / all
- [ ] In-app notification (Firebase `notifications/{code}/{timestamp}`)
- [ ] Email option (optional)

### Phase 1B Definition of Done
- ✅ Teacher manage được học viên 1-1 mapping
- ✅ Homework workflow end-to-end (assign → student nộp → teacher review)
- ✅ Booking flow hoàn chỉnh (slot → request → approve → notification)
- ✅ Realtime sync giữa admin panel và student journal
- ✅ Theme light + sidebar consistent
- ✅ Admin role thấy thêm Teacher management

---

## PHASE 2 — Cross-features

> **4-5 tuần part-time** · Phần làm sản phẩm này hơn hẳn 2 HTML cũ.

### 2.1 Streak gamification system *(7-8 ngày)*

#### XP rules table
| Action | XP | Source key |
|---|---|---|
| Hoàn thành 1 lesson dictation | +20 | `dictation_lesson` |
| Đạt ≥80 điểm 1 lesson | bonus +10 | `dictation_high_score` |
| Đạt 100 điểm 1 lesson | bonus +30 | `dictation_perfect` |
| Review 1 vocab card | +2 | `vocab_review` |
| Master 1 vocab word | +20 | `vocab_master` |
| Hoàn thành 1 mission task | +5 | `mission_task` |
| Hoàn thành full day mission | bonus +20 | `mission_day` |
| Nộp homework đúng hạn | +30 | `homework_submit` |
| Nhập 1 test score | +15 | `test_score` |
| Daily login | +5 | `daily_login` |
| 7-day streak milestone | +50 | `streak_7` |
| 30-day streak milestone | +200 | `streak_30` |
| 100-day streak milestone | +1000 | `streak_100` |

#### Tasks
- [x] `lib/xp.ts`:
  ```typescript
  export async function recordXp(userId: string, source: XpSource, xp: number, meta?: any) {
    await prisma.xpEvent.create({ data: { userId, source, xp, metadata: meta }});
    await prisma.profile.update({
      where: { id: userId },
      data: {
        totalXp: { increment: xp },
        level: calculateLevel(newTotalXp),
      },
    });
    // Trigger achievement check
    await checkAchievements(userId);
  }
  ```
- [x] Level formula: `level = floor(sqrt(totalXp / 100)) + 1` (`xpToNextLevel` helper)
- [x] Streak update logic + 7/30/100-day milestone bonus
- [x] Hook dictation lesson → `recordXp` trong `saveProgress.ts` (lesson + perfect/high_score bonus)
- [ ] Hook vocab review (sẽ làm khi build vocab tab interactions)
- [ ] Hook mission complete
- [ ] Hook homework submit
- [ ] Hook test score input

#### Achievement expansion
- [x] Mở rộng `lib/achievements.ts` với badges mới:
  ```typescript
  // Existing
  first_lesson, ten_lessons, fifty_lessons, hundred,
  streak7, streak30, perfect, all_parts, speed_demon, full_test,
  // NEW
  vocab_master,      // Review 100 vocab cards
  vocab_legend,      // Master 50 words
  marathon,          // 30-day streak
  centurion,         // 100-day streak
  homework_hero,     // Submit 20 homework on time
  test_taker,        // Log 10 test scores
  perfectionist,     // 10 lessons với điểm 100
  early_bird,        // Login 7 ngày trước 8am
  night_owl,         // Login 7 ngày sau 10pm
  polyglot,          // 50 vocab + 50 lessons
  class_star,        // Top 1 in class trong tuần
  ```
- [x] Achievement gallery page `/journal/achievements` — render 21 badges, lock/unlock state + progress hint
- [x] `lib/achievement-check.ts` — `computeUnlocked(userId)` audit từ Profile + UserProgress + XpEvent count
- [ ] Achievement unlock notification — toast + confetti (defer Phase 3 polish)

### 2.2 Dictation results vào Journal *(5-6 ngày)*

- [x] Server action `getDictationStats(userId)`:
  ```typescript
  return {
    todayLessons: number,
    weekLessons: number,
    totalLessons: number,
    avgScore: number,
    currentStreak: number,
    recentLessons: { id, title, score, date }[],
    strongParts: { part: number, avgScore: number }[],
    weakParts: { part: number, avgScore: number }[],
  };
  ```
- [x] Component `<DictationWidget />` trong Journal Dashboard:
  - Big number: current streak
  - Today: X lessons completed
  - Avg score this week
  - Mini progress chart
  - CTA: "Continue dictation →"
- [ ] Cross-link: trong `/practice` heatmap (defer — `/practice` route chưa được build, dictation hiện ở `/test/[slug]/[lessonId]`)
- [x] Combined achievements (xem 2.1)

### 2.3 Smart suggestions *(3 ngày)* ✅

- [x] Dashboard widget "Hôm nay học gì?" (`SuggestionsWidget`) — heuristic theo weak parts + low-score lessons
- [x] "Bài cần ôn lại" — lessons với bestScore <70 (sort thấp nhất) + part yếu nhất (avg <80)
- [ ] Vocab cards due review + errorLog signals (defer — cần dữ liệu Firebase, sẽ thêm khi vocab tab có interaction)

### 2.4 Teacher analytics tăng cường *(4-5 ngày)*

- [x] Per-student "engagement score" — `getEngagementScores()` action: 7-day blend (dictation 40 + streak 30 + homework 20 + vocab 10), sort desc
- [x] `EngagementWidget` mounted ở `/admin` dashboard — bar chart, color-coded (green/yellow/red), tooltip breakdown
- [ ] Heatmap activity per class (defer Phase 3)
- [ ] Weekly auto-report email (defer post-launch)

### Phase 2 Definition of Done
- ✅ Mọi action có XP đều record đúng
- ✅ Level + streak update đúng logic
- ✅ Achievement gallery hiển thị unlocked badges
- ✅ Dictation widget trong journal dashboard hoạt động
- ✅ Cross-links hai chiều giữa journal ↔ practice
- ✅ Smart suggestions có data đúng

---

## PHASE 3 — Polish

> **3-4 tuần part-time**

### 3.1 Realtime polish *(2 ngày)*

- [ ] "Live" indicator khi data đang sync
- [ ] Optimistic updates ở mọi mutation
- [ ] Toast khi có data mới sync về
- [ ] Connection status indicator (online/offline)

### 3.2 Notifications *(4 ngày)*

- [ ] In-app toast notifications:
  - Homework mới được giao
  - Booking được approve
  - Achievement unlock
  - Teacher comment mới
- [ ] Web Push setup:
  - VAPID keys
  - Service worker register
  - Subscribe flow trong settings
  - Server-side trigger (Supabase Edge Function)
- [ ] Email notifications (optional):
  - Weekly progress report
  - Important announcements

### 3.3 PWA *(3 ngày)*

- [ ] `public/manifest.json` với logo "Anh Hiếu²"
- [ ] Service worker:
  - Cache shell + assets
  - Offline fallback cho /journal dashboard
- [ ] Install banner UX (port từ STUDENT.html):
  - Bubble bottom-left
  - Compact + dismissible
- [ ] iOS Safari + Android Chrome install guide pages

### 3.4 Performance *(3 ngày)*

- [ ] Code splitting per route (verify Next.js auto)
- [ ] Suspense boundaries cho slow Firebase reads
- [ ] Firebase listener cleanup audit (memory leak check)
- [ ] Image optimization (Next/Image cho avatars, logos)
- [ ] Bundle analyzer pass → tìm fat dependencies
- [ ] React Query / SWR caching layer cho Firebase reads (optional)
- [ ] Lighthouse score >85

### 3.5 Mobile responsive *(3 ngày)*

- [ ] Test mọi page trên mobile (Chrome DevTools + thiết bị thật)
- [ ] Bottom nav cho student journal (4 tabs chính)
- [ ] Sidebar collapse cho admin panel
- [ ] Touch-friendly: button size, spacing
- [ ] Swipe gestures (optional)

### 3.6 Accessibility & QA *(2 ngày)*

- [ ] Keyboard navigation
- [ ] Screen reader labels (aria-*)
- [ ] Color contrast check (WCAG AA)
- [ ] Tab order logical
- [ ] Form validation messages

### Phase 3 Definition of Done
- ✅ Mobile UX smooth trên iPhone + Android
- ✅ PWA installable, offline fallback works
- ✅ Notifications hoạt động ở 3 channels (in-app, push, email)
- ✅ Lighthouse Performance >85, A11y >90
- ✅ Realtime sync feel snappy

---

## PHASE 4 — Soft launch

> **2-3 tuần part-time**

### 4.1 Self-test alpha *(1 tuần)*

> Hiện chỉ có solo dev, chưa có beta user → tự test thật kỹ.

- [ ] Tạo 3 accounts dummy: student / teacher / admin
- [ ] End-to-end test workflow:
  - Admin invite teacher → teacher accepts → teacher invites student → student accepts
  - Teacher creates class → adds students → assigns homework
  - Student receives homework → submits day links → teacher reviews
  - Student takes test → inputs score → reviews errors
  - Student does dictation → XP + streak update
  - Booking flow end-to-end
- [ ] Stress test: tạo 50 dummy students → check performance

### 4.2 Bug fixes & polish *(1 tuần)*

- [ ] Fix bugs phát hiện trong self-test
- [ ] UX improvements based on usage
- [ ] Edge cases handling

### 4.3 Documentation *(2-3 ngày)*

- [ ] User guide cho học viên (1 video ngắn 3-5 phút)
- [ ] Teacher manual (PDF hoặc page in-app)
- [ ] FAQ
- [ ] "Difference từ STUDENT.html cũ" — for migration users
- [ ] Changelog page

### 4.4 Deploy production *(2 ngày)*

- [ ] Vercel production deployment
- [ ] Custom domain (khi có)
- [ ] Environment variables production
- [ ] Sentry / error tracking setup
- [ ] Analytics (Vercel Analytics + Plausible/PostHog)
- [ ] Backup automation:
  - Daily Firebase RTDB export → cron
  - Daily Supabase pg_dump
  - 30-day retention

### 4.5 Recruit beta users *(1 tuần)*

- [ ] Pick 3-5 học viên hiện tại (loyal + tech-savvy) để invite vào app mới
- [ ] Onboarding session (1-1 walkthrough)
- [ ] Feedback form (Google Form)
- [ ] Iterate quickly trên feedback

### 4.6 Public launch
- [ ] Email announce tới toàn bộ học viên + teacher
- [ ] Social media post (FB / TikTok)
- [ ] Monitor first week metrics
- [ ] On-call cho bugs

### Phase 4 Definition of Done
- ✅ Production deployment stable
- ✅ Error rate <1% trong tuần đầu
- ✅ 3-5 beta users active, feedback positive
- ✅ Documentation accessible
- ✅ Backup running daily

---

## 11. Schema spec

### Supabase (Postgres / Prisma)

```prisma
// ── EXISTING (giữ nguyên) ─────────────
model Profile {
  id              String    @id // matches auth.users.id
  email           String    @unique
  displayName     String?
  avatarUrl       String?
  toeicTarget     Int?
  currentStreak   Int       @default(0)
  // ... existing fields

  // ── NEW for journal/admin ──
  role            String    @default("student")
  studentCode     String?   @unique
  teacherId       String?
  invitedBy       String?
  invitedAt       DateTime?
  acceptedAt      DateTime?

  totalXp         Int       @default(0)
  level           Int       @default(1)
  longestStreak   Int       @default(0)
  lastActiveDate  DateTime?

  // Relations
  managedStudents Profile[] @relation("TeacherStudent")
  teacher         Profile?  @relation("TeacherStudent", fields: [teacherId], references: [id])
  xpEvents        XpEvent[]
  invitesSent     TeacherInvite[]

  @@map("profiles")
}

model TeacherInvite {
  id          String    @id @default(cuid())
  email       String
  studentCode String?
  teacherId   String
  token       String    @unique
  role        String    @default("student")
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime  @default(now())
  teacher     Profile   @relation(fields: [teacherId], references: [id])
  @@index([token])
  @@map("teacher_invites")
}

model XpEvent {
  id        String   @id @default(cuid())
  userId    String
  source    String
  xp        Int
  metadata  Json?
  createdAt DateTime @default(now())
  user      Profile  @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
  @@map("xp_events")
}
```

### Firebase RTDB (giữ nguyên + extend)

```
students/
  {studentCode}/
    id: string
    name: string
    currentWeek: number
    target: number
    note: string                 # private teacher note
    comments: object             # public comments
    frozen: boolean
    teacherId: string            # NEW: link to Supabase Profile.id
    scores: [
      { date, total, p1..p7, note }
    ]
    homework: [
      { id, date, endDate, vocab[], reading[], listening[], practice[], other[] }
    ]
    modules: [{ id, name, type, status }]
    schedule: [...]
    vocab: { wordId: { word, ipa, def, defVi, repCount, nextReview, ... }}
    errorLog: { sessionId: { date, category, errorType, detail }}
    paraphraseLog: { id: { wordA, wordB, repCount, ... }}
    daylinks: { hwId: { date: { url, submittedAt }}}

classes/
  {classId}/
    id, name, desc
    members: [studentCode]
    homework: [...]
    weeklySchedule: [...]

bookings/{id}/
  studentId, date, time, note, status

slots/{id}/
  date, time, note, teacherId

attendance/{classId}/{date}/
  {studentCode}: "present" | "absent" | "late"

notifications/{studentCode}/{timestamp}/
  type, title, body, read

teacherSubscriptions/{deviceId}/
  endpoint, keys (for Web Push)
```

---

## 12. File/folder structure

```
mytoeicdiary/
├── app/
│   ├── (dictation)/                    # existing dark theme group
│   │   ├── practice/
│   │   ├── test/
│   │   ├── series/
│   │   ├── progress/
│   │   └── layout.tsx
│   ├── (student)/                      # NEW warm theme
│   │   └── journal/
│   │       ├── layout.tsx
│   │       ├── page.tsx                # Dashboard
│   │       ├── scores/
│   │       ├── vocab/
│   │       ├── missions/
│   │       ├── tasks/
│   │       ├── errors/
│   │       ├── paraphrase/
│   │       ├── schedule/
│   │       └── booking/
│   ├── (teacher)/                      # NEW light theme
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx                # Dashboard
│   │       ├── students/
│   │       │   └── [code]/
│   │       ├── homework/
│   │       ├── progress/
│   │       ├── classes/
│   │       │   └── [id]/
│   │       ├── scores/
│   │       ├── bookings/
│   │       ├── slots/
│   │       ├── attendance/
│   │       └── teachers/               # admin-only
│   ├── auth/
│   │   ├── login/
│   │   ├── invite/[token]/
│   │   ├── onboarding-incomplete/
│   │   └── reset-password/
│   ├── api/
│   │   └── firebase-token/route.ts
│   └── layout.tsx
│
├── components/
│   ├── practice/                       # existing
│   ├── progress/                       # existing
│   ├── journal/                        # NEW
│   │   ├── DashboardWidget.tsx
│   │   ├── DictationWidget.tsx
│   │   ├── VocabCard.tsx
│   │   ├── MissionDay.tsx
│   │   ├── ScoreChart.tsx
│   │   └── ...
│   ├── admin/                          # NEW
│   │   ├── Sidebar.tsx
│   │   ├── StudentCard.tsx
│   │   ├── HomeworkForm.tsx
│   │   └── ...
│   ├── shared/                         # cross-section
│   │   ├── Brand.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── XpToast.tsx
│   │   └── AchievementBadge.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
│
├── hooks/
│   ├── firebase/                       # NEW
│   │   ├── useStudent.ts
│   │   ├── useAllStudents.ts
│   │   ├── useHomework.ts
│   │   ├── useDayLinks.ts
│   │   ├── useBookings.ts
│   │   ├── useSlots.ts
│   │   ├── useClasses.ts
│   │   ├── useNotifications.ts
│   │   └── useFirebaseAuthBridge.ts
│   └── ...
│
├── lib/
│   ├── firebase/                       # NEW
│   │   ├── client.ts
│   │   ├── admin.ts
│   │   └── helpers.ts
│   ├── supabase/                       # existing
│   ├── xp.ts                           # NEW
│   ├── srs.ts                          # NEW (Leitner algorithm)
│   ├── achievements.ts                 # existing, expand
│   └── ...
│
├── prisma/
│   ├── schema.prisma                   # extend with new models
│   ├── migrations/
│   └── seed.ts                         # update for admin seed
│
├── supabase/
│   └── functions/
│       └── firebase-token/
│           └── index.ts
│
├── public/
│   ├── logo.png                        # Anh Hiếu² brand
│   ├── manifest.json
│   └── ...
│
├── merger-plan.md                      # this file
├── CLAUDE.md
└── ...
```

---

## 13. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Firebase Custom Auth bridge lỗi → user không log in được | Medium | High | Phase 0 dành 3-4 ngày test kỹ; có fallback signOut + retry |
| R2 | Realtime listener leak → memory issue | Medium | Medium | Audit cleanup ở Phase 3.4; use react-firebase-hooks (đã handle) |
| R3 | Permissive Firebase rules → data bị tamper | Medium | Medium | Chấp nhận tradeoff. Phase 4 plan tighten. Daily backup mitigates worst case |
| R4 | XP/streak calculation bugs → user mất XP | Low | Medium | Unit test cho `lib/xp.ts`. XpEvent table audit log |
| R5 | Solo dev burnout → timeline slip | High | Low | No deadline = OK. Pause/resume freely |
| R6 | Phase 1A và 1B song song → context switch fatigue | High | Medium | Block 1 tuần focus 1A, tuần sau 1B (alternating) |
| R7 | Old HTML conflict khi tighten rules sau này | Medium | Low | Plan migration script khi đến Phase 4 sunset (nếu chọn) |
| R8 | Beta users push back → major rework | Low | High | Phase 4.5 incremental, không big bang |
| R9 | Domain `mytoeicdiary` đã bị mua | Low | Low | Backup names: `anhhieusquared.com`, `nhatkytoeic.com` |
| R10 | Supabase free tier limit (500MB DB / 2GB bandwidth) | Low | Medium | Monitor; upgrade $25/mo nếu cần (cheap insurance) |

---

## 14. Post-launch roadmap

### Tháng 1-2 sau launch
- Bug fix dựa user feedback
- Performance tuning thật
- Migrate vài học viên cũ sang app mới (incremental)

### Tháng 3-6
- **Tighten Firebase Security Rules** → migrate toàn bộ user sang app mới → sunset 2 HTML cũ
- AI features:
  - AI feedback cho writing
  - Auto-generate vocab examples
  - Smart practice recommendation
- Leaderboard giữa học viên (opt-in)
- Export PDF report cho phụ huynh

### Tháng 6+
- iOS/Android native (React Native hoặc Expo)
- Admin dashboard analytics nâng cao
- Multi-language UI (English)
- Public landing page + marketing site

---

## 15. Definition of Done per Phase

| Phase | DoD checklist |
|---|---|
| 0 | Auth + invite + 3 themes + realtime hooks + admin seed |
| 1A | 9 student tabs + XP records + mobile responsive |
| 1B | Teacher manage + homework + booking workflow + admin role |
| 2 | XP/streak/level + achievements + dictation widget + cross-links |
| 3 | PWA + push notifications + Lighthouse >85 + mobile UX |
| 4 | Production deploy + 3-5 beta users active + docs published |

---

## 🚦 Next steps

1. **Phase 0.1 — Firebase client integration** (estimate: 2-3 ngày part-time)
2. Track progress trong `merger-plan.md` này — check ✅ vào checkboxes khi xong
3. Weekly review: tự đánh giá tốc độ, adjust scope nếu cần

**Ready to start Phase 0?** 🚀

---

*Document version: 1.0 · Created: 2026-04-27 · Author: solo dev (with Claude assist)*
