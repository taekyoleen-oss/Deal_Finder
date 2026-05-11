-- DealRadar 카테고리 시드
-- 18개 대분류 + 소분류

insert into categories (slug, name, parent_id, display_order, is_active) values
-- 대분류
('lodging',      '숙박',    null, 1,  true),
('travel',       '여행',    null, 2,  true),
('sports',       '스포츠',  null, 3,  true),
('fashion',      '패션',    null, 4,  true),
('beauty',       '뷰티',    null, 5,  true),
('electronics',  '가전',    null, 6,  true),
('food',         '식품',    null, 7,  true),
('kids',         '육아',    null, 8,  true),
('public',       '공공지원', null, 9,  true),
('finance',      '금융',    null, 10, true),
('subscription', '구독',    null, 11, true),
('culture',      '문화',    null, 12, true),
('education',    '교육',    null, 13, true),
('mobility',     '모빌리티', null, 14, true),
('pet',          '반려동물', null, 15, true),
('home',         '홈리빙',  null, 16, true),
('shopping',     '쇼핑',    null, 17, true),
('health',       '건강',    null, 18, true);

-- 소분류 (parent_id 는 대분류 slug로 참조 — 실제 uuid로 변경 필요)
-- 스포츠 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select
  sub.slug, sub.name,
  c.id,
  sub.ord,
  true
from (values
  ('golf',       '골프',    1),
  ('tennis',     '테니스',  2),
  ('running',    '러닝',    3),
  ('fishing',    '낚시',    4),
  ('hiking',     '등산',    5),
  ('soccer',     '축구',    6),
  ('baseball',   '야구',    7),
  ('basketball', '농구',    8),
  ('swimming',   '수영',    9),
  ('cycling',    '사이클',  10),
  ('yoga',       '요가',    11),
  ('fitness',    '피트니스', 12),
  ('ski',        '스키',    13),
  ('climbing',   '클라이밍', 14),
  ('board_surf', '서핑·보드', 15)
) as sub(slug, name, ord)
join categories c on c.slug = 'sports';

-- 숙박 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('hotel',   '호텔',    1),
  ('resort',  '리조트',  2),
  ('pension', '펜션·숙소', 3),
  ('camping', '캠핑',    4),
  ('airbnb',  '에어비앤비', 5)
) as sub(slug, name, ord)
join categories c on c.slug = 'lodging';

-- 여행 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('flight',       '항공권',   1),
  ('package_tour', '패키지여행', 2),
  ('domestic',     '국내여행',  3),
  ('overseas',     '해외여행',  4),
  ('cruise',       '크루즈',   5)
) as sub(slug, name, ord)
join categories c on c.slug = 'travel';

-- 패션 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('clothing',  '의류',   1),
  ('shoes',     '신발',   2),
  ('bag',       '가방',   3),
  ('luxury',    '명품',   4),
  ('sports_wear', '스포츠웨어', 5),
  ('kids_wear', '아동복',  6)
) as sub(slug, name, ord)
join categories c on c.slug = 'fashion';

-- 가전 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('mobile',    '스마트폰', 1),
  ('laptop',    '노트북',  2),
  ('tv',        'TV·디스플레이', 3),
  ('appliance', '생활가전', 4),
  ('audio',     '음향기기', 5),
  ('wearable',  '웨어러블', 6),
  ('camera',    '카메라',  7)
) as sub(slug, name, ord)
join categories c on c.slug = 'electronics';

-- 식품 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('delivery',    '배달·외식',  1),
  ('grocery',     '식료품',    2),
  ('beverage',    '음료·주류',  3),
  ('health_food', '건강식품',   4),
  ('subscription_box', '정기배송', 5)
) as sub(slug, name, ord)
join categories c on c.slug = 'food';

-- 공공지원 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('youth',      '청년지원',  1),
  ('housing',    '주거지원',  2),
  ('employment', '취업·창업', 3),
  ('welfare',    '복지·돌봄', 4),
  ('local_gov',  '지자체혜택', 5),
  ('startup',    '스타트업',  6)
) as sub(slug, name, ord)
join categories c on c.slug = 'public';

-- 금융 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('card',     '카드',    1),
  ('savings',  '저축·예금', 2),
  ('loan',     '대출',    3),
  ('insurance','보험',    4),
  ('investment','투자',   5),
  ('fintech',  '핀테크',  6)
) as sub(slug, name, ord)
join categories c on c.slug = 'finance';

-- 문화 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('concert',   '공연·콘서트', 1),
  ('exhibition','전시',       2),
  ('movie',     '영화',       3),
  ('book',      '도서',       4),
  ('game',      '게임',       5),
  ('streaming', 'OTT·스트리밍', 6)
) as sub(slug, name, ord)
join categories c on c.slug = 'culture';

-- 뷰티 소분류
insert into categories (slug, name, parent_id, display_order, is_active)
select sub.slug, sub.name, c.id, sub.ord, true
from (values
  ('skincare',  '스킨케어',  1),
  ('makeup',    '메이크업',  2),
  ('haircare',  '헤어케어',  3),
  ('perfume',   '향수',     4),
  ('clinic',    '피부·성형', 5)
) as sub(slug, name, ord)
join categories c on c.slug = 'beauty';
