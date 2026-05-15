"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "none",
        border: "1px solid rgba(196,98,45,.25)",
        color: "rgba(245,239,230,.45)",
        padding: ".3rem .8rem",
        fontSize: ".72rem",
        cursor: "pointer",
        fontFamily: "var(--font-be-vietnam,'Be Vietnam Pro',sans-serif)",
        transition: "all .2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8885C";
        (e.currentTarget as HTMLButtonElement).style.color = "#E8885C";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(196,98,45,.25)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,239,230,.45)";
      }}
    >
      Thoát
    </button>
  );
}
