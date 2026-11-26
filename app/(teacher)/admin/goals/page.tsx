import { Suspense } from "react";
import { GoalsAdminClient } from "./_client";

export const metadata = { title: "Mục tiêu" };

/** Mục tiêu điểm tổng + mục tiêu part theo tháng của mọi HV (docs/goals-spec.md). */
export default function GoalsAdminPage() {
  return (
    <Suspense>
      <GoalsAdminClient />
    </Suspense>
  );
}
