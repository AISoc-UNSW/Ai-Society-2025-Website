'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DiscordCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    if (code) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/v1/auth/discord/callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          console.log('Discord login success:', data)
          localStorage.setItem('user', JSON.stringify(data))
          router.push('/tasks') // Redirect to tasks page after successful login
        })
        .catch(err => {
          console.error('Discord login error:', err)
          router.push('/login?error=discord')
        })
    }
  }, [code])

  return (
    <div className="p-4 text-center">
      Logging in with Discord...
    </div>
  )
}