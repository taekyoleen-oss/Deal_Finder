'use client'

const KEY = 'dealradar_viewed'
const MAX_STORED = 500

export function getViewedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function markAsViewed(id: string): void {
  if (typeof window === 'undefined') return
  const ids = getViewedIds()
  ids.add(id)
  const arr = Array.from(ids).slice(-MAX_STORED)
  try {
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch {
    // localStorage full — ignore
  }
}

export function isViewed(id: string): boolean {
  return getViewedIds().has(id)
}
