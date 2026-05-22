# CLAUDE CODE — MASTER PROMPT & FEATURE CHECKLIST
# Tiếng Anh² Hiếu — Next.js Clone

---

## ĐỌC FILE NÀY TRƯỚC KHI VIẾT BẤT KỲ DÒNG CODE NÀO

File này có 2 mục đích:
1. **Context ban đầu** — đọc toàn bộ khi bắt đầu conversation mới
2. **Reference khi code** — tra cứu trạng thái từng tính năng trước khi implement

---

## PHẦN 1 — BỐI CẢNH HỆ THỐNG GỐC

Hệ thống gốc là nền tảng dạy học TOEIC "Tiếng Anh² Hiếu" gồm 2 web app:
- **Student Portal** (`student.html`) — học viên dùng hàng ngày, cài PWA
- **Teacher Panel** (`teacher.html`) — giáo viên quản lý toàn bộ

Backend: Firebase Realtime Database + Cloud Functions (v2) + Web Push (VAPID).

Bản clone này là **Next.js rewrite** của hệ thống trên:
- Toàn bộ **business logic và data flow phải giữ nguyên** so với bản gốc
- **UI/UX được thiết kế lại tự do** — không cần giữ màu sắc, layout, component style của bản gốc
- **Tính năng mới** sẽ được bổ sung thêm (xem Phần 3)
- Firebase schema **không thay đổi** — clone dùng chung database với bản gốc hoặc dùng project Firebase riêng với schema y hệt

---

## PHẦN 2 — NGUYÊN TẮC BẤT BIẾN (KHÔNG ĐƯỢC VI PHẠM)

### ❌ Claude Code KHÔNG được tự ý:
- Bỏ hoặc simplify một tính năng vì "có vẻ không cần thiết"
- Thay đổi Firebase data schema (tên node, kiểu dữ liệu, cấu trúc nested)
- Đổi business logic (ví dụ: cách tính SRS intervals, cách tính học phí, cách propagate BTVN lớp)
- Merge 2 tính năng riêng biệt thành 1 vì "tương tự nhau"
- Tự thêm authentication layer khác ngoài logic ID-based login đã định
- Thay đổi cách tính ngày tháng — **luôn dùng local date, không dùng UTC/toISOString()**
- Tự quyết định một tính năng là "edge case không quan trọng"

### ✅ Claude Code ĐƯỢC phép:
- Thiết kế UI/UX hoàn toàn mới (component library tự chọn, layout tự do)
- Dùng TypeScript, React hooks, Next.js patterns chuẩn
- Tách logic thành custom hooks, server actions, API routes theo chuẩn Next.js
- Tối ưu performance (lazy load, pagination, debounce...)
- Dùng Zustand / React Query / SWR thay cho global `var` state của bản gốc
- Đề xuất cải tiến — nhưng phải hỏi trước, không tự ý implement

### ⚠️ Khi gặp tính năng chưa có trong checklist:
Dừng lại, hỏi: _"Tính năng X chưa có trong checklist — implement theo logic nào?"_  
Không tự suy luận và code.

---

## PHẦN 3 — FEATURE CHECKLIST

### Trạng thái ký hiệu:
- ✅ **DONE** — đã implement trong clone, không cần làm lại
- 🔲 **TODO** — chưa implement, cần build
- ➕ **NEW** — tính năng mới, không có trong bản gốc — implement từ đầu
- 🔄 **ADAPTED** — có trong bản gốc nhưng cần adapt sang Next.js pattern (logic giữ nguyên, cách implement khác)
- ⏭️ **SKIP** — không cần trong clone (đã được quyết định rõ ràng)

> **Quy tắc:** Trước khi implement bất kỳ tính năng nào, tìm nó trong checklist này.  
> Nếu trạng thái là 🔲 hoặc 🔄 → implement.  
> Nếu là ✅ → không đụng vào.  
> Nếu không có trong danh sách → hỏi ngay.

---

