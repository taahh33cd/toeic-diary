import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TOPICS, getTestSlice } from "@/lib/grammar/topics";
import { grammarQuestions } from "@/lib/grammar/questions";
import { QuizClient } from "@/components/grammar/QuizClient";
import type { Metadata } from "next";

interface Params { topic: string; test: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { topic, test } = await params;
  const topicConfig = TOPICS.find((t) => t.slug === topic);
  if (!topicConfig) return { title: "Ngữ pháp" };
  return { title: `${topicConfig.name} — Test ${test}` };
}

export default async function GrammarTestPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { topic, test } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/grammar/${topic}/${test}`);

  const topicConfig = TOPICS.find((t) => t.slug === topic);
  if (!topicConfig) notFound();

  const testNumber = parseInt(test, 10);
  if (isNaN(testNumber) || testNumber < 1) notFound();

  const testIndex = testNumber - 1; // 0-based
  const testQuestions = getTestSlice(
    grammarQuestions,
    topicConfig.id,
    testIndex,
    topicConfig.testSizes
  );
  if (testQuestions.length === 0) notFound();

  return (
    <QuizClient
      questions={testQuestions}
      topicSlug={topic}
      topicName={topicConfig.name}
      testIndex={testIndex}
      testNumber={testNumber}
    />
  );
}
