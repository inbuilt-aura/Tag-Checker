import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function getAuthenticatedUser(request?: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      // If we have a request, try to get token from Authorization header
      if (request) {
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const { data: tokenData, error: tokenError } = await supabase.auth.getUser(token)
          if (!tokenError && tokenData.user) {
            return { user: tokenData.user, error: null }
          }
        }
      }
      return { user: null, error: error || new Error('No authenticated user') }
    }
    
    return { user, error: null }
  } catch (err) {
    return { user: null, error: err as Error }
  }
}

export function createAuthenticatedSupabaseClient() {
  return createRouteHandlerClient({ cookies })
}