### 🔐 AUTH / SESSION

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| A1 | Student login bằng mã ID (tra Firebase) | ✅ | `/api/auth/code-login` route + tab "Mã học viên" trong LoginForm |
| A2 | Lưu session (studentId) | ✅ | Dùng Supabase cookie session; studentCode lưu trong `profile.studentCode` (Prisma) |
| A3 | Auto-login nếu đã có session | ✅ | journal layout redirect nếu không có Supabase user |
| A4 | Logout (xoá session, về login) | ✅ | `/api/auth/signout` route |
| A5 | Teacher panel không có auth | 🔄 | **ADAPTED:** teacher dùng Supabase role auth (`app_metadata.role === "teacher"`) — bảo mật hơn bản gốc (trang mở) |
| A6 | Student frozen check | ✅ | Dashboard-client kiểm tra `student.frozen` → hiện banner cảnh báo |

---

### 🏠 STUDENT — TAB TỔNG QUAN

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| B1 | Lời chào cá nhân (tên + ngày) | ✅ | `HeaderTile` trong `_dashboard-client.tsx` |
| B2 | Pill tuần hiện tại | ✅ | `HeaderTile` — hiện "Tuần X" từ `student.currentWeek` |
| B3 | Stat card: điểm TOEIC mới nhất | ✅ | `ScoreTile` — lấy score mới nhất + delta so với lần trước |
| B4 | Stat card: số học phần hoàn thành | ✅ | `ModuleTile` — đếm `status === "done"` + progress bar |
| B5 | Stat card: trạng thái nhiệm vụ hôm nay | ✅ | `TasksTile` — section breakdown + trạng thái done/pending |
| B6 | Score widget: điểm lớn + xếp loại | ✅ | `ScoreTile` — grade label (Xuất sắc ≥750/Khá tốt ≥600/Trung bình ≥450/Đang tiến bộ) |
| B7 | Score widget: progress bar 0–990 | ✅ | `ScoreTile` — gradient bar với transition animation |
| B8 | Score widget: pip lịch sử điểm | ✅ | `ScoreTile` — pip bar chart (up to 8 scores gần nhất) |
| B9 | Mục tiêu điểm: marker + gap + deadline | ✅ | `ScoreTile` — goal dot marker trên bar + gap text |
| B10 | Nhận xét từ giáo viên (comment mới nhất) | ✅ | `FeedbackTile` — sort comments theo `ts`, hiện entry mới nhất |
| B11 | Nhiệm vụ hôm nay mini (section list + %) | ✅ | `TasksTile` — section breakdown (Từ vựng/Nghe/Đọc/...) với count badge |
| B12 | Lịch sắp tới (3 buổi gần nhất) | ✅ | `ScheduleTile` — filter `date >= today`, slice 3 |
| B13 | Overdue banner (bài quá hạn chưa nộp) | ✅ | `OverdueBanner` — đếm hw deadline < today + chưa tick, dismissible |
| B14 | Daily Digest popup | ✅ | `DailyDigestPopup` — localStorage flag/ngày, hiện overdue + vocab SRS + paraphrase SRS due |

---

### 📈 STUDENT — TAB TIẾN ĐỘ

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| C1 | List tất cả homework theo ngày | 🔲 | Tab này chưa tồn tại (không có `/journal/progress` route) |
| C2 | Progress bar done/total mỗi ngày | 🔲 | Chưa có |
| C3 | Phân biệt: đã nộp link ngày vs tick từng item | 🔲 | Chưa có |

---

### 🎯 STUDENT — TAB ĐIỂM SỐ

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| D1 | Bảng lịch sử điểm (tổng + từng Part P1–P7) | ✅ | `ScoreRow` table với expand chi tiết P1–P7 + chart SVG |
| D2 | Thêm điểm mới (modal: tên đề, tổng, ngày, Parts) | ✅ | `AddScoreForm` (Listening + Reading + tên đề) |
| D3 | Xoá điểm | ✅ | Nút Xoá per row, confirm dialog |
| D4 | Đặt mục tiêu (target + deadline) | ✅ | `GoalEditForm` → lưu `goals/{studentId}`, teacher thấy được |

---

