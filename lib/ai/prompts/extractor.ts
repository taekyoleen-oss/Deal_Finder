import type { Brand } from '@/types/domain'

export const EXTRACTOR_SYSTEM = `당신은 한국 시장 이벤트·할인행사 분류기입니다.
입력된 텍스트를 보고 아래 JSON 스키마로만 응답하세요. 설명·코드펜스 금지.`

export function buildExtractorPrompt(params: {
  title: string
  body: string
  url: string
  sourceName: string
  mediaTier: string
  today: string
  brandCandidates: Pick<Brand, 'id' | 'name' | 'aliases'>[]
}): string {
  return `[판정 기준]
- 일반 사용자가 "행동(예약·구매·신청)"을 통해 구체적 혜택을 받을 수 있어야 is_event=true
- 단순 신제품 소개, 일반 광고, 후기, 의견, 정치성 기사는 false
- 기간이 이미 지난 행사는 false (오늘 기준 ends_at < today)
- 출처가 의심스럽거나 정보가 부족하면 confidence < 0.5
- 협찬·광고성 기사(PR 기사, 유료광고 기사)이면 is_promotional_content=true

[대분류 enum]
lodging | travel | sports | fashion | beauty | electronics | food |
kids | public | finance | subscription | culture | education |
mobility | pet | home | shopping | health | other

[태그 enum]
free_trial | trade_in | seasonal_sale | discount_percent | discount_amount |
bogo | coupon | pre_order | new_launch | membership_perk | mileage_event |
lottery | public_subsidy | festival_event | region_limited | target_limited | other

[discount_type enum]
free | percent | amount | buy_one_get_one | trade_in | other | null

[출력 스키마]
{
  "is_event": boolean,
  "confidence": number,
  "category": string,
  "subcategory": string | null,
  "tags": string[],
  "brand": string | null,
  "brand_id": string | null,
  "title": string,
  "summary_raw": string,
  "discount_type": string | null,
  "discount_value": string | null,
  "starts_at": "YYYY-MM-DD" | null,
  "ends_at": "YYYY-MM-DD" | null,
  "is_ongoing": boolean,
  "regions": string[],
  "is_promotional_content": boolean,
  "promotional_reason": string | null,
  "exclusion_reason": string | null
}

[입력]
원문 제목: ${params.title}
원문 본문: ${params.body}
원문 URL: ${params.url}
출처: ${params.sourceName}
매체 등급: ${params.mediaTier}
오늘 날짜: ${params.today}
brand_candidates: ${JSON.stringify(params.brandCandidates.map(b => ({ id: b.id, name: b.name, aliases: b.aliases })))}`
}
