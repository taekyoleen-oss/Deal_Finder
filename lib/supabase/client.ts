import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Browser client — anon key, RLS enforced (published/completed events only)
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
