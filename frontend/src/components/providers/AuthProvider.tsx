'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/types'
import { useUserStore } from '@/stores/userStore'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: SupabaseUser | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => { },
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { setUser: setStoreUser, logout: logoutStore } = useUserStore()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        // Convert Supabase user to your app's user format
        const appUser: User = {
          id: parseInt(session.user.id) || 0,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Discord User',
          email: session.user.email || '',
          discord_id: session.user.user_metadata?.provider_id || null,
          avatar: session.user.user_metadata?.avatar_url || null,
          role: null, // You may need to fetch this from your backend
          portfolio: null,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
        }
        setStoreUser(appUser)
      }

      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          // Convert and update user in store
          const appUser: User = {
            id: parseInt(session.user.id) || 0,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Discord User',
            email: session.user.email || '',
            discord_id: session.user.user_metadata?.provider_id || null,
            avatar: session.user.user_metadata?.avatar_url || null,
            role: null,
            portfolio: null,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at,
          }
          setStoreUser(appUser)
        } else {
          logoutStore()
        }

        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, setStoreUser, logoutStore])

  const signOut = async () => {
    await supabase.auth.signOut()
    logoutStore()
  }

  const value = {
    user,
    isLoading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 