'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Category } from '@/types/domain'

interface Props {
  categories: (Category & { count?: number })[]
  subcategories?: (Category & { count?: number })[]
  activeCategorySlug?: string
  activeSubcategorySlug?: string
}

export function CategoryNav({ categories, subcategories, activeCategorySlug, activeSubcategorySlug }: Props) {
  return (
    <div>
      {/* Main category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        <CategoryTab href="/" label="전체" active={!activeCategorySlug} />
        {categories.map(cat => (
          <CategoryTab
            key={cat.id}
            href={`/category/${cat.slug}`}
            label={cat.count !== undefined ? `${cat.name}(${cat.count})` : cat.name}
            active={cat.slug === activeCategorySlug}
          />
        ))}
      </div>

      {/* Subcategory chips */}
      {subcategories && subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-2 scrollbar-hide">
          <CategoryChip
            href={activeCategorySlug ? `/category/${activeCategorySlug}` : '/'}
            label="전체"
            active={!activeSubcategorySlug}
          />
          {subcategories.map(sub => (
            <CategoryChip
              key={sub.id}
              href={`/category/${activeCategorySlug}/${sub.slug}`}
              label={sub.name}
              active={sub.slug === activeSubcategorySlug}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: active ? 'var(--primary)' : 'var(--muted)',
        color: active ? 'var(--primary-fg)' : 'var(--foreground)',
      }}
    >
      {label}
    </Link>
  )
}

function CategoryChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap px-3 py-1 rounded-full text-xs transition-colors border"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'white' : 'var(--muted-fg)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
    >
      #{label}
    </Link>
  )
}
