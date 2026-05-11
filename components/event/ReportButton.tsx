'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import type { ReportReasonType } from '@/types/database'

const REASONS: { value: ReportReasonType; label: string }[] = [
  { value: 'ended', label: '이미 종료된 이벤트입니다' },
  { value: 'promotional', label: '광고/협찬 기사입니다' },
  { value: 'wrong_period', label: '기간 정보가 틀렸습니다' },
  { value: 'wrong_category', label: '카테고리가 잘못됐습니다' },
  { value: 'other', label: '기타' },
]

interface Props {
  eventId: string
}

export function ReportButton({ eventId }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReasonType>('other')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit() {
    setStatus('sending')
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, reason_type: reason, message: message || undefined }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-center" style={{ color: 'var(--success)' }}>
        제보해주셔서 감사합니다. 검토 후 반영하겠습니다.
      </p>
    )
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs hover:underline"
          style={{ color: 'var(--muted-fg)' }}
        >
          <Flag size={12} />
          부정확한 정보 알리기
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">신고 유형을 선택해주세요</p>
          <div className="space-y-1.5">
            {REASONS.map(r => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-[var(--primary)]"
                />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 200))}
            placeholder="추가 설명 (선택, 200자 이내)"
            rows={2}
            className="w-full text-sm p-2 rounded border resize-none outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={status === 'sending'}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
            >
              {status === 'sending' ? '전송 중...' : '제보하기'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
            >
              취소
            </button>
          </div>
          {status === 'error' && (
            <p className="text-xs" style={{ color: 'var(--destructive)' }}>
              제보 전송에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
