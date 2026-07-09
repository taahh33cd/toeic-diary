import type { Metadata } from "next";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";

export const metadata: Metadata = { title: "Reading — Luyện đề TOEIC" };

export default function SkillsReadingPage() {
  return (
    <SkillComingSoon
      emoji="📖"
      label="Reading"
      labelVi="Đọc hiểu"
      description="Part 5–7 · luyện theo đúng format đề thi TOEIC chính thức."
    />
  );
}
