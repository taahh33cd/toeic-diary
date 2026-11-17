-- Hoàn tác fix-held-est2024.sql
update sentences s set start_time = v.os, end_time = v.oe from (values
  ('4671ea77-0a07-4ab1-b9f5-6ac97887ef13', 32.88::float8, 40.36::float8), ('cd3979e2-0bd6-4574-8764-313d6bbfe575', 39.71, 48.4),
  ('25f6ed2a-9938-4056-8f8d-905956d0c98f', 5.75, 7.15), ('a821933b-0e0d-409b-a6e6-1e1ccf842e95', 6.5, 11.63)) v(id, os, oe)
 where s.id = v.id;
