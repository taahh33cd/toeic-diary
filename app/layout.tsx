import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FirebaseBridgeProvider } from "@/components/shared/FirebaseBridgeProvider";
import { ToastProvider } from "@/components/shared/Toast";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { ServiceWorkerRegistrar } from "@/components/shared/ServiceWorkerRegistrar";
import { WordLookupProvider } from "@/components/shared/WordLookupProvider";
import { CourseUnlockCelebration } from "@/components/course/CourseUnlockCelebration";

// ── Fonts ──────────────────────────────────────
//
// Font nằm TRONG repo (`app/fonts/`), không gọi `next/font/google` nữa.
// Lý do: `next/font/google` tải font lúc BUILD, mà máy build của Vercel mất
// đường ra fonts.googleapis.com khoảng 29% số lần (đo 2026-11-15: 4 lỗi / 14
// lần deploy production trong 3 ngày), mỗi lần hỏng cả bản deploy.
//
// File do `scripts/vendor-fonts.py` sinh ra từ kho chính thức google/fonts
// (giấy phép OFL, kèm trong app/fonts/), đã cắt còn latin + latin-ext +
// vietnamese và nén woff2. MUỐN THÊM/ĐỔI WEIGHT thì sửa cả script đó lẫn danh
// sách dưới đây — lệch nhau là trình duyệt giả lập nét đậm/nghiêng.

const jetbrainsMono = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// ── Journal fonts (warm beige theme — matches STUDENT.html) ──────────────────
const lora = localFont({
  src: [
    { path: "./fonts/Lora-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Lora-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Lora-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Lora-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/Lora-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Lora-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-lora",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const beVietnamPro = localFont({
  src: [
    { path: "./fonts/BeVietnamPro-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/BeVietnamPro-300-italic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/BeVietnamPro-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/BeVietnamPro-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/BeVietnamPro-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/BeVietnamPro-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/BeVietnamPro-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/BeVietnamPro-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/BeVietnamPro-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/BeVietnamPro-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-be-vietnam",
  display: "swap",
});

// Chữ viết tay cho tiêu đề mục / nhãn tab / ghi chú bên lề trong sổ.
// Playpen Sans có dấu tiếng Việt đầy đủ (Caveat, Architects Daughter, Kalam
// đều thiếu).
const playpenSans = localFont({
  src: [
    { path: "./fonts/PlaypenSans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PlaypenSans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PlaypenSans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/PlaypenSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hand-face",
  display: "swap",
});

// ── Admin "Silk & Alexandria" fonts ─────────────────────
const notoSerif = localFont({
  src: [
    { path: "./fonts/NotoSerif-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/NotoSerif-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/NotoSerif-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/NotoSerif-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

// ── Metadata ──────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "TOEIC Diary",
    template: "%s | TOEIC Diary",
  },
  description:
    "Luyện nghe chép chính tả TOEIC chuyên sâu — 3 levels, AI feedback, bộ đề EST 2026",
  keywords: ["TOEIC", "dictation", "luyện nghe", "EST 2026", "listening"],
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Anh Hiếu²",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      // suppressHydrationWarning cần thiết vì theme script
      // sẽ add class "dark" trước khi React hydrate
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
        {/* Theme init script — chạy TRƯỚC khi React render để tránh flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('toeic-theme');
                  var parsed = stored ? JSON.parse(stored) : null;
                  var theme = parsed && parsed.state ? parsed.state.theme : null;
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${lora.variable} ${beVietnamPro.variable} ${notoSerif.variable} ${playpenSans.variable}`}
        suppressHydrationWarning
      >
        <FirebaseBridgeProvider />
        <ServiceWorkerRegistrar />
        <ToastProvider>
          <WordLookupProvider>
            {children}
          </WordLookupProvider>
          <CourseUnlockCelebration />
          <ConnectionStatus />
        </ToastProvider>
      </body>
    </html>
  );
}
