-- 010 — khoá chống ghi trùng cho phiên quiz
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--
-- Cần cho hàng đợi offline: khi mạng đứt giữa chừng, client không biết server
-- đã nhận được hay chưa, nên gửi lại. Không có khoá này thì một lượt quiz bị
-- ghi hai lần và SRS của cả chục từ bị đẩy thừa một bậc.

ALTER TABLE "vocab_quiz_sessions" ADD COLUMN "client_ref" TEXT;

-- Chỉ ràng buộc trên các dòng CÓ client_ref: phiên cũ và phiên gửi từ bản
-- client chưa cập nhật đều để NULL, mà NULL trong Postgres không đụng nhau.
CREATE UNIQUE INDEX "vocab_quiz_sessions_client_ref_key"
  ON "vocab_quiz_sessions" ("client_ref")
  WHERE "client_ref" IS NOT NULL;
