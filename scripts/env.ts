/**
 * Nạp biến môi trường cho script, theo đúng thứ tự Next dùng: .env rồi .env.local.
 *
 * Phải import file này TRƯỚC mọi import khác: `import` của ES module chạy hết
 * trước thân file, nên gọi dotenv trong thân là quá muộn với module nào đọc
 * `process.env` ngay lúc nạp. Thiếu .env.local là mất key Azure.
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
