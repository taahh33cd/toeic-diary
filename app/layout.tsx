import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Syne, Lora, Be_Vietnam_Pro, Noto_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { FirebaseBridgeProvider } from "@/components/shared/FirebaseBridgeProvider";
import { ToastProvider } from "@/components/shared/Toast";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { ServiceWorkerRegistrar } from "@/components/shared/ServiceWorkerRegistrar";

// ── Fonts ──────────────────────────────────────
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// ── Journal fonts (warm beige theme — matches STUDENT.html) ──────────────────
const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// ── Admin "Silk & Alexandria" fonts ─────────────────────
const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// ── Metadata ──────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "TOEIC Dictation Master",
    template: "%s | TOEIC Dictation Master",
  },
  description:
    "Luyện nghe chép chính tả TOEIC chuyên sâu — 3 levels, AI feedback, bộ đề ETS 2026",
  keywords: ["TOEIC", "dictation", "luyện nghe", "ETS 2026", "listening"],
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
        className={`${dmSans.variable} ${jetbrainsMono.variable} ${syne.variable} ${lora.variable} ${beVietnamPro.variable} ${notoSerif.variable} ${plusJakarta.variable}`}
        suppressHydrationWarning
      >
        <FirebaseBridgeProvider />
        <ServiceWorkerRegistrar />
        <ToastProvider>
          {children}
          <ConnectionStatus />
        </ToastProvider>
      </body>
    </html>
  );
}
