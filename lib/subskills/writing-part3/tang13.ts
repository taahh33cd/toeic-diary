// ─────────────────────────────────────
// Tầng 13 — viết thật rồi nộp giáo viên chấm
//
// Không có bộ test tự chấm: đề thật, đồng hồ 30 phút, tối thiểu 300 từ,
// checklist tự soi rút ra từ Tầng 1–12.
//
// 24 đề chia đều 6 dạng. Prompt viết mới theo khuôn ETS, giữ chủ đề của đề thi
// thật — KHÔNG chép nguyên văn đề của ETS hay sách luyện thi.
// ─────────────────────────────────────

import type { P3EssayType } from "./index";

export type P3ComposeTask = {
  id: string;
  /** Nhãn ngắn hiện ở danh sách đề */
  label: string;
  essayType: P3EssayType;
  /** Đề bài đúng khuôn ETS, gồm bối cảnh + câu hỏi + yêu cầu chứng minh */
  prompt: string;
  /** Việc đề giao, tách sẵn để tự soi trước khi nộp */
  missions: string[];
};

/** Đúng thời gian thật của Q8 trong phòng thi */
export const COMPOSE_MINUTES_P3 = 30;

/** Ngưỡng ETS ghi trên màn hình: «an effective essay will contain a minimum of 300 words» */
export const MIN_WORDS_P3 = 300;

/** Mục tự soi áp dụng cho mọi đề — rút ra từ Tầng 7, 8 và 12 */
export const COMPOSE_CHECKS_P3 = [
  "Đủ tối thiểu 300 từ",
  "Không chép nguyên văn câu nào của đề",
  "Không có câu mở bài sáo rỗng kiểu «Nowadays society is developing…»",
  "Mỗi đoạn thân bài có ít nhất một chi tiết mà người khác không đoán được",
  "Đã rà một lượt riêng chỉ nhìn động từ: chia thì, hoà hợp chủ–vị, mạo từ",
  "Kết bài không chỉ tóm tắt lại thân bài",
];

/** Việc đề giao theo từng dạng — dùng chung cho 4 đề cùng dạng */
const MISSIONS: Record<P3EssayType, string[]> = {
  agree_disagree: [
    "Nêu rõ đồng ý hay phản đối ngay ở mở bài, không đứng giữa",
    "Đưa 2–3 lý do, mỗi lý do một đoạn thân bài",
    "Mỗi lý do có ít nhất một ví dụ cụ thể",
    "Kết bài nhượng bộ phía bên kia rồi khẳng định lại",
  ],
  choice_2: [
    "Chọn dứt khoát một trong hai, không tả đều cả hai",
    "Mỗi lý do chọn đi kèm một ví dụ cụ thể",
    "Dành ít nhất một câu nói vì sao lựa chọn kia kém hơn",
    "Kết bài khẳng định lại lựa chọn bằng chữ mới",
  ],
  choice_3: [
    "Chọn đúng một trong ba, nhắc được rằng đề có ba phương án",
    "Chống đỡ lựa chọn bằng lý do kèm ví dụ cụ thể",
    "Nói vì sao TỪNG phương án còn lại kém hơn — không bỏ sót phương án nào",
    "Kết bài nêu tiêu chí chung đằng sau lựa chọn",
  ],
  pros_cons: [
    "Mở bài KHÔNG chọn phe, chỉ báo trước bài sẽ đi cả hai chiều",
    "Một đoạn cho mặt lợi, có ví dụ cụ thể",
    "Một đoạn cho mặt hại, có ví dụ cụ thể, dài tương đương đoạn lợi",
    "Kết bài mới là chỗ ngả về một bên",
  ],
  open_q: [
    "Tự đặt ra 2–3 hạng mục rồi chọn một, vì đề không cho sẵn lựa chọn nào",
    "Nói vì sao hạng mục đã chọn hơn các hạng mục kia",
    "Chống đỡ bằng ví dụ cụ thể từ công việc hoặc đời sống",
    "Kết bài khẳng định lại lựa chọn",
  ],
  policy: [
    "Nêu rõ nên hay không nên, dùng đúng chữ «should» hoặc «should not»",
    "Lập luận theo ít nhất hai bên chịu tác động, mỗi bên một đoạn",
    "Mỗi bên có một ví dụ cụ thể",
    "Kết bài không quay lại đứng giữa",
  ],
};

function task(id: string, label: string, essayType: P3EssayType, prompt: string): P3ComposeTask {
  return { id, label, essayType, prompt, missions: MISSIONS[essayType] };
}

