-- Hoàn tác fix-part2-timings-est2024.sql
begin;
update sentences s set start_time = v.os, end_time = v.oe from (values
  ('b187ab8b-e474-4ccf-ab01-8ac027f17906', 0.68::float8, 7.4::float8), ('02898fa2-b239-4aac-a4bc-8adf342e9e8e', 7.32, 11.4),
  ('9794f425-7269-440b-aea8-ee61adc02361', 17.99, 22.87), ('a836668e-0700-4404-a141-f0fe9cb32e49', 22.22, 22.87),
  ('832201fa-5a76-4937-b836-c01b782e165e', 0.31, 5.4), ('e2903872-1110-408b-a6d1-281f2e133949', 8.75, 13.26),
  ('00f1289a-6c0d-4472-a897-6c316c6daea6', 13.18, 18.41), ('f46118ec-6be4-4396-8dde-594d1ed47951', 17.76, 22.38)) v(id, os, oe)
 where s.id = v.id;
update sentences set content = 'Of course-I''ll do it now.' where id = '00f1289a-6c0d-4472-a897-6c316c6daea6';
update blanks set answer = 'course-I''ll', hint = 'c__________' where sentence_id = '00f1289a-6c0d-4472-a897-6c316c6daea6' and position = 1;
update lessons set transcript_full = replace(transcript_full, '(B) Of course, I''ll do it now.', '(B) Of course-I''ll do it now.') where id = '71b9f323-2243-4034-a40e-217ee4ab3582';
commit;
