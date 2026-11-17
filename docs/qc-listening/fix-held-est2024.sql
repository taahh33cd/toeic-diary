-- 4 câu "cần nghe lại" cuối cùng (ĐÃ ÁP DỤNG 2026-11-17). Đo bằng đoạn tiếng nói (năng lượng âm thanh) + ASR từng từ.
-- T1 Q74-76 #6 muộn 2s (nói từ 37.66, DB 39.71) — sửa; #5 end chồng 3s sang #6 — co lại.
-- T3 Q98-100 #0 "Good morning." nói 7.10-7.77, DB 5.75-7.15 (phủ đuôi giọng đọc đề, cắt "morning") — sửa;
--   #1 start 6.50 nằm trên "Good morning" và sẽ đứng trước #0 — dời về 7.89 (nói từ 8.14).
-- T2 Q86-88 #0 và T8 Q2 #0: DB không muộn (align bắt nhầm giọng đọc đề / chữ cái đáp án) — không đổi.
do $$
declare n int;
begin
  update sentences s set start_time = v.ns, end_time = v.ne from (values
    ('4671ea77-0a07-4ab1-b9f5-6ac97887ef13', 32.88::float8, 40.36::float8, 32.88::float8, 37.49::float8),
    ('cd3979e2-0bd6-4574-8764-313d6bbfe575', 39.71, 48.4, 37.41, 44.91),
    ('25f6ed2a-9938-4056-8f8d-905956d0c98f', 5.75, 7.15, 6.85, 8.17),
    ('a821933b-0e0d-409b-a6e6-1e1ccf842e95', 6.5, 11.63, 7.89, 11.63)) v(id, os, oe, ns, ne)
  where s.id = v.id and abs(s.start_time - v.os) < 0.005 and abs(s.end_time - v.oe) < 0.005;
  get diagnostics n = row_count; if n <> 4 then raise exception 'times %', n; end if;
end $$;
