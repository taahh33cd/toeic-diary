import { Suspense } from "react";
import { EngagementWidget } from "@/components/admin/EngagementWidget";
import AdminDashboardClient from "./_dashboard-client";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminDashboardClient />
      <Suspense fallback={null}>
        <EngagementWidget />
      </Suspense>
    </div>
  );
}
