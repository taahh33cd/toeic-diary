import HomeworkTabs from "./_tabs";

export default function HomeworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        📝 Bài tập
      </h1>
      <HomeworkTabs />
      {children}
    </div>
  );
}
