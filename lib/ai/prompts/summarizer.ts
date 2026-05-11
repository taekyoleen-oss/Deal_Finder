import type { ExtractorOutput } from '@/types/domain'

export const SUMMARIZER_SYSTEM = `다음 이벤트 정보를 게시판 카드 형태로 노출할 한국어 콘텐츠를 작성하세요.
JSON으로만 응답. 설명·코드펜스 금지.`

export function buildSummarizerPrompt(extracted: ExtractorOutput, today: string): string {
  return `[원칙]
- title: 한 줄 핵심. "{브랜드} {무엇을} {언제까지}" 형식, 30자 이내
- summary: 2~3 문장. 누가 받을 수 있는지 / 어떻게 받는지 핵심
- key_points: 3~5개 bullet. 각 항목은 한 줄(40자 이내), 사실만
  - 시작일·종료일 외에 알아야 할 핵심 정보를 항목별로 분리
  - 예: 적용 대상, 신청 방법, 할인 내용, 제외 조건, 행사 장소, 동반 혜택
- 과장·이모지 남발 금지. 사실 위주
- 정보가 불충분한 항목은 key_points에 포함하지 말 것

[출력 스키마]
{
  "title": string,
  "summary": string,
  "key_points": string[]
}

[입력]
${JSON.stringify(extracted, null, 2)}
오늘 날짜: ${today}`
}
