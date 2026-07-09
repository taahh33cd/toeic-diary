import type { Metadata } from "next";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";

export const metadata: Metadata = { title: "Listening — Luyện đề TOEIC" };

export default function SkillsListeningPage() {
  return (
    <SkillComingSoon
      emoji="🎧"
      label="Listening"
      labelVi="Nghe hiểu"
      description="Part 1–4 · luyện theo đúng format đề thi TOEIC chính thức."
    />
  );
}
