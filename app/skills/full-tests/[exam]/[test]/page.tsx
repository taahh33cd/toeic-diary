import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogEntry, getExamSet, loadTest } from "@/lib/full-tests";
import { FullTestRunner } from "@/components/full-tests/FullTestRunner";

type Props = { params: Promise<{ exam: string; test: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam, test } = await params;
  const entry = getCatalogEntry(exam, Number(test));
  return { title: entry ? `${entry.title} — TOEIC` : "Full Test — TOEIC" };
}

export default async function FullTestPage({ params }: Props) {
  const { exam, test } = await params;
  const examSet = getExamSet(exam);
  const testNumber = Number(test);
  if (!examSet || !examSet.available || !Number.isInteger(testNumber)) notFound();

  const entry = getCatalogEntry(exam, testNumber);
  if (!entry || entry.locked) notFound();

  const data = await loadTest(entry.slug);
  if (!data) notFound();

  return <FullTestRunner test={data} examSlug={exam} />;
}
