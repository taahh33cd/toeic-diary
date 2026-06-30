import type { Metadata } from "next";
import { ThemePickerModal } from "@/components/journal/ThemePickerModal";
import { PushTestButton } from "./_push-test";

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

      <ThemePickerModal />

      <div className="space-y-2">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Thông báo
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Kiểm tra xem thông báo push có hoạt động trên thiết bị này không.
        </p>
        <PushTestButton />
      </div>
    </div>
  );
}
