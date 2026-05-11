import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Server client — anon key, for SSR public pages
// RLS still enforced: only published/completed events readable
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
