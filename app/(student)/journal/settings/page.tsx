import type { Metadata } from "next";
import { PushSubscribeCard } from "./_push-subscribe";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Cài đặt
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Tuỳ chỉnh trải nghiệm học tập của bạn.
        </p>
      </div>

      <PushSubscribeCard />
    </div>
  );
}