### 📒 STUDENT — TAB NHẬT KÝ LỖI

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| E1 | Form nhập log: ngày + tên đề (autocomplete) | ✅ | Có ngày + tên đề; autocomplete chưa có |
| E2 | Loại luyện: Full / LS only / RD only / Part | ✅ | `sessionType`: "full" / "part" (2 loại thay vì 4) |
| E3 | Stepper lỗi Listening (9 loại) | ✅ | `LS_TYPES` 9 loại + `Counter` component +/− |
| E4 | Stepper lỗi Reading (7 loại) | ✅ | `RD_TYPES` 7 loại + Counter |
| E5 | Chi tiết từng câu sai (Part, số câu, loại, nội dung, ghi chú, trạng thái review) | ✅ | `details[]` array với part/qNum/content/paraphrase/reviewed |
| E6 | Hướng dẫn phân loại lỗi (toggle/accordion) | ✅ | `guideOpen` accordion trong form |
| E7 | Lưu session lên Firebase `students/{id}/errorLog` | ✅ | `addErrorEntry()` helper |
| E8 | Dashboard: biểu đồ lỗi theo loại | ✅ | `AggChart` — bar chart tổng hợp LS + RD theo loại |
| E9 | Dashboard: lịch sử sessions + xem chi tiết | ✅ | `DashboardTab` — stats strip + 5 sessions gần nhất + expand |
| E10 | Paraphrase Log: thêm cặp source → target + Part + ghi chú | ✅ | Tab "Paraphrase" + `addParaphraseEntry()` |
| E11 | Paraphrase SRS (intervals: 1,3,7,14,30 ngày) | ✅ | `reviewParaphraseEntry()` + SRS intervals tách biệt với vocab |
| E12 | Paraphrase Flashcard (flip card, Biết/Không biết) | 🔲 | Chưa có |
| E13 | Badge số paraphrase đến hạn | 🔲 | Chưa có |

---

### 📖 STUDENT — TAB TỪ VỰNG

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| F1 | Thêm từ: tra nghĩa tự động (Free Dictionary API) | 🔲 | Chưa có — hiện nhập thủ công qua QuickAddBar + Advanced fields |
| F2 | Thêm từ: tra nghĩa tiếng Việt (MyMemory API) | 🔲 | Chưa có |
| F3 | Thêm từ: phát âm TTS (Cloud Function) | 🔲 | Chưa có |
| F4 | Thêm từ: gắn Part TOEIC (1–7) | ✅ | `part` field trong QuickAddBar |
| F5 | Danh sách từ: filter theo Part | ✅ | `filterPart` state + select dropdown |
| F6 | Card từ: từ, IPA, pos, def EN, nghĩa VI, ví dụ, Part, ngày, SRS status | ✅ | VocabCard component đầy đủ các field |
| F7 | Nút phát âm từng từ | 🔲 | Chưa có |
| F8 | Xoá từ | ✅ | `deleteVocabWord()` |
| F9 | SRS: intervals 1,3,7,14,30 ngày | ✅ | `SRS_INTERVALS = [0,1,3,7,14,30,60]` + `isWordDue()` |
| F10 | Badge số từ đến hạn trên tab | 🔲 | Chưa có |
| F11 | Banner SRS trong tab khi có từ đến hạn | 🔲 | Chưa có |
| F12 | Flashcard mode picker (4 chế độ) | 🔲 | Có 2 nút (SRS due + tất cả) nhưng chưa phải 4-mode picker |
| F13 | Flashcard: chế độ "Đến hạn ôn hôm nay" | ✅ | Nút "Luyện Flashcard" → filter `isWordDue` |
| F14 | Flashcard: chế độ "Tất cả từ vựng" | ✅ | Nút "Flashcard tất cả" |
| F15 | Flashcard: chế độ nghe–viết (Parts 1–4) | 🔲 | Chưa có |
| F16 | Flashcard: chế độ nghĩa→từ (Parts 5–7) | 🔲 | FlashcardModal hiện word → reveal meaning, chưa đúng chiều |
| F17 | Màn hình kết quả flashcard (score, ôn lại sai) | ✅ | Màn hình "Xong! 🎉" khi done |

