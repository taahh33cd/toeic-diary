import { AnnotateLayer } from "@/components/annotate/AnnotateLayer";

export default function DictationLayout({
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
