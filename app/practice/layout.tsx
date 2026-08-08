import { AnnotateLayer } from "@/components/annotate/AnnotateLayer";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AnnotateLayer />
    </>
  );
}
