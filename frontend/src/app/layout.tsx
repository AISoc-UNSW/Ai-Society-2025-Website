import type { Metadata } from 'next'
import { CssBaseline, CssVarsProvider } from '@mui/joy'

export const metadata: Metadata = {
  title: 'AI Society 2025 Website',
  description: 'AI Society task management dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* MUI Joy UI Provider - Only for internal dashboard */}
        <CssVarsProvider
          // Disable default dark mode to avoid conflicts with Tailwind
          disableTransitionOnChange
          // Ensure style isolation
          defaultMode="light"
        >
          <CssBaseline />
          {children}
        </CssVarsProvider>
      </body>
    </html>
  )
} 