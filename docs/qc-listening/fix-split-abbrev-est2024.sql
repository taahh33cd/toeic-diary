-- EST 2024: câu bị tách sai tại chữ viết tắt "D.C." / "P.M." lúc import (ĐÃ ÁP DỤNG 2026-11-17).
-- Nội dung lấy từ transcript gốc trong lib/full-tests/data/est-2024-test-{2,6,7}.json.
-- Mốc thời gian: căn lại cả bài với transcript đã sửa (scripts/audit-late-starts.py +
-- crosscheck-late-starts.py); start = chỗ bắt đầu nói - 0.25s, end = hết tiếng nói + 0.4s.
-- Chạy trong một transaction; mọi câu lệnh có khoá giá trị cũ, lệch là RAISE và huỷ toàn bộ.
do $$
declare n int;
begin
  -- T2 Q95-97 #4: ", will be arriving shortly."
  update sentences set content = 'Train 133 with service to Washington, D.C., will be arriving shortly.', start_time = 20.51, end_time = 25.35
   where id = 'c32b989d-b231-4d96-b28c-deac22cf0ead' and content = ', will be arriving shortly.' and start_time = 23.48 and end_time = 27.04;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T2#4 %', n; end if;
  update blanks set position = 9 where sentence_id = 'c32b989d-b231-4d96-b28c-deac22cf0ead' and position = 3 and answer = 'arriving';
  get diagnostics n = row_count; if n <> 1 then raise exception 'T2#4 blank %', n; end if;
  -- T2 Q95-97 #6: end chồng 2.3s sang câu #7
  update sentences set end_time = 35.3
   where id = 'a9750255-5255-4f4c-b917-89b2a61f12cd' and start_time = 29.74 and end_time = 37.83;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T2#6 %', n; end if;
  -- T2 Q95-97 #7: "C."
  update sentences set content = 'Train 133''s next stop will be Wilmington, followed by Baltimore and then Washington, D.C.', start_time = 35.24, end_time = 41.67
   where id = 'd65654ab-47ea-42a7-83a7-bd959d15a09c' and content = 'C.' and start_time = 43.28 and end_time = 44.4;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T2#7 %', n; end if;
  update lessons set transcript_full = replace(replace(transcript_full,
      E'W-BR: , will be arriving shortly.', E'W-BR: Train 133 with service to Washington, D.C., will be arriving shortly.'),
      E'\nW-BR: C.', E'\nW-BR: Train 133''s next stop will be Wilmington, followed by Baltimore and then Washington, D.C.')
   where id = '557a4a2f-37cd-4e83-b3ab-05d99f6a0649' and transcript_full like E'%\nW-BR: C.' and transcript_full like '%W-BR: , will be arriving shortly.%';
  get diagnostics n = row_count; if n <> 1 then raise exception 'T2 transcript %', n; end if;

  -- T6 Q77-79: "M." + "today so that ..." -> một câu; giữ dòng có blanks, xoá dòng "M.", dồn thứ tự
  delete from sentences where id = '0b294774-4626-4564-8283-0d432844314d' and content = 'M.' and order_index = 4
   and not exists (select 1 from blanks where sentence_id = '0b294774-4626-4564-8283-0d432844314d');
  get diagnostics n = row_count; if n <> 1 then raise exception 'T6 delete %', n; end if;
  update sentences set content = 'And remember, the exhibit hall will close at five P.M. today so that exhibitors can attend this evening''s reception.',
         order_index = 4, start_time = 30.89, end_time = 39.12
   where id = '299845e9-0824-4031-b631-d47278e171f7' and order_index = 5 and content = 'today so that exhibitors can attend this evening''s reception.' and start_time = 35.59 and end_time = 40.32;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T6 merge %', n; end if;
  update blanks set position = position + 10 where sentence_id = '299845e9-0824-4031-b631-d47278e171f7' and position in (3, 5);
  get diagnostics n = row_count; if n <> 2 then raise exception 'T6 blanks %', n; end if;
  update sentences set order_index = 5, start_time = 38.39, end_time = 41.6
   where id = '57b6d73a-a8be-4ae3-84bb-24ceb5f07bc2' and order_index = 6 and start_time = 39.67 and end_time = 44.4;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T6 last %', n; end if;
  update lessons set transcript_full = replace(transcript_full,
      E'\nM.\ntoday so that exhibitors can attend this evening''s reception.',
      E'\nAnd remember, the exhibit hall will close at five P.M. today so that exhibitors can attend this evening''s reception.')
   where id = '89ee239c-dd20-41f3-82a4-b4dde5898453' and transcript_full like E'%\nM.\ntoday so that%';
  get diagnostics n = row_count; if n <> 1 then raise exception 'T6 transcript %', n; end if;

  -- T7 Q32-34 #1: end cắt mất "Easy Meals"; #2 "M."
  update sentences set end_time = 10.57
   where id = '7e951c4c-b70e-4f75-bdeb-5c36ed8debea' and start_time = 5.54 and end_time = 8.94;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T7a#1 %', n; end if;
  update sentences set content = 'I''m scheduled to offer some samples of our new vegetable chips to your customers from three to five P.M.', start_time = 10.37, end_time = 16.77
   where id = '364db49a-ac22-42a4-91b5-6a4740d5be54' and content = 'M.' and start_time = 8.29 and end_time = 9.33;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T7a#2 %', n; end if;
  update lessons set transcript_full = replace(transcript_full, E'\nW-AM: M.\n',
      E'\nW-AM: I''m scheduled to offer some samples of our new vegetable chips to your customers from three to five P.M.\n')
   where id = '9881eade-b184-474c-94c7-c17d71ee6081' and transcript_full like E'%\nW-AM: M.\n%';
  get diagnostics n = row_count; if n <> 1 then raise exception 'T7a transcript %', n; end if;

  -- T7 Q86-88 #1: "M."
  update sentences set content = 'The concert was scheduled to begin at eight P.M.', start_time = 10.19, end_time = 13.71
   where id = '1e4f6018-ddb2-4fbd-b3d8-d8caa0fccade' and content = 'M.' and start_time = 12.28 and end_time = 13.38;
  get diagnostics n = row_count; if n <> 1 then raise exception 'T7b#1 %', n; end if;
  update lessons set transcript_full = replace(transcript_full, E'\nM-AU: M.\n', E'\nM-AU: The concert was scheduled to begin at eight P.M.\n')
   where id = '07865bf2-0708-4beb-875e-9d1f31e4e897' and transcript_full like E'%\nM-AU: M.\n%';
  get diagnostics n = row_count; if n <> 1 then raise exception 'T7b transcript %', n; end if;
end $$;
