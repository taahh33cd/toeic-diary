/**
 * lib/roadmap/hook.ts — móc đối chiếu bằng chứng vào các route ghi nhận bài làm.
 *
 * Đặt ở SERVER, trong chính route lưu kết quả, chứ không rải lời gọi vào hàng
 * chục client: khu subskill có tới hơn mười màn hình cùng POST vào
 * /api/subskills/attempt, sửa từng cái vừa lắm việc vừa chắc chắn sót.
 *
 * Mọi lỗi bị nuốt: học viên vừa nộp bài xong, không có lý do gì để họ thấy lỗi
 * chỉ vì phần lộ trình trục trặc. Việc chưa kịp tích sẽ được tích ở lần mở
 * trang sau (route /api/roadmap/today luôn đối chiếu lại).
 */

import { syncTasks } from "./evidence";

/**
 * Gọi sau khi một bài làm vừa được lưu.
 *
 * `await` chứ không bắn-rồi-quên: trên serverless, việc không được chờ có thể
 * bị cắt ngang khi response đã trả. Với học viên chưa có lộ trình thì đây chỉ
 * là một truy vấn có index trả về rỗng.
 */
export async function syncRoadmapAfterAttempt(userId: string): Promise<void> {
  try {
    await syncTasks(userId);
  } catch {
    /* lộ trình trục trặc không được làm hỏng việc nộp bài */
  }
}