---

### ✅ STUDENT — TAB NHIỆM VỤ / HOMEWORK

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| G1 | Hiển thị homework theo ngày (day card) | ✅ | `HwCard` list trong `missions/page.tsx` |
| G2 | Ring progress SVG mỗi ngày | ✅ | `ProgressRing` SVG component |
| G3 | Badge: Hôm nay / Sắp tới / Quá hạn / Đã xong | ✅ | isCurrent / isFuture / isOverdue / isDone với màu sắc tương ứng |
| G4 | 5 sections: Từ vựng, Đọc, Nghe, Khác, Đề luyện thi | ✅ | `SECTIONS = ["vocab","listening","reading","practice","other"]` — riêng biệt |
| G5 | Tick từng item → cập nhật `submissions/` Firebase | ✅ | `toggleItem()` local state + `saveSubmission()` khi submit |
| G6 | Mô tả rich text từng item (toggle xem) | ✅ | `descClean` = `stripHtml(item.desc)`, hiện inline |
| G7 | Link tài liệu mở tab mới | ✅ | `target="_blank" rel="noopener noreferrer"` |
| G8 | Nộp link ngày (1 link cho cả ngày) | ✅ | Form URL → `saveSubmission()` với `ticked: true` + url |
| G9 | Hiển thị link đã nộp + timestamp + nút nộp lại | ✅ | Hiện `submittedUrl` khi `done && submittedUrl` |
| G10 | Sync progress lên `progress/{studentId}/{date}` | 🔲 | Chưa có — chỉ lưu `submissions/`, không cập nhật `progress/` |
| G11 | Congrats popup khi hoàn thành 100% | 🔲 | Chưa có |

---

### 🗓 STUDENT — TAB LỊCH HỌC

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| H1 | Danh sách buổi sắp tới (chưa qua) | 🔲 | Tab `/journal/schedule` chưa tồn tại |
| H2 | Danh sách lịch sử (đã qua) | 🔲 | Chưa có |
| H3 | Tag loại buổi: 1-1 vs Lớp | 🔲 | Chưa có |
| H4 | Highlight buổi hôm nay | 🔲 | Chưa có |
| H5 | Merge lịch cá nhân + lịch lớp (weeklySchedule) | 🔲 | Chưa có |

---

### 📅 STUDENT — TAB BOOK 1-1

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| I1 | Grid khung giờ trống (từ `slots/`) | ✅ | `useSlots()` + grid display, slot booked → hiện "Đã đặt" |
| I2 | Chọn slot → form xác nhận (ghi chú) | ✅ | Form ghi chú trước khi submit |
| I3 | Submit booking → lưu `bookings/` | ✅ | `createBooking()`, status: "pending" |
| I4 | Danh sách booking của học viên + trạng thái | ✅ | `BookingItem` list với badge Chờ xác nhận/Đã xác nhận/Đã từ chối |

---

### 💰 STUDENT — TAB HỌC PHÍ

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| J1 | Navigation tháng (◀ ▶) | 🔲 | Tab `/journal/fee` chưa tồn tại |
| J2 | Chế độ theo buổi (group/per_session) | 🔲 | Chưa có |
| J3 | Buổi vắng: gạch ngang số tiền | 🔲 | Chưa có |
| J4 | Summary: tổng buổi, vắng, chưa điểm, % chuyên cần | 🔲 | Chưa có |
| J5 | Chế độ trọn gói (package) | 🔲 | Chưa có |
| J6 | Biên lai modal | 🔲 | Chưa có |
| J7 | Zoom QR trong biên lai | 🔲 | Chưa có |
| J8 | Tính session dates: từ `student.schedule[]` + class weeklySchedule | 🔲 | **Phải merge cả 2 nguồn** |

---

