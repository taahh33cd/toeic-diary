import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/home");
  const role = user.app_metadata?.role as string | undefined;
  redirect(role === "admin" || role === "teacher" ? "/admin" : "/journal");
}
