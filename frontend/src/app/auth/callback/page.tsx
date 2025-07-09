import { setAuthToken } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string; error?: string; error_description?: string }
}) {
  const supabase = await createClient()

  console.log('Auth callback received:', {
    code: searchParams.code ? 'present' : 'missing',
    error: searchParams.error,
    error_description: searchParams.error_description
  })

  // Handle OAuth errors from Discord
  if (searchParams.error) {
    console.error('OAuth error from provider:', {
      error: searchParams.error,
      description: searchParams.error_description
    })

    const loginUrl = new URL('/auth/login', 'http://localhost:3000')
    loginUrl.searchParams.set('error', `oauth_error: ${searchParams.error}`)
    loginUrl.searchParams.set('message', searchParams.error_description || 'OAuth authentication failed')
    redirect(loginUrl.toString())
  }

  // Handle successful OAuth with code
  if (searchParams.code) {
    console.log('Exchanging code for session...')

    const { data, error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    console.log('Exchange result:', {
      success: !error,
      error: error?.message,
      session: data?.session ? 'created' : 'not created',
      user: data?.user ? 'present' : 'missing'
    })

    if (error) {
      console.error('Failed to exchange code for session:', error)

      const loginUrl = new URL('/auth/login', 'http://localhost:3000')
      loginUrl.searchParams.set('error', 'session_exchange_failed')
      loginUrl.searchParams.set('message', error.message)
      redirect(loginUrl.toString())
    }

    if (data?.session && data?.user) {
      console.log('Authentication successful, user:', {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
        provider: data.user.app_metadata?.provider
      })

      // Sync user data with your backend and get backend token
      try {
        console.log('Syncing Discord user with backend...')

        const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        // Prepare user data for backend sync
        const discordUserData = {
          discord_id: data.user.user_metadata?.provider_id || data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          avatar_url: data.user.user_metadata?.avatar_url,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.username
        }

        console.log('Sending user data to backend:', discordUserData)

        // Call your backend to create/login the Discord user
        const syncResponse = await fetch(`${backendApiUrl}/api/v1/auth/discord/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(discordUserData),
        })

        console.log('Backend sync response status:', syncResponse.status)

        if (syncResponse.ok) {
          const backendData = await syncResponse.json()
          console.log('Backend sync successful:', {
            hasToken: !!backendData.access_token,
            tokenType: backendData.token_type
          })

          // Store the backend token
          if (backendData.access_token) {
            await setAuthToken(backendData.access_token)
            console.log('Backend token stored successfully')
          }
        } else {
          const errorText = await syncResponse.text()
          console.error('Backend sync failed:', syncResponse.status, errorText)

          // Still proceed with login even if backend sync fails
          console.warn('Proceeding with login despite backend sync failure')
        }
      } catch (syncError) {
        console.error('Failed to sync with backend:', syncError)
        // Still proceed with login even if backend sync fails
        console.warn('Proceeding with login despite backend sync error')
      }

      console.log('Redirecting to dashboard...')
      redirect('/taskbot/dashboard')
    }
  }

  // If we reach here, something went wrong
  console.error('Auth callback completed without success - no code or session')

  const loginUrl = new URL('/auth/login', 'http://localhost:3000')
  loginUrl.searchParams.set('error', 'authentication_incomplete')
  loginUrl.searchParams.set('message', 'Authentication process was incomplete')
  redirect(loginUrl.toString())
} 