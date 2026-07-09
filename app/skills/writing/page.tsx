import type { Metadata } from "next";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";

export const metadata: Metadata = { title: "Writing — Luyện đề TOEIC" };

export default function SkillsWritingPage() {
  return (
    <SkillComingSoon
      emoji="✍️"
      label="Writing"
      labelVi="Viết"
      description="8 câu hỏi · luyện theo đúng format đề thi TOEIC chính thức."
    />
  );
}
