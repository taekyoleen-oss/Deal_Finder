export const DEDUP_SYSTEM = `두 이벤트가 같은 행사인지 판정하세요. JSON으로만 응답.`

export function buildDedupPrompt(eventA: object, eventB: object): string {
  return `[판정 기준]
필수 (하나라도 불일치 시 same=false):
- 브랜드/주최가 동일

조건부 (정보가 없는 항목은 제외하고 나머지로 판단):
- 혜택 내용이 실질적으로 동일 (할인율·증정품·쿠폰 유형)
- 이벤트 기간이 동일하거나 겹침 (며칠 차이 허용)
- 적용 대상·지역이 동일 (전국 vs 특정 지점은 다른 이벤트)
- 같은 카테고리/소분류

판정 규칙:
1. 브랜드가 다르면 즉시 same=false
2. 브랜드 일치 + 조건부 항목 3개 이상 일치(또는 정보 부족으로 판단 불가) → same=true
3. 이벤트명이 거의 같고 브랜드가 같으면 same=true로 추정

[출력]
{
  "same": boolean,
  "reason": string
}

[입력]
A: ${JSON.stringify(eventA)}
B: ${JSON.stringify(eventB)}`
}
