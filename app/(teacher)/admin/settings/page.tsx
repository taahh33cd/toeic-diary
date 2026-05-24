"use client";

import { PushSubscribeCard } from "@/app/(student)/journal/settings/_push-subscribe";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          ⚙️ Cài đặt
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Cài đặt cho tài khoản giáo viên
        </p>
      </div>

      {/* P2: Teacher push subscription */}
      <PushSubscribeCard />
    </div>
  );
}
