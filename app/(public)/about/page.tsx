import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '딜레이더의 서비스 범위와 수집 정책을 안내합니다.',
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">딜레이더란?</h1>

      <section className="space-y-4 text-sm leading-relaxed mb-8">
        <p>
          딜레이더는 AI가 국내 뉴스를 분석해 <strong>행사·할인·공공지원금</strong> 정보를
          자동으로 수집하고 카드 형태로 정리해주는 읽기 전용 공개 게시판입니다.
        </p>
        <p>
          매주 월요일·목요일에 네이버 뉴스 API를 통해 수집된 기사를 AI가 분석하여
          실제 혜택이 있는 이벤트를 선별하고, 핵심 내용을 카드로 요약합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">수집 범위</h2>
        <div
          className="rounded-[var(--radius)] border p-4 space-y-2 text-sm"
          style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <p className="font-medium" style={{ color: 'var(--success)' }}>✅ 포함되는 정보</p>
          <ul className="space-y-1 ml-4">
            <li>• 뉴스 보도된 할인 행사 및 이벤트</li>
            <li>• 뉴스 보도된 공공지원금·정부 혜택 프로그램</li>
            <li>• 뉴스 보도된 카드사·금융 혜택</li>
            <li>• 뉴스 보도된 문화·스포츠·여행 프로모션</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <div
          className="rounded-[var(--radius)] border p-4 space-y-2 text-sm"
          style={{ background: 'rgba(220,38,38,0.05)', borderColor: 'var(--destructive)' }}
        >
          <p className="font-medium" style={{ color: 'var(--destructive)' }}>⚠️ 수집 범위 외 항목</p>
          <ul className="space-y-1 ml-4" style={{ color: 'var(--foreground)' }}>
            <li>• 카드사 앱 푸시 단독 혜택 (뉴스 미보도)</li>
            <li>• 회원전용 쿠폰·멤버십 단독 혜택</li>
            <li>• 소규모 브랜드 단발 행사 (뉴스 미보도)</li>
            <li>• 오프라인 매장 한정 행사</li>
          </ul>
          <p className="mt-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
            뉴스에 보도되지 않은 혜택은 자동 수집이 불가합니다.
            관련 뉴스가 있다면 해당 매체에서 직접 확인하세요.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">정보 정확성</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
          딜레이더는 AI가 뉴스를 자동 분석하므로 일부 정보가 부정확하거나 기간이 맞지 않을 수 있습니다.
          중요한 혜택은 반드시 원문 출처를 확인하세요. 오류를 발견하셨다면 이벤트 상세 페이지
          하단의 &quot;부정확한 정보 알리기&quot; 버튼을 통해 알려주세요.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">저작권</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
          딜레이더는 뉴스 본문을 발췌(100자 이내)하여 요약 목적으로만 사용하며,
          항상 원문 출처 링크를 함께 표시합니다.
        </p>
      </section>
    </div>
  )
}
