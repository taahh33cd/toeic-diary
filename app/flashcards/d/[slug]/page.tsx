import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import PublicDeck from "@/components/vocab/PublicDeck";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Chỉ trả bộ đang bật chia sẻ. Lọc luôn visibility trong truy vấn để bộ
 * private trả 404 y như bộ không tồn tại — không hé ra là slug đó có thật.
 */
async function layBo(slug: string) {
  return prisma.vocabDeck.findFirst({
    where: { slug, visibility: "link" },
    select: {
      id: true,
      title: true,
      description: true,
      cardCount: true,
      // KHÔNG lấy ownerId: trang công khai không cần biết bộ của ai
      cards: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          word: true,
          wordKey: true,
          ipa: true,
          pos: true,
          meaningVi: true,
          definition: true,
          example: true,
          imageUrl: true,
          audioUrl: true,
          order: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const deck = await layBo(slug);
  if (!deck) return { title: "Không tìm thấy bộ thẻ" };
  return {
    title: `${deck.title} — Bộ thẻ từ vựng`,
    description: deck.description ?? `${deck.cardCount} từ vựng tiếng Anh, học bằng flashcard.`,
    robots: { index: false, follow: false }, // link riêng tư, không để lọt lên Google
  };
}

export default async function PublicDeckPage({ params }: Props) {
  const { slug } = await params;
  const deck = await layBo(slug);
  if (!deck) notFound();

  // Người đã đăng nhập mở link của người khác thì vẫn ghi tiến độ thật vào tài
  // khoản họ: tiến độ gắn theo TỪ chứ không theo bộ, nên học từ bộ của ai cũng
  // được tính. Đẩy vào localStorage là vứt công ôn của họ đi.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PublicDeck
      slug={slug}
      title={deck.title}
      description={deck.description}
      cards={deck.cards}
      daDangNhap={!!user}
    />
  );
}
