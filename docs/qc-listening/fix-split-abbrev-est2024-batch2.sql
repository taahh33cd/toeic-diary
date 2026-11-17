-- Đợt 2 sửa câu bị tách sai tại "A.M."/"P.M."/dấu ngoặc kép (ĐÃ ÁP DỤNG 2026-11-17).
-- Nội dung theo transcript gốc lib/full-tests/data/est-202{4,6}-test-*.json; thời gian căn lại cả bài.
-- Một transaction, mọi lệnh khoá giá trị cũ (thời gian so sai số < 0.005 vì là double), lệch là RAISE và huỷ toàn bộ.
-- Kèm EST 2026 Test 1 Q83-85 #4 (cùng lỗi tách tại "A.M.").
do $$
declare n int; l text;
begin
  -- transcript_full phai dung bang ghep cac cau hien tai (de dung lai sau khi sua)
  for l in select unnest(array['f16214a5-1f9e-4a5f-b148-4a355109ed6e','4cef06e0-7b02-44be-8ba4-e343946280f3','e25850bb-8489-4cf9-bdaf-7322afd5aed1','beb6093b-1e2e-42f9-a6d6-75a5be2d1fc0','c95ad590-10bd-4ea5-b893-566d85f62d6d','f370444b-f455-4ba4-8137-1a0ef5729b77','22bb891f-64b3-42b7-8faa-14b74ebbfd7f']) loop
    if (select transcript_full from lessons where id = l) is distinct from (select string_agg(coalesce(nullif(speaker,'')||': ','')||content, E'\n' order by order_index) from sentences where lesson_id = l) then raise exception 'transcript_full khong khop %', l; end if;
  end loop;
  delete from sentences where id = '2e1f8878-94ed-4bce-a200-05eb61b8c895' and content = 'on Monday.' and order_index = 3 and not exists (select 1 from blanks where sentence_id = '2e1f8878-94ed-4bce-a200-05eb61b8c895');
  get diagnostics n = row_count; if n <> 1 then raise exception 'del 2e1f8878 %', n; end if;
  delete from sentences where id = 'c5ecbd80-c720-4afa-8ab1-b90caf68c7e8' and content = 'M.' and order_index = 4 and not exists (select 1 from blanks where sentence_id = 'c5ecbd80-c720-4afa-8ab1-b90caf68c7e8');
  get diagnostics n = row_count; if n <> 1 then raise exception 'del c5ecbd80 %', n; end if;
  delete from sentences where id = '730d014d-645c-4d8d-b3fd-70fb4085f0dc' and content = 'M.' and order_index = 7 and not exists (select 1 from blanks where sentence_id = '730d014d-645c-4d8d-b3fd-70fb4085f0dc');
  get diagnostics n = row_count; if n <> 1 then raise exception 'del 730d014d %', n; end if;
  delete from sentences where id = 'a23c6b71-a77f-4a1e-8e35-d2d24a145188' and content = 'on Main Street.' and order_index = 2 and not exists (select 1 from blanks where sentence_id = 'a23c6b71-a77f-4a1e-8e35-d2d24a145188');
  get diagnostics n = row_count; if n <> 1 then raise exception 'del a23c6b71 %', n; end if;
  update sentences set content = 'All Cranbury residents should move their vehicles from their designated parking spots before eight A.M. on Monday.', start_time = 19.58, end_time = 26.69 where id = 'a8e773c1-83b0-4e47-962e-7149ab22bfd1' and content = 'M.' and abs(start_time - 20.67) < 0.005 and abs(end_time - 21.75) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd a8e773c1 %', n; end if;
  update sentences set order_index = 3, content = 'Any vehicle still in its spot after eight A.M. will be towed at the owner''s expense.', start_time = 26.53, end_time = 32.44 where id = '123de6cd-ea0b-4729-9dad-1fb64a122547' and order_index = 5 and content = 'will be towed at the owner''s expense.' and abs(start_time - 30.13) < 0.005 and abs(end_time - 33.8) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 123de6cd %', n; end if;
  update sentences set order_index = 4 where id = '481dc657-ffb9-4411-988d-4acfe020c54b' and order_index = 6;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 481dc657 %', n; end if;
  insert into sentences (id, lesson_id, order_index, content, start_time, end_time, speaker) values (gen_random_uuid()::text, '4cef06e0-7b02-44be-8ba4-e343946280f3', 9, 'In the system, if you click on that product, you''ll see a link that says, "Set Custom Alert."', 34.0, 39.89, 'M-CN');
  get diagnostics n = row_count; if n <> 1 then raise exception 'insert %', n; end if;
  update sentences set order_index = 10, content = 'And you can set it to any number from there.', start_time = 39.56, end_time = 42.28 where id = 'e4b9de38-c2cf-4d58-a4a6-7d19b69aa1df' and order_index = 9 and content = '" And you can set it to any number from there.' and abs(start_time - 38.75) < 0.005 and abs(end_time - 42.4) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd e4b9de38 %', n; end if;
  update sentences set order_index = 11 where id = '3ded0845-82ca-49df-b8bc-eb1451a03f7f' and order_index = 10;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 3ded0845 %', n; end if;
  update sentences set order_index = 12 where id = '445762ff-8bae-440c-a7a5-6971ca5faad6' and order_index = 11;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 445762ff %', n; end if;
  update sentences set content = 'We''ll open at eight A.M.', start_time = 31.27, end_time = 33.34 where id = '6256add0-a0b3-41d7-8ed6-bbd73c5e6fb8' and content = 'We''ll open at eight A.' and abs(start_time - 31.27) < 0.005 and abs(end_time - 36.03) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 6256add0 %', n; end if;
  update sentences set content = 'Just to confirm, the panel discussion begins at three P.M., right?', start_time = 24.26, end_time = 29.01 where id = '8c52ab4c-e379-4f86-a936-05a888527f03' and content = ', right?' and abs(start_time - 27.35) < 0.005 and abs(end_time - 28.4) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 8c52ab4c %', n; end if;
  update sentences set content = 'If you want it to be included in tomorrow morning''s newspaper, it has to be on my desk by nine P.M.', start_time = 10.69, end_time = 16.92 where id = '57c6d242-ca65-4355-a54f-3c46d96fe5e4' and content = 'M.' and abs(start_time - 11.78) < 0.005 and abs(end_time - 12.73) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 57c6d242 %', n; end if;
  update sentences set content = 'In local news, the much-anticipated holiday parade will be held downtown this Saturday, beginning promptly at ten A.M. on Main Street.', start_time = 10.06, end_time = 18.43 where id = '6e6d3f07-ac24-4269-91a0-40038e02fc24' and content = 'M.' and abs(start_time - 10.02) < 0.005 and abs(end_time - 11.04) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 6e6d3f07 %', n; end if;
  update sentences set order_index = 2, start_time = 18.37, end_time = 23.42 where id = 'ee4867d1-5427-4307-ae1c-1d84817344f7' and order_index = 3 and abs(start_time - 16.41) < 0.005 and abs(end_time - 21.95) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd ee4867d1 %', n; end if;
  update sentences set order_index = 3 where id = '2d16259d-2abc-44e7-b635-88a18a990e99' and order_index = 4;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 2d16259d %', n; end if;
  update sentences set order_index = 4 where id = 'ba107dae-2ed5-4113-92ba-685dde8fbc32' and order_index = 5;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd ba107dae %', n; end if;
  update sentences set content = 'Also, a reminder that the station café opens at eight A.M., and there are food kiosks on platform one.', start_time = 30.73, end_time = 38.64 where id = '71b9b0a5-11ac-484a-b454-b7a5005a7e43' and content = ', and there are food kiosks on platform one.' and abs(start_time - 35.0) < 0.005 and abs(end_time - 38.86) < 0.005;
  get diagnostics n = row_count; if n <> 1 then raise exception 'upd 71b9b0a5 %', n; end if;
  update blanks set position = 11 where sentence_id = '123de6cd-ea0b-4729-9dad-1fb64a122547' and position = 2 and answer = 'towed';
  get diagnostics n = row_count; if n <> 1 then raise exception 'blank towed %', n; end if;
  update blanks set position = 14 where sentence_id = '123de6cd-ea0b-4729-9dad-1fb64a122547' and position = 5 and answer = 'owner''s';
  get diagnostics n = row_count; if n <> 1 then raise exception 'blank owners %', n; end if;
  update blanks set position = 7 where sentence_id = 'e4b9de38-c2cf-4d58-a4a6-7d19b69aa1df' and position = 8 and answer = 'number';
  get diagnostics n = row_count; if n <> 1 then raise exception 'blank number %', n; end if;
  update blanks set position = 15 where sentence_id = '71b9b0a5-11ac-484a-b454-b7a5005a7e43' and position = 5 and answer = 'kiosks';
  get diagnostics n = row_count; if n <> 1 then raise exception 'blank kiosks %', n; end if;
  update blanks set position = 17 where sentence_id = '71b9b0a5-11ac-484a-b454-b7a5005a7e43' and position = 7 and answer = 'platform';
  get diagnostics n = row_count; if n <> 1 then raise exception 'blank platform %', n; end if;
  -- dung lai transcript_full tu cau da sua
  update lessons x set transcript_full = (select string_agg(coalesce(nullif(speaker,'')||': ','')||content, E'\n' order by order_index) from sentences where lesson_id = x.id) where x.id in ('f16214a5-1f9e-4a5f-b148-4a355109ed6e','4cef06e0-7b02-44be-8ba4-e343946280f3','e25850bb-8489-4cf9-bdaf-7322afd5aed1','beb6093b-1e2e-42f9-a6d6-75a5be2d1fc0','c95ad590-10bd-4ea5-b893-566d85f62d6d','f370444b-f455-4ba4-8137-1a0ef5729b77','22bb891f-64b3-42b7-8faa-14b74ebbfd7f');
  get diagnostics n = row_count; if n <> 7 then raise exception 'transcript %', n; end if;
end $$;
