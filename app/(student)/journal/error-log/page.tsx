import { redirect } from "next/navigation";

export default function ErrorLogRedirect() {
  redirect("/journal/scores");
}