### 📊 TEACHER — DASHBOARD

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| K1 | Card grid tất cả học viên | ✅ | `_dashboard-client.tsx` dùng `useAllStudents()` |
| K2 | Card: tên, mã, tuần, điểm mới nhất, % module done | ✅ | StudentCard với các thông tin cơ bản |
| K3 | Card: badge loại khoá học | 🔲 | Chưa thấy badge courseType trên card |
| K4 | Card: badge frozen | 🔲 | Chưa thấy badge frozen trên student card |
| K5 | Click card → chuyển sang Student Editor | ✅ | Link đến `/admin/students/{code}` |
| K6 | Search học viên | 🔲 | Chưa có search bar |
| K7 | Thêm học viên mới | 🔲 | Chưa có |

---

### 👤 TEACHER — STUDENT EDITOR

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| L1 | Sửa thông tin cơ bản (tên, mã, tuần, loại khoá, giá) | ✅ | `updateStudent()` — các field: name, id, currentWeek, courseType, pricePerSession |
| L2 | Ghi chú nội bộ (`note_internal`) | ✅ | Textarea riêng, lưu qua `updateStudent()` |
| L3 | Xoá học viên | 🔲 | Chưa có (không thấy `deleteStudent` trong imports) |
| L4 | Đóng băng / Bỏ đóng băng (`frozen`) | ✅ | `setStudentFrozen()` toggle button |
| L5 | Thêm/xoá điểm (modal: tổng, ngày, tên đề, P1–P7) | ✅ | `pushStudentScore()` / `deleteStudentScore()` |
| L6 | Thêm/xoá buổi học cá nhân (`schedule[]`) | ✅ | `addScheduleItem()` / `deleteScheduleItem()` |
| L7 | Thêm/sửa/xoá module học phần | ✅ | `addModule()` / `updateModuleStatus()` / `deleteModule()` |
| L8 | Danh sách BTVN cá nhân + filter (Tất cả/Hôm nay/Sắp tới/Quá hạn) | ✅ | `useHomework()` + filter tabs |
| L9 | Modal thêm/sửa BTVN cá nhân (5 sections, rich text desc) | ✅ | `pushHomework()` / `updateHomework()` với 5 sections, mỗi item text+link+desc |
| L10 | Progress tracking: done/total từng ngày | ✅ | `useSubmissions()` + `useDayLinks()` để tính done/total |
| L11 | Error log viewer của học viên (chart + sessions) | 🔲 | Chưa có trong student editor |
| L12 | Comments: append-only, gửi nhận xét mới | ✅ | `pushComment()` — append vào `comments[]` |
| L13 | Gửi Push Notification thủ công tới học viên | ✅ | `sendNotification()` → ghi `notifications/{studentId}/{timestamp}` |
| L14 | Lưu tất cả thay đổi (batch save) | 🔲 | Không có — mỗi action lưu riêng lẻ ngay lập tức |

---

### 🏫 TEACHER — LỚP HỌC

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| M1 | Grid tất cả lớp | ✅ | `classes/page.tsx` với `useClasses()` |
| M2 | Tạo lớp (tên, mô tả, weeklySchedule: ngày + giờ) | ✅ | Form tạo lớp trong classes/page.tsx |
| M3 | Xoá lớp | 🔲 | Chưa thấy deleteClass trong imports của classes/[id]/page.tsx |
| M4 | Thêm/xoá học viên vào lớp | ✅ | `removeClassMember()` + add member dropdown |
| M5 | Module của lớp | ✅ | Module section trong classes/[id]/page.tsx |
| M6 | Giao BTVN lớp (modal 5 sections) | ✅ | `pushClassHomework()` / `updateClassHomework()` / `deleteClassHomework()` |
| M7 | **Propagation BTVN:** giao/sửa/xoá → cập nhật tất cả HV trong lớp | 🔲 | Chưa có — pushClassHomework chỉ lưu vào `classes/{id}/homework`, không propagate sang từng student |
| M8 | Progress grid: từng HV × từng BTVN | 🔲 | Chưa có |

---

### 📅 TEACHER — BOOKING MANAGEMENT

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| N1 | Danh sách tất cả booking requests | ✅ | `admin/bookings/page.tsx` với filter tabs |
| N2 | Xác nhận / Huỷ booking | ✅ | `updateBookingStatus()` (approved/declined) |
| N3 | Tạo/xoá khung giờ trống (`slots/`) | ✅ | `admin/slots/page.tsx` — `createSlot()` / `deleteSlot()` |

---

### ⏰ TEACHER — ĐIỂM DANH

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| O1 | Chế độ theo học viên | ✅ | `admin/attendance/page.tsx` — `StudentAttendanceRow` per student |
| O2 | Chế độ theo lớp | 🔲 | `useClassAttendance` hook tồn tại nhưng chưa có UI chế độ lớp |
| O3 | Chọn tháng/năm | 🔲 | Chưa có — trang hiện chỉ điểm danh ngày hiện tại |
| O4 | Search + filter theo tỉ lệ chuyên cần + sort | 🔲 | Chưa có |
| O5 | Calendar tháng, click ngày toggle Có mặt/Vắng/Chưa | ✅ | `setAttendance()` với 3 trạng thái (present/absent/late) |
| O6 | Điểm danh thủ công (chọn ngày + HV) | 🔲 | Chưa có |
| O7 | Summary: Có mặt / Vắng / Chưa điểm / % chuyên cần | 🔲 | Chưa có |

---

### 🔔 PUSH NOTIFICATIONS & PWA

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| P1 | Student đăng ký push subscription (VAPID) | ✅ | `/api/push/subscribe` route + `ServiceWorkerRegistrar` component |
| P2 | Teacher đăng ký push subscription | 🔲 | Chưa có route/component riêng cho teacher subscription |
| P3 | Cloud Function: gửi push khi có node mới tại `notifications/` | 🔲 | Chưa có (push gửi qua `/api/push/send` route thay thế) |
| P4 | Cloud Function: 8pm daily reminder | 🔲 | Chưa có |
| P5 | Service Worker: handle push event + notification click | ✅ | `public/sw.js` + `ServiceWorkerRegistrar.tsx` |
| P6 | PWA manifest + installable | ✅ | `public/manifest.json` |
| P7 | Nút "Cài app" (PWA install prompt) | ✅ | `InstallBanner.tsx` — `beforeinstallprompt` event |

---

### 🔊 TTS (Text-to-Speech)

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| Q1 | Cloud Function `/tts`: nhận `{word}` → trả `{audioContent}` base64 MP3 | 🔲 | Chưa có |
| Q2 | Client gọi TTS endpoint, play audio | 🔲 | Chưa có — F7, F15, F16 đều block vào Q1+Q2 |

---

### ➕ TÍNH NĂNG MỚI (không có trong bản gốc)

> Các tính năng này sẽ được bổ sung theo từng giai đoạn. Khi bắt đầu implement một tính năng mới, thêm vào bảng này trước rồi mới code.

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| Z1 | _(chưa định nghĩa)_ | 🔲 | |

---

## PHẦN 4 — FIREBASE DATA SCHEMA

> **Không được thay đổi tên node, kiểu dữ liệu, hay cấu trúc nested.**  
> Clone có thể dùng Firebase project riêng nhưng schema phải y hệt.

```
/students/{studentId}/
  name: string
  id: string
  currentWeek: number
  frozen: boolean
  courseType: "group" | "per_session" | "package"
  pricePerSession: number
  packageInfo: object
  scores: Array<{score, date, testName, parts:{p1,p2,p3,p4,p5,p6,p7}}>
  modules: Array<{name, week, weekTitle, type, status: "locked"|"current"|"done"}>
  homework: Array<{id, date, endDate, label, vocab[], reading[], listening[], other[], practice[]}>
    // Mỗi item trong section: {text, link, desc}
  schedule: Array<{date, time, title, kind: "oneone"|"class"}>
  note_legacy: string          // nhận xét cũ (legacy)
  note_internal: string        // ghi chú nội bộ teacher
  comments: Array<{text, createdAt}>
  errorLog/{sessionId}: {date, testName, type, ls:{...counts}, rd:{...counts}, details:[]}
  paraphraseLog/{id}: {source, target, part, note, addedDate, lastReview, repCount}

/vocab/{studentId}/{wordId}/
  word, definition, definitionVi, ipa, pos, example
  part, addedDate, lastReview, repCount

/submissions/{studentId}/{key}/    // key = "{hwId}_{sec}_{index}"
  link: string
  submittedAt: string
  ticked: boolean

/dayLinks/{studentId}/{hwId}/
  link: string
  submittedAt: string

/progress/{studentId}/{date}/      // date = "YYYY-MM-DD"
  done: number
  total: number
  updatedAt: string

/attendance/{studentId}/{date}/
  status: "present" | "absent"

/bookings/{bookingId}/
  studentId, slotId, note, status: "pending"|"confirmed"|"cancelled", createdAt

/slots/{slotId}/
  date, time, booked: boolean

/classes/{classId}/
  id, name, desc
  members: string[]              // array of studentId
  weeklySchedule: Array<{day: 0-6, time: string}>
  homework: Array<{...same as student homework...}>
  modules: Array<{...}>

/notifications/{studentId}/{timestamp}/
  title, body, url

/pushSubscriptions/{studentId}/{deviceId}/
  subscription: object           // Web Push subscription JSON
  deviceId, updatedAt, userAgent

/teacherSubscriptions/{deviceId}/
  subscription, deviceId, updatedAt, userAgent

/goals/{studentId}/
  target: number
  deadline: string               // "YYYY-MM"
  updatedAt: string
```

---

## PHẦN 5 — BUSINESS LOGIC QUAN TRỌNG

Những đoạn logic này dễ implement sai — đọc kỹ trước khi code.

### SRS Intervals (dùng cho cả Vocab lẫn Paraphrase — TÁCH BIỆT, không merge)
```
intervals = [1, 3, 7, 14, 30]  // ngày
nextReview = lastReview + intervals[min(repCount, 4)]
isDue = nextReview <= today
```

### Tính "hôm nay có homework"
```
homework active nếu: hw.date <= today && today <= (hw.endDate || hw.date)
```

### Tính done/total cho 1 homework
```
if (dayLinks[studentId][hwId].link exists) → done = total  // nộp link = hoàn thành cả ngày
else → đếm submissions có ticked=true hoặc link không rỗng
```

### Propagate BTVN lớp → học viên
```
1. Lưu vào classes/{classId}/homework trước
2. Với mỗi memberId: đọc students/{memberId}/homework TRỰC TIẾP từ Firebase (không dùng cache)
3. Update/insert entry với cùng hwId
4. Sort theo date
5. Lưu lại
```
**Lý do đọc trực tiếp:** tránh race condition khi nhiều HV được update đồng thời.

### Tính học phí tháng
```
Session dates = union của:
  - student.schedule[].date trong tháng đó
  - Các ngày generate từ class.weeklySchedule trong tháng đó (chỉ đến today)
Với mỗi date: check attendance/{studentId}/{date}.status
present → cộng tiền / absent → không cộng / không có record → "chưa điểm"
```

### Date — LUÔN DÙNG LOCAL
```javascript
// ✅ ĐÚNG
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ❌ SAI — gây lệch ngày do UTC
new Date().toISOString().slice(0, 10)
```

---

## PHẦN 6 — CHECKLIST TRƯỚC KHI COMMIT

Trước mỗi lần hoàn thành 1 tính năng, tự hỏi:

- [ ] Đã update trạng thái trong checklist (🔲 → ✅) chưa?
- [ ] Firebase node names có khớp với schema ở Phần 4 không?
- [ ] Có dùng `toISOString()` cho date không? (nếu có → sửa lại)
- [ ] Logic tính done/total có xử lý cả dayLink lẫn tick riêng lẻ không?
- [ ] Nếu feature liên quan đến lớp học → có propagate đúng không?
- [ ] Có tự bỏ hoặc simplify tính năng nào không?
- [ ] Tính năng mới (nếu có) đã được thêm vào bảng Z chưa?

---

*File này là nguồn sự thật duy nhất (single source of truth) cho quá trình build clone.*  
*Cập nhật checklist sau mỗi tính năng hoàn thành.*
