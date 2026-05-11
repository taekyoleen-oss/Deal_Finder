-- DealRadar 소스 + 키워드 시드

insert into sources (name, url, tier, config, is_active) values
(
  '네이버 뉴스 — 쇼핑·할인',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "할인 이벤트", "특가 행사", "세일 기간", "쿠폰 증정",
    "사전예약 혜택", "1+1 행사", "무료체험 이벤트", "신규가입 혜택",
    "멤버십 할인", "포인트 적립 이벤트"
  ]}',
  true
),
(
  '네이버 뉴스 — 숙박·여행',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "호텔 할인 이벤트", "리조트 특가", "항공권 특가", "여행 패키지 할인",
    "숙박 쿠폰", "펜션 할인", "에어비앤비 프로모션", "크루즈 특가"
  ]}',
  true
),
(
  '네이버 뉴스 — 스포츠·레저',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "골프 할인 이벤트", "골프장 특가", "스포츠 용품 세일",
    "피트니스 등록 이벤트", "스키장 할인", "테니스 이벤트"
  ]}',
  true
),
(
  '네이버 뉴스 — 패션·뷰티',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "패션 세일 이벤트", "뷰티 할인 행사", "스킨케어 프로모션",
    "화장품 특가", "의류 할인", "명품 세일", "아울렛 행사"
  ]}',
  true
),
(
  '네이버 뉴스 — 가전·IT',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "가전 할인 이벤트", "스마트폰 출시 혜택", "노트북 특가",
    "TV 할인 행사", "삼성 이벤트", "LG 프로모션", "애플 행사"
  ]}',
  true
),
(
  '네이버 뉴스 — 식품·외식',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "배달 할인 이벤트", "음식점 프로모션", "식품 특가",
    "편의점 행사", "치킨 이벤트", "피자 할인", "카페 쿠폰"
  ]}',
  true
),
(
  '네이버 뉴스 — 금융',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "카드 혜택 이벤트", "신용카드 출시 혜택", "적금 특판",
    "은행 이벤트", "카카오뱅크 이벤트", "토스 혜택", "핀테크 프로모션"
  ]}',
  true
),
(
  '네이버 뉴스 — 공공지원',
  'https://search.naver.com/search.naver?where=news',
  'major',
  '{"keywords": [
    "청년 지원금", "정부 지원 사업", "공공지원 신청", "복지 혜택",
    "주거 지원", "청년 주택", "취업 지원금", "창업 지원금",
    "지자체 혜택", "지역 지원금"
  ]}',
  true
),
(
  '네이버 뉴스 — 문화·구독',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "OTT 할인 이벤트", "넷플릭스 프로모션", "구독 할인",
    "공연 할인", "전시 무료입장", "영화 이벤트", "게임 이벤트"
  ]}',
  true
),
(
  '네이버 뉴스 — 통합 키워드',
  'https://search.naver.com/search.naver?where=news',
  'minor',
  '{"keywords": [
    "기간 한정 이벤트", "선착순 혜택", "회원 전용 혜택",
    "앱 다운로드 혜택", "출시 기념 이벤트", "주년 기념 이벤트"
  ]}',
  true
);
