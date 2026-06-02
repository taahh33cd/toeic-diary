import { redirect } from "next/navigation";

type Props = { params: Promise<{ questionWord: string }> };

export default async function OldPart2Page({ params }: Props) {
  const { questionWord } = await params;
  redirect(`/subskills/listening/part2/${questionWord}`);
}
