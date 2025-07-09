'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export default function AuthDebugger() {
  const [authState, setAuthState] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      // Get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      // Get user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      setAuthState({
        session: {
          data: sessionData,
          error: sessionError
        },
        user: {
          data: userData,
          error: userError
        },
        cookies: document.cookie,
        localStorage: {
          keys: Object.keys(localStorage || {}),
          supabaseKeys: Object.keys(localStorage || {}).filter(key =>
            key.includes('supabase') || key.includes('auth')
          )
        }
      })

      setUser(userData.user)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, session })
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg max-w-md text-xs max-h-96 overflow-auto z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>

      <div className="mb-2">
        <strong>User:</strong> {user ? user.email : 'Not logged in'}
      </div>

      <div className="mb-2">
        <strong>Session:</strong> {authState?.session?.data?.session ? 'Active' : 'None'}
      </div>

      <details className="mb-2">
        <summary className="cursor-pointer">Full Auth State</summary>
        <pre className="mt-2 text-xs overflow-auto max-h-32">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </details>

      <details>
        <summary className="cursor-pointer">Environment</summary>
        <div className="mt-2 text-xs">
          <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</div>
          <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
        </div>
      </details>
    </div>
  )
} 