"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  role: string;
  studentCode: string | null;
  displayName: string | null;
}

/**
 * Fetches the current user's Supabase profile (role, studentCode, displayName).
 * Returns null while loading or if not logged in.
 */
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, role, student_code, display_name")
        .eq("id", user.id)
        .single<{
          id: string;
          role: string;
          student_code: string | null;
          display_name: string | null;
        }>();

      if (data) {
        setProfile({
          id: data.id,
          role: data.role,
          studentCode: data.student_code,
          displayName: data.display_name,
        });
      }
      setLoading(false);
    }

    load();
  }, []);

  return { profile, loading };
}
