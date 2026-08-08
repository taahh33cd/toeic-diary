import { AnnotateLayer } from "@/components/annotate/AnnotateLayer";

export default function TestLayout({
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
