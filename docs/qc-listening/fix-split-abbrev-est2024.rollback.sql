-- Hoàn tác fix-split-abbrev-est2024.sql (trả nội dung, mốc thời gian, blanks, transcript_full về như cũ).
begin;
update sentences set content = ', will be arriving shortly.', start_time = 23.48, end_time = 27.04 where id = 'c32b989d-b231-4d96-b28c-deac22cf0ead';
update blanks set position = 3 where sentence_id = 'c32b989d-b231-4d96-b28c-deac22cf0ead' and answer = 'arriving';
update sentences set end_time = 37.83 where id = 'a9750255-5255-4f4c-b917-89b2a61f12cd';
update sentences set content = 'C.', start_time = 43.28, end_time = 44.4 where id = 'd65654ab-47ea-42a7-83a7-bd959d15a09c';
update lessons set transcript_full = replace(replace(transcript_full,
    E'W-BR: Train 133 with service to Washington, D.C., will be arriving shortly.', E'W-BR: , will be arriving shortly.'),
    E'\nW-BR: Train 133''s next stop will be Wilmington, followed by Baltimore and then Washington, D.C.', E'\nW-BR: C.')
 where id = '557a4a2f-37cd-4e83-b3ab-05d99f6a0649';

update sentences set order_index = 6, start_time = 39.67, end_time = 44.4 where id = '57b6d73a-a8be-4ae3-84bb-24ceb5f07bc2';
update sentences set content = 'today so that exhibitors can attend this evening''s reception.', order_index = 5, start_time = 35.59, end_time = 40.32
 where id = '299845e9-0824-4031-b631-d47278e171f7';
update blanks set position = position - 10 where sentence_id = '299845e9-0824-4031-b631-d47278e171f7' and position in (13, 15);
insert into sentences (id, lesson_id, order_index, content, start_time, end_time, speaker, option_label)
 values ('0b294774-4626-4564-8283-0d432844314d', '89ee239c-dd20-41f3-82a4-b4dde5898453', 4, 'M.', 31.51, 32.61, null, null);
update lessons set transcript_full = replace(transcript_full,
    E'\nAnd remember, the exhibit hall will close at five P.M. today so that exhibitors can attend this evening''s reception.',
    E'\nM.\ntoday so that exhibitors can attend this evening''s reception.')
 where id = '89ee239c-dd20-41f3-82a4-b4dde5898453';

update sentences set end_time = 8.94 where id = '7e951c4c-b70e-4f75-bdeb-5c36ed8debea';
update sentences set content = 'M.', start_time = 8.29, end_time = 9.33 where id = '364db49a-ac22-42a4-91b5-6a4740d5be54';
update lessons set transcript_full = replace(transcript_full,
    E'\nW-AM: I''m scheduled to offer some samples of our new vegetable chips to your customers from three to five P.M.\n', E'\nW-AM: M.\n')
 where id = '9881eade-b184-474c-94c7-c17d71ee6081';

update sentences set content = 'M.', start_time = 12.28, end_time = 13.38 where id = '1e4f6018-ddb2-4fbd-b3d8-d8caa0fccade';
update lessons set transcript_full = replace(transcript_full, E'\nM-AU: The concert was scheduled to begin at eight P.M.\n', E'\nM-AU: M.\n')
 where id = '07865bf2-0708-4beb-875e-9d1f31e4e897';
commit;