export const COMPOSE_TASKS_P3: P3ComposeTask[] = [
  // ── Đồng ý / phản đối ─────────────────────────────
  task(
    "ad1",
    "Việc mình thích hay lương cao",
    "agree_disagree",
    "It is more important to work at a job you enjoy than to earn a high salary. Do you agree or disagree with this statement? Give reasons or examples to support your opinion.",
  ),
  task(
    "ad2",
    "Trẻ em và thể thao",
    "agree_disagree",
    "Children should be encouraged to play a sport, even if it is not part of an organised team. Do you agree or disagree with this statement? Give reasons or examples to support your opinion.",
  ),
  task(
    "ad3",
    "Sếp có nên thân với nhân viên",
    "agree_disagree",
    "A manager should never become close friends with the people who report to them. Do you agree or disagree with this statement? Give reasons or examples to support your opinion.",
  ),
  task(
    "ad4",
    "Đặt mục tiêu bằng văn bản",
    "agree_disagree",
    "Writing down clear goals is necessary for success at work. Do you agree or disagree with this statement? Give reasons or examples to support your opinion.",
  ),

  // ── Chọn 1 trong 2 ────────────────────────────────
  task(
    "c21",
    "Công ty lớn hay công ty nhỏ",
    "choice_2",
    "Some people prefer to work for a large company with many departments. Others prefer a small company where everyone knows each other. Which would you prefer? Give reasons or examples to support your opinion.",
  ),
  task(
    "c22",
    "Học bằng làm hay học bằng đọc",
    "choice_2",
    "Some people learn a new skill best by trying it themselves. Others learn best by reading about it first. Which way of learning suits you better? Give reasons or examples to support your opinion.",
  ),
  task(
    "c23",
    "Công việc đi nhiều hay ngồi một chỗ",
    "choice_2",
    "Some people enjoy jobs that involve frequent travel and meeting new people. Others prefer working in one place with the same colleagues. Which would you prefer? Give reasons or examples to support your opinion.",
  ),
  task(
    "c24",
    "Cha mẹ hay thầy cô",
    "choice_2",
    "Some people say parents matter most in how well a child does at school. Others say teachers matter most. Which do you think has the greater influence? Give reasons or examples to support your opinion.",
  ),

  // ── Chọn 1 trong 3 ────────────────────────────────
  task(
    "c31",
    "Thưởng nhân viên cuối năm",
    "choice_3",
    "A company wants to thank its staff after a successful year. It is considering three options: a cash bonus, five extra vacation days, or a company trip abroad. Which option should the company choose? Give reasons or examples to support your opinion.",
  ),
  task(
    "c32",
    "Cải tạo văn phòng",
    "choice_3",
    "A company has money to improve one part of its office. It could rebuild the meeting rooms, replace the chairs and desks, or create a quiet room for focused work. Which should the company choose? Give reasons or examples to support your opinion.",
  ),
  task(
    "c33",
    "Hoạt động ngoại khoá cho trường",
    "choice_3",
    "A school can add one new activity for its students: a sports team, a student newspaper, or a volunteering programme in the neighbourhood. Which should the school choose? Give reasons or examples to support your opinion.",
  ),
  task(
    "c34",
    "Thành phố tiêu khoản dư",
    "choice_3",
    "A city has money left in its budget at the end of the year. It could improve public transport, build a new park, or renovate its libraries. Which should the city choose? Give reasons or examples to support your opinion.",
  ),

  // ── Ưu & nhược ────────────────────────────────────
  task(
    "pc1",
    "Làm việc tại nhà vài ngày mỗi tuần",
    "pros_cons",
    "Many companies now allow their staff to work from home several days a week. What are the advantages and disadvantages of this arrangement? Give reasons or examples to support your opinion.",
  ),
  task(
    "pc2",
    "Đọc đánh giá trước khi xem phim",
    "pros_cons",
    "Many people read reviews before they decide to watch a film. What are the advantages and disadvantages of reading reviews first? Give reasons or examples to support your opinion.",
  ),
  task(
    "pc3",
    "Nhận chỉ đạo qua e-mail",
    "pros_cons",
    "In many workplaces, instructions that were once given face to face are now sent by e-mail. What are the advantages and disadvantages of communicating this way? Give reasons or examples to support your opinion.",
  ),
  task(
    "pc4",
    "Giờ làm việc linh hoạt",
    "pros_cons",
    "Some companies let employees decide what hours they work each day. What are the advantages and disadvantages of this arrangement? Give reasons or examples to support your opinion.",
  ),

  // ── Câu hỏi mở ────────────────────────────────────
  task(
    "oq1",
    "Cách học việc nhanh nhất",
    "open_q",
    "In your opinion, what is the most effective way for a new employee to learn how a company really works? Give reasons or examples to support your opinion.",
  ),
  task(
    "oq2",
    "Phẩm chất của người quản lý giỏi",
    "open_q",
    "Leading a team is difficult. In your opinion, what quality matters most in a good manager? Give reasons or examples to support your opinion.",
  ),
  task(
    "oq3",
    "Giải quyết bất đồng với đồng nghiệp",
    "open_q",
    "Disagreements between colleagues happen in every workplace. In your opinion, what is the best way to resolve one? Give reasons or examples to support your opinion.",
  ),
  task(
    "oq4",
    "Điều hữu ích nhất trường nên dạy",
    "open_q",
    "Besides academic subjects, schools can teach students many other things. In your opinion, what is the most useful of these? Give reasons or examples to support your opinion.",
  ),

  // ── Nên hay không nên ─────────────────────────────
  task(
    "pl1",
    "Máy bán hàng trong trường",
    "policy",
    "Some schools have placed vending machines in their hallways so that students can buy snacks between classes. Do you think schools should do this? Give reasons or examples to support your opinion.",
  ),
  task(
    "pl2",
    "Phương tiện công cộng miễn phí",
    "policy",
    "A few cities have made their buses and trains free for all residents. Do you think other cities should do the same? Give reasons or examples to support your opinion.",
  ),
  task(
    "pl3",
    "Chặn mạng xã hội ở công ty",
    "policy",
    "Some companies block access to social media on their office network during working hours. Do you think companies should do this? Give reasons or examples to support your opinion.",
  ),
  task(
    "pl4",
    "Nghỉ một năm trước đại học",
    "policy",
    "Some students take a year off to work or travel after finishing secondary school, before starting university. Do you think schools should encourage this? Give reasons or examples to support your opinion.",
  ),
];

export function getComposeTaskP3(id: string): P3ComposeTask | undefined {
  return COMPOSE_TASKS_P3.find((t) => t.id === id);
}
