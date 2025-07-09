'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@mui/joy'
import { useEffect, useState } from 'react'

export default function DiscordLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
      setError('Supabase URL not configured')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
      setError('Supabase API key not configured')
    }
  }, [])

  const handleDiscordLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      })

      console.log('Starting Discord OAuth...')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      console.log('Discord OAuth response:', { data, error })

      if (error) {
        console.error('Discord login error:', error)
        setError(error.message)
        throw error
      }
    } catch (error: any) {
      console.error('Failed to login with Discord:', error)
      setError(error?.message || 'Discord login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Button
        variant="outlined"
        size="lg"
        fullWidth
        onClick={handleDiscordLogin}
        loading={isLoading}
        disabled={isLoading || !!error}
      >
        🔗 {isLoading ? 'Connecting...' : 'Login with Discord'}
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {error}
        </div>
      )}
    </div>
  )
} 