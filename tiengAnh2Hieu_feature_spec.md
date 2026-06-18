# Tiếng Anh² Hiếu — Tổng hợp tính năng hệ thống
> Tài liệu nghiên cứu / tài liệu hoá cấu trúc hệ thống  
> Gồm 2 web app: **Student Portal** (`student.html`) và **Teacher Panel** (`teacher.html`)  
> Backend: Firebase Realtime Database · Cloud Functions · PWA Push Notifications

---

## MỤC LỤC

1. [Kiến trúc tổng thể](#1-kiến-trúc-tổng-thể)
2. [Student Portal — 9 Tab](#2-student-portal--9-tab)
3. [Teacher Panel — 5 trang chính](#3-teacher-panel--5-trang-chính)
4. [Tính năng nền chung (cả 2 web)](#4-tính-năng-nền-chung)
5. [Firebase Data Schema (tóm tắt)](#5-firebase-data-schema-tóm-tắt)
6. [Cloud Functions](#6-cloud-functions)

---

## 1. Kiến trúc tổng thể

| Thành phần | Chi tiết |
|---|---|
| **Student URL** | `taahh33cd.github.io/student-site/` |
| **Teacher URL** | `taahh33cd.github.io/teacher-panel/` |
| **Firebase project** | `quanlyhocvien-b1796` |
| **Database region** | `asia-southeast1` |
| **Plan** | Blaze (trả phí) |
| **Auth** | Không dùng Firebase Auth — student đăng nhập bằng mã ID, teacher không có auth (trang mở) |
| **Hosting** | GitHub Pages (2 repo riêng) |
| **PWA** | Cả 2 web đều là PWA, cài được lên màn hình chính |
| **JS style** | Vanilla JS, `var` + `.then()` chains, Firebase compat SDK v10, không dùng `type="module"` |
| **Font** | Be Vietnam Pro (UI) + JetBrains Mono (code/số) |
| **TTS** | Google Cloud Text-to-Speech qua Cloud Function |

---

## 2. Student Portal — 9 Tab

### 🔐 Màn hình đăng nhập

- Học viên nhập **mã học viên** (ID), tra cứu trực tiếp từ Firebase
- Nếu tìm thấy → lưu `sv_id` vào `localStorage`, vào app
- Nếu không tìm thấy → hiển thị lỗi
- Có hướng dẫn cài đặt PWA (Add to Home Screen) ngay trên màn hình login
- Nút **"Cài app"** trên topbar (PWA install prompt)

---

### Tab 1 — 🏠 Tổng quan (Overview)

**Mục đích:** Dashboard tóm tắt toàn bộ tình trạng học của học viên trong ngày.

**Nội dung:**
- Lời chào cá nhân hoá (tên, ngày hiện tại)
- Pill **Tuần hiện tại** (số tuần đang học)
- **3 stat card:** Điểm TOEIC hiện tại · Học phần hoàn thành · Nhiệm vụ hôm nay
- **Điểm TOEIC widget:**
  - Hiển thị điểm lớn + nhãn xếp loại (Xuất sắc / Khá tốt / Trung bình / Đang tiến bộ)
  - Thanh progress bar từ 0–990 với animation
  - Lịch sử điểm (pip chart mini)
  - **Mục tiêu điểm:** nếu đã đặt, hiện marker trên bar + khoảng cách còn lại + deadline
- **Nhận xét từ giáo viên** (comments array, hiển thị comment mới nhất)
- **Nhiệm vụ hôm nay** (mini list theo section, progress bar %, trạng thái Hoàn thành / Chưa nộp)
- **Lịch sắp tới** (3 buổi học gần nhất)

---

### Tab 2 — 📈 Tiến độ học (Progress)

**Mục đích:** Xem tiến độ hoàn thành bài tập theo từng ngày.

**Nội dung:**
- Danh sách tất cả homework theo ngày, mỗi dòng có:
  - Ngày giao (dd/mm/yyyy)
  - Progress bar màu (gradient cam → xanh khi 100%)
  - Phần trăm hoàn thành
  - Số lượng done/total
- Tính done dựa trên: ticked items + submitted links + dayLink (link nộp cả ngày)

---

### Tab 3 — 🎯 Điểm số (Scores)

**Mục đích:** Theo dõi lịch sử điểm TOEIC và đặt mục tiêu.

**Nội dung:**
- **Đặt mục tiêu điểm:** nhập điểm target + deadline → lưu Firebase, teacher thấy được
- **Bảng lịch sử điểm:** mỗi entry gồm điểm tổng + tên đề + ngày + điểm từng Part (P1–P7)
- Thêm điểm mới (tên đề, tổng điểm, ngày, từng Part tùy chọn)
- Xoá điểm (nút xoá từng entry)
- Badge số điểm chờ duyệt trên tab (nếu có score request pending)

---

### Tab 4 — 📒 Nhật ký lỗi (Error Log)

**Mục đích:** Ghi lại lỗi sau mỗi buổi luyện đề và phân tích điểm yếu.

**3 view:**

**A. Form nhập log mới:**
- Ngày luyện đề + tên đề (autocomplete từ lịch sử)
- Loại luyện: Full test / Listening only / Reading only / Luyện Part
- **Stepper lỗi Listening** (9 loại): Distractor, Miss từ khoá, Inference, Không đọc đề kịp, Paraphrase, Graphic, Từ mới, Tốc độ đọc nhanh, Ngữ điệu/Giọng lạ
- **Stepper lỗi Reading** (7 loại): Từ vựng, Ngữ pháp, Logic văn bản, Đọc sai chi tiết, Inference R, Cross-reference, Không đủ thời gian
- Thêm chi tiết từng câu sai (Part, số câu, loại lỗi, nội dung, ghi chú, trạng thái đã xem lại)
- Hướng dẫn phân loại lỗi (accordion, có thể toggle)
- Lưu lên Firebase

**B. Dashboard phân tích:**
- Biểu đồ lỗi theo loại (bar chart tổng hợp từ tất cả sessions)
- Thống kê session: tổng buổi, tổng lỗi LS, tổng lỗi RD
- Lịch sử sessions (từng buổi có thể xem chi tiết)

**C. Paraphrase Log:**
- Lưu cặp từ `nguồn → paraphrase` (Part, ghi chú)
- SRS riêng cho paraphrase (intervals: 1, 3, 7, 14, 30 ngày)
- Badge đến hạn trên tab
- Flashcard ôn paraphrase (flip card, đánh giá Biết/Không biết)

---

### Tab 5 — 📖 Từ vựng (Vocab)

**Mục đích:** Quản lý và ôn từ vựng theo phương pháp SRS.

**Nội dung:**
- **Thêm từ mới:**
  - Nhập từ → tự động tra nghĩa qua Free Dictionary API (dictionaryapi.dev)
  - Lấy định nghĩa tiếng Anh + ví dụ + IPA + từ loại
  - Tra nghĩa tiếng Việt qua MyMemory Translation API
  - Phát âm qua Google Cloud TTS (Cloud Function) hoặc Web Speech API fallback
  - Gắn Part TOEIC (1–7), thêm ghi chú
  - Ngày thêm tự động = today

- **Danh sách từ:**
  - Filter theo Part (All / Part 1–7)
  - Mỗi card: từ, IPA, từ loại, định nghĩa EN, nghĩa VI, ví dụ, tag Part, ngày thêm, SRS status
  - Nút phát âm từng từ
  - Nút xoá từ
  - Nút ôn (cập nhật SRS)

- **SRS (Spaced Repetition System):**
  - Intervals: 1, 3, 7, 14, 30 ngày
  - Badge số từ đến hạn trên tab Từ vựng
  - Banner SRS trong tab khi có từ đến hạn
  - Trigger Daily Digest popup

- **Flashcard mode — 4 chế độ:**
  1. Đến hạn ôn hôm nay (SRS due)
  2. Tất cả từ vựng
  3. **Luyện nghe–viết** (Parts 1–4): nghe audio → gõ lại từ
  4. **Luyện nghĩa → từ** (Parts 5–7): đọc nghĩa → nhớ từ tiếng Anh
  - Màn hình kết quả: đúng/sai, score, nút ôn lại sai

---

### Tab 6 — ✅ Nhiệm vụ / Homework (Missions)

**Mục đích:** Xem và hoàn thành bài tập được giao.

**Nội dung:**
- Bài tập được tổ chức theo ngày (day card), mỗi ngày có:
  - Mini calendar (ngày + tháng + thứ)
  - Ring progress (SVG circle, % hoàn thành)
  - Badge trạng thái: Hôm nay / Sắp tới / Quá hạn / Đã xong

- **Mỗi bài tập gồm 5 section:**
  1. **Từ vựng** — danh sách task + link tài liệu
  2. **Đọc** — danh sách task + link
  3. **Nghe** — danh sách task + link
  4. **Khác** — các task tự do
  5. **Đề luyện thi** — link đề (styling khác biệt)

- **Tương tác học viên:**
  - Tick từng item (checkbox) → cập nhật progress lên Firebase
  - Mỗi item có thể có mô tả rich text (toggle xem)
  - Link tài liệu mở tab mới

- **Nộp link ngày:**
  - Ô nhập link nộp bài (1 link cho cả ngày)
  - Sau khi nộp: hiển thị link + timestamp + nút nộp lại

- **Congrats popup:** tự động xuất hiện khi hoàn thành 100% nhiệm vụ ngày

---

### Tab 7 — 🗓 Lịch học (Schedule)

**Mục đích:** Xem lịch học cá nhân.

**Nội dung:**
- Phần **Sắp tới:** list các buổi học chưa qua, theo thứ tự thời gian
  - Mỗi buổi: mini calendar (ngày/tháng), tên buổi, giờ, thứ, tag loại (🏞 1-1 / 🏫 Lớp)
  - Buổi hôm nay được highlight
- Phần **Lịch sử:** list các buổi đã qua
- Lịch được lấy từ `S.schedule` (do teacher giao) + lịch cố định từ lớp học (weeklySchedule)

---

### Tab 8 — 📅 Book 1-1 (Booking)

**Mục đích:** Đặt lịch học 1-1 với giáo viên.

**Nội dung:**
- Thông báo: "Giáo viên sẽ xác nhận trong vòng 24 giờ"
- **Grid khung giờ trống** (do teacher tạo): mỗi slot hiển thị ngày + giờ + trạng thái
  - Slot còn trống → có thể chọn
  - Slot đã được book → hiển thị "Đã đặt"
- **Form xác nhận:** sau khi chọn slot, nhập ghi chú → gửi yêu cầu
- **Danh sách lịch đã book:** trạng thái Chờ duyệt / Đã xác nhận / Đã huỷ
- Dữ liệu lưu tại `bookings/{bookingId}` trong Firebase

---

### Tab 9 — 💰 Học phí (Fee)

**Mục đích:** Tra cứu học phí và xem biên lai.

**Nội dung — 2 chế độ tuỳ loại khoá học:**

**A. Theo buổi (group / per_session):**
- Navigation tháng (◀ Tháng X/YYYY ▶)
- Summary row: tổng buổi có mặt / vắng / chưa điểm danh / tỉ lệ chuyên cần
- Danh sách từng buổi trong tháng: ngày, thứ, giờ, badge Có mặt/Vắng, số tiền
- Buổi vắng: gạch ngang số tiền
- Subtitle: đơn giá/buổi

**B. Trọn gói (package):**
- Hiển thị thông tin gói: tổng giá, số buổi, kỳ hạn
- Không tính theo buổi

**Biên lai (Receipt modal):**
- Nút "📄 Biên lai" mở modal
- Hiển thị thông tin khoá học, tổng buổi, tổng tiền tháng
- QR code thanh toán (ảnh được cấu hình sẵn)
- Thông tin ngân hàng
- Có thể zoom QR
- Nút in / copy

---

### Tính năng ngang (Student Portal)

| Tính năng | Mô tả |
|---|---|
| **Daily Digest Popup** | Hiện 1 lần/ngày khi mở app. Tổng hợp: nhiệm vụ quá hạn + từ vựng đến hạn + paraphrase đến hạn. Mỗi mục có nút Go thẳng tới tab tương ứng |
| **Overdue Banner** | Banner cố định trên trang nếu có bài tập quá hạn chưa nộp. Hiện số lượng + nút tắt |
| **Congrats Popup** | Xuất hiện khi tick xong 100% nhiệm vụ ngày |
| **Survey Bubble** | Bubble góc dưới màn hình dẫn tới Google Form khảo sát chất lượng. Có thể dismiss |
| **PWA Install** | Nút "Cài app" trên topbar, hỗ trợ Android (beforeinstallprompt) và iOS (hướng dẫn manual) |
| **Push Notification** | Nhận thông báo từ teacher (giao bài mới, nhắc nhở). Đăng ký subscription lưu Firebase |
| **8pm Daily Reminder** | Cloud Function tự gửi push mỗi ngày 8pm (nhắc làm bài) |
| **Network-only SW** | Service Worker không cache để bản mới luôn được cập nhật |
| **Logout** | Xoá `localStorage`, reload về login screen |

---

## 3. Teacher Panel — 5 trang chính

### 🔐 Truy cập
- Không có auth — trang mở (bảo mật bằng obscurity URL)
- Sidebar trái (collapse được trên mobile)

---

### Trang 1 — 📊 Tổng quan (Dashboard)

**Nội dung:**
- **Card grid tất cả học viên:** mỗi card gồm:
  - Tên + mã học viên
  - Tuần hiện tại
  - Điểm TOEIC mới nhất
  - Progress bar % học phần hoàn thành
  - Badge loại khoá học (Lớp nhóm / 1-1 theo buổi / 1-1 Trọn gói)
  - Badge trạng thái đóng băng (nếu frozen)
  - Click vào card → chuyển sang trang học viên
- Tìm kiếm học viên (search bar trên sidebar)
- Nút thêm học viên mới
- Thống kê nhanh (số học viên active, pending booking...)

---

### Trang 2 — 👤 Student Editor (mỗi học viên)

Chọn học viên từ sidebar → mở trang riêng cho học viên đó.

**Header actions:** Xoá học viên | 🔒 Đóng băng / 🔓 Bỏ đóng băng | Lưu tất cả

**Layout 2 cột:**

**Cột trái:**

**Thông tin cơ bản:**
- Họ tên, mã học viên, tuần hiện tại
- Loại khoá học (Lớp nhóm / 1-1 theo buổi / 1-1 Trọn gói)
- Giá/buổi (nếu per_session hoặc package)
- Ghi chú nội bộ (note_internal — chỉ teacher thấy)

**Điểm số:**
- Danh sách điểm với từng Part
- Thêm điểm mới (modal: điểm, ngày, tên đề, từng Part P1–P7)
- Xoá điểm

**Lịch học cá nhân (S.schedule):**
- Thêm buổi học: ngày, giờ, tiêu đề, loại (1-1 / Lớp)
- Xoá buổi học

**Học phần (Modules):**
- Thêm học phần: tên, tuần, tiêu đề tuần, loại, trạng thái (Chưa học / Đang học / Hoàn thành)
- Cập nhật trạng thái từng module
- Xoá module

**Cột phải:**

**Bài tập (Homework):**
- Filter: Tất cả / Hôm nay / Sắp tới / Quá hạn
- Mỗi bài: ngày + khoảng, nhãn, danh sách task từng section, progress bar % nộp
- Nút Sửa / Xoá từng bài
- **Modal thêm/sửa BTVN:**
  - Ngày bắt đầu + ngày kết thúc + nhãn (optional)
  - 5 section (accordion): **Từ vựng / Đọc / Nghe / Khác / Đề luyện thi**
  - Mỗi section: thêm nhiều items, mỗi item có: text + link + mô tả rich text (inline editor)
  - Nút toggle mô tả (+ Mô tả / 📝 Có mô tả)

**Tiến độ nộp bài (Progress tracking):**
- Bảng: mỗi ngày có homework → hiện done/total + % + progress bar
- Dữ liệu từ `submissions/` + `dayLinks/` + `progress/`

**Error Log của học viên:**
- Teacher xem tổng hợp lỗi theo loại (bar chart LS + RD)
- Lịch sử sessions của học viên

**Gửi Push Notification:**
- Nhập tiêu đề + nội dung → gửi thông báo đến học viên đang xem
- Ghi vào `notifications/{studentId}/{timestamp}` trong Firebase

**Comments / Nhận xét gửi học viên:**
- Append-only comment history
- Nhập nhận xét mới → lưu vào `comments[]` array
- Học viên thấy comment mới nhất trong tab Tổng quan

---

### Trang 3 — 🏫 Lớp học (Classes)

**Grid tất cả lớp:**
- Mỗi card lớp: tên, mô tả, số học viên, lịch cố định (weeklySchedule)
- Nút tạo lớp mới (tên + mô tả + ngày cố định trong tuần + giờ)
- Nút xoá lớp

**Chi tiết lớp (click vào lớp):**
- Thông tin lớp + weeklySchedule badges
- Nút Sửa lớp
- **Quản lý thành viên:** danh sách tag học viên + dropdown thêm học viên vào lớp
- **Học phần của lớp (Modules):** thêm/xoá module cho cả lớp
- **BTVN của lớp:**
  - Nút "+ Giao BTVN lớp" → modal tương tự bài tập cá nhân
  - **Propagation:** khi giao/sửa/xoá BTVN lớp → tự động cập nhật cho TẤT CẢ học viên trong lớp
  - Mỗi BTVN: progress bar % số học viên đã nộp
  - Grid mini: từng học viên + trạng thái (✓ Đã nộp link / ⏳ X/Y mục / — Chưa nộp)

---

### Trang 4 — 📅 Lịch Book 1-1 (Books)

**Nội dung:**
- Danh sách tất cả booking requests từ học viên
- Mỗi booking: tên học viên, slot (ngày + giờ), ghi chú từ HV, trạng thái
- Nút **Xác nhận** / **Huỷ** từng booking
- Sau khi xác nhận → slot bị đánh dấu đã đặt, học viên thấy trạng thái cập nhật

---

### Trang 5 — ⏰ Điểm danh (Attendance)

**2 chế độ:**

**A. Theo học viên (Student mode):**
- Chọn tháng/năm
- Danh sách học viên (có thể search, filter theo tỉ lệ chuyên cần, sort)
  - Badge tỉ lệ % màu xanh/vàng/đỏ
- Chọn học viên → calendar tháng hiện tháng đó
  - Các ngày có lịch học được đánh dấu
  - Click ngày → toggle Có mặt / Vắng / Chưa điểm
  - Hoặc chọn ngày cụ thể + dropdown học viên → điểm thủ công (manual modal)
- Summary bar: Có mặt / Vắng / Chưa điểm / % chuyên cần

**B. Theo lớp (Class mode):**
- Chọn lớp + tháng/năm
- Calendar cả lớp, click ngày → điểm danh hàng loạt
- Summary lớp: tổng buổi, tỉ lệ TB

---

### Tính năng ngang (Teacher Panel)

| Tính năng | Mô tả |
|---|---|
| **Sidebar navigation** | Có thể collapse, overlay trên mobile. Danh sách học viên scrollable với search |
| **Freeze/Unfreeze học viên** | Đóng băng tài khoản học viên (HV vẫn login được nhưng không tương tác) |
| **Score request review** | Học viên gửi điểm tự nhập → teacher duyệt/từ chối (đã tắt — student save trực tiếp) |
| **Teacher Push Notification** | Teacher đăng ký nhận push khi HV nộp bài / hoàn thành nhiệm vụ. Service Worker riêng (`teacher-sw.js`). Subscription lưu `teacherSubscriptions/{deviceId}` |
| **Slot management** | Trang Khung giờ trống: tạo/xoá time slots cho HV book |
| **Toast notifications** | Feedback "✅ Đã lưu" / "❌ Lỗi" xuất hiện mỗi khi thực hiện action |
| **Real-time sync** | Firebase `on('value')` listener — dữ liệu cập nhật realtime không cần reload |

---

## 4. Tính năng nền chung

### Màu sắc / Branding
- **Student Portal:** palette ấm — beige, terracotta (`#C4622D`), cream, ink nâu đậm
- **Teacher Panel:** palette mát — navy, teal/gold (`--sb-gold`), sage
- **Logo:** inline base64 PNG (tạo bằng Python Pillow + NotoColorEmoji)
- **Brand:** "Tiếng Anh² Hiếu" — dấu ² là signature thương hiệu

### Firebase Real-time
- Cả 2 web đều dùng Firebase compat SDK v10 (`firebase-app-compat`, `firebase-database-compat`)
- `db.ref(...).on('value')` cho các node quan trọng (students, classes, bookings, slots)
- `db.ref(...).once('value')` cho data load lần đầu (vocab, errorlog, scores)
- `db.ref(...).set()` / `.push()` / `.remove()` cho write

### Date handling
- Luôn dùng local date methods (`d.getFullYear()`, `d.getMonth()`, `d.getDate()`)
- Không dùng `.toISOString()` (tránh UTC bug)
- Format lưu: `YYYY-MM-DD` (string, sort-safe)

---

## 5. Firebase Data Schema (tóm tắt)

```
/students/{studentId}/
  name, id, currentWeek, frozen
  courseType: "group" | "per_session" | "package"
  pricePerSession, packageInfo
  scores: [{score, date, testName, parts:{p1..p7}}]
  modules: [{name, week, weekTitle, type, status}]
  homework: [{id, date, endDate, label, vocab[], reading[], listening[], other[], practice[]}]
  schedule: [{date, time, title, kind}]
  note_legacy (string — nhận xét cũ)
  note_internal (string — ghi chú nội bộ)
  comments: [{text, createdAt}]
  errorLog/{sessionId}: {date, testName, type, ls:{...}, rd:{...}, details:[]}
  paraphraseLog/{id}: {source, target, part, note, addedDate, lastReview, repCount}

/vocab/{studentId}/{wordId}/
  word, definition, definitionVi, ipa, pos, example
  part, addedDate, lastReview, repCount

/submissions/{studentId}/{hwId_sec_idx}/
  link, submittedAt, ticked

/dayLinks/{studentId}/{hwId}/
  link, submittedAt

/progress/{studentId}/{date}/
  done, total, updatedAt

/attendance/{studentId}/{date}/
  status: "present" | "absent"

/bookings/{bookingId}/
  studentId, slotId, note, status, createdAt

/slots/{slotId}/
  date, time, booked

/classes/{classId}/
  id, name, desc, members: [studentId]
  weeklySchedule: [{day, time}]
  homework: [{...same as student homework...}]
  modules: [...]

/scoreRequests/{requestId}/
  studentId, score, date, parts, status, submittedAt

/notifications/{studentId}/{timestamp}/
  title, body, url

/pushSubscriptions/{studentId}/{deviceId}/
  subscription, deviceId, updatedAt, userAgent

/teacherSubscriptions/{deviceId}/
  subscription, deviceId, updatedAt, userAgent

/goals/{studentId}/
  target, deadline, updatedAt
```

---

## 6. Cloud Functions

Tất cả deploy tại region `asia-southeast1`, dùng **Firebase Functions v2** (modular import).

| Function | Trigger | Mô tả |
|---|---|---|
| **`tts`** | HTTP request | Nhận `{word}` → gọi Google Cloud TTS Neural2 (`en-US-Neural2-F`) → trả về `{audioContent}` base64 MP3. API key lưu Firebase Secret `GOOGLE_TTS_KEY` |
| **`sendHomeworkNotification`** | `onValueCreated` — khi có node mới tại `notifications/{studentId}/{notifId}` | Đọc push subscription của học viên, gửi Web Push. Kích hoạt mỗi khi teacher gửi thông báo thủ công hoặc giao BTVN mới |
| **`sendDailyReminder`** | `onSchedule` — 8:00 PM ICT hàng ngày (cron `0 13 * * *` UTC) | Duyệt tất cả học viên có push subscription, gửi push nhắc làm bài buổi tối |

---

*Tài liệu tạo: 21/05/2026 — phục vụ mục đích nghiên cứu/tài liệu hoá cấu trúc hệ thống Tiếng Anh² Hiếu*
