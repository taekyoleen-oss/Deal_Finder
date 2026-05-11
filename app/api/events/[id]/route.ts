import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServerClient()

  const { data, error } = await db
    .from('events')
    .select(`
      *,
      category:categories!category_id(*),
      subcategory:categories!subcategory_id(*),
      brand:brands(*),
      tags:event_tags(tag:tags(*)),
      sources:event_sources(*)
    `)
    .eq('id', id)
    .in('status', ['published', 'completed'])
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
