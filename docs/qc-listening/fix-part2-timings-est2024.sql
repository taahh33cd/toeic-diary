-- EST 2024 T2 Q22 + T7 Q23 (Part 2): mốc thời gian lộn xộn — đặt lại theo đoạn tiếng nói đo từ năng lượng âm thanh
-- (đã đối chiếu ASR): start = bắt đầu nói - 0.25s, end = hết nói + 0.4s, không chồng lên chữ cái đáp án kế tiếp.
-- Kèm sửa lỗi gõ T7 Q23 (B) "Of course-I'll" -> "Of course, I'll" theo transcript gốc. ĐÃ ÁP DỤNG 2026-11-17.
do $$
declare n int;
begin
  update sentences s set start_time = v.ns, end_time = v.ne from (values
    ('b187ab8b-e474-4ccf-ab01-8ac027f17906', 0.68::float8, 7.4::float8, 2.39::float8, 6.89::float8),
    ('02898fa2-b239-4aac-a4bc-8adf342e9e8e', 7.32, 11.4, 8.14, 10.71),
    ('9794f425-7269-440b-aea8-ee61adc02361', 17.99, 22.87, 11.94, 14.5),
    ('a836668e-0700-4404-a141-f0fe9cb32e49', 22.22, 22.87, 15.68, 18.19),
    ('832201fa-5a76-4937-b836-c01b782e165e', 0.31, 5.4, 2.46, 5.59),
    ('e2903872-1110-408b-a6d1-281f2e133949', 8.75, 13.26, 7.1, 10.47),
    ('00f1289a-6c0d-4472-a897-6c316c6daea6', 13.18, 18.41, 11.9, 14.16),
    ('f46118ec-6be4-4396-8dde-594d1ed47951', 17.76, 22.38, 15.57, 17.73)) v(id, os, oe, ns, ne)
  where s.id = v.id and abs(s.start_time - v.os) < 0.005 and abs(s.end_time - v.oe) < 0.005;
  get diagnostics n = row_count; if n <> 8 then raise exception 'times %', n; end if;
  update sentences set content = 'Of course, I''ll do it now.' where id = '00f1289a-6c0d-4472-a897-6c316c6daea6' and content = 'Of course-I''ll do it now.';
  get diagnostics n = row_count; if n <> 1 then raise exception 'content %', n; end if;
  update blanks set answer = 'course', hint = 'c_____' where sentence_id = '00f1289a-6c0d-4472-a897-6c316c6daea6' and position = 1 and answer = 'course-I''ll';
  get diagnostics n = row_count; if n <> 1 then raise exception 'blank %', n; end if;
  update lessons set transcript_full = replace(transcript_full, '(B) Of course-I''ll do it now.', '(B) Of course, I''ll do it now.')
   where id = '71b9f323-2243-4034-a40e-217ee4ab3582' and transcript_full like '%(B) Of course-I''ll do it now.%';
  get diagnostics n = row_count; if n <> 1 then raise exception 'transcript %', n; end if;
end $$;
