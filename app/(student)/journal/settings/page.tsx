import type { Metadata } from "next";
import { StudentPushSubscribeCard } from "./_push-subscribe";
import { JournalThemePicker } from "@/components/journal/ThemePicker";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Cài đặt
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Tuỳ chỉnh trải nghiệm học tập của bạn.
        </p>
      </div>

      <JournalThemePicker />

      <StudentPushSubscribeCard />
    </div>
  );
}
