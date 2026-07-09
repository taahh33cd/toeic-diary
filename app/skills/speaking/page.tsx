import type { Metadata } from "next";
import { SkillComingSoon } from "@/components/skills/SkillComingSoon";

export const metadata: Metadata = { title: "Speaking — Luyện đề TOEIC" };

export default function SkillsSpeakingPage() {
  return (
    <SkillComingSoon
      emoji="🗣"
      label="Speaking"
      labelVi="Nói"
      description="11 câu hỏi · luyện theo đúng format đề thi TOEIC chính thức."
    />
  );
}
