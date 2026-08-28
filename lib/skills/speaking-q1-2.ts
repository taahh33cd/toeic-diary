// Speaking · Questions 1–2 — Read a text aloud.
//
// Không có audio đề: thi thật chỉ hiện đoạn văn trên màn hình rồi thí sinh tự đọc.
// Chế độ luyện tập cho nghe bản đọc mẫu bằng speechSynthesis của trình duyệt.
//
// Thời gian chuẩn ETS: 45 giây chuẩn bị, 45 giây đọc — cho từng đoạn.

export const Q12_PREP_SECONDS = 45;
export const Q12_READ_SECONDS = 45;

/** Directions nguyên văn trên màn hình thi thật */
export const Q12_DIRECTIONS =
  "In this part of the test, you will read aloud the text on the screen. " +
  "You will have 45 seconds to prepare. Then you will have 45 seconds to read the text aloud.";

export interface Q12Text {
  /** Số câu trong đề thi thật: 1 hoặc 2 */
  n: number;
  /** Loại văn bản — quyết định ngữ điệu phải dùng */
  genre: string;
  genreVi: string;
  text: string;
}

export interface Q12Test {
  slug: string;
  label: string;
  /** Ghi chú nguồn, hiện ở danh sách bộ đề */
  note?: string;
  texts: Q12Text[];
  free?: boolean;
}

export const Q12_TESTS: Q12Test[] = [
  {
    slug: "test-1",
    label: "Bộ 1",
    free: true,
    texts: [
      {
        n: 1,
        genre: "Voice mail message",
        genreVi: "Tin nhắn thoại",
        text:
          "Hi. This is Myra Peters calling about my appointment with Dr. Jones. I have a three o'clock appointment scheduled for this afternoon. Unfortunately, I won't be able to keep it because of an important meeting at work. So, I'll need to reschedule. I was hoping to come in sometime next week. Any time Monday, Tuesday, or Wednesday afternoon would work for me. I hope the doctor has some time available on one of those days. Please call me back and let me know.",
      },
      {
        n: 2,
        genre: "Introduction of a speaker",
        genreVi: "Lời giới thiệu diễn giả",
        text:
          "Our speaker tonight is Mr. John Wilson, who has just returned from traveling in South America. Mr. Wilson spent his trip photographing scenes of small-town life across the continent. His work is well known around the world, and his photography has been featured in numerous newspapers, magazines, and books. Tonight he will share with us photographs and stories from his recent trip and will answer any questions you may have. Due to time constraints, we ask you to hold your questions until the end of the talk.",
      },
    ],
  },
  {
    slug: "ets-sample",
    label: "Đề mẫu ETS",
    note: "Đoạn văn trong bộ đề mẫu công khai của ETS (Computer-delivered Sample Tests) — chỉ có 1 bài đọc.",
    free: true,
    texts: [
      {
        n: 1,
        genre: "Advertisement",
        genreVi: "Quảng cáo",
        text:
          "If you're shopping, sightseeing and running around every minute, your vacation can seem like hard work. To avoid vacation stress, come to the Blue Valley Inn on beautiful Lake Mead. While staying at our inn, you'll breathe clean country air as you view spectacular sights. With its spacious rooms, swimming pool and many outdoor activities, the inn is the perfect place for a vacation you won't forget. The Blue Valley Inn prides itself on the personal attention it provides to every guest. The Blue Valley motto has always been \"A happy guest is our greatest treasure.\"",
      },
    ],
  },
];

export function getQ12Test(slug: string): Q12Test | undefined {
  return Q12_TESTS.find((t) => t.slug === slug);
}
