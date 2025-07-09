import AuthDebugger from "@/components/auth/AuthDebugger"
import DiscordLogin from "@/components/auth/DiscordLogin"
import { loginUser } from "@/lib/api/user"
import { setAuthToken } from "@/lib/session"
import {
  Alert,
  Box,
  Button,
  Card,
  CssBaseline,
  CssVarsProvider,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Link,
  Stack,
  Typography
} from "@mui/joy"
import NextLink from "next/link"
import { redirect } from "next/navigation"

async function handleLogin(formData: FormData) {
  'use server'

  const username = formData.get('username') as string
  const password = formData.get('password') as string

  try {
    const response = await loginUser({ username, password })
    await setAuthToken(response.access_token)
    redirect('/taskbot/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; message?: string }
}) {
  const errorMessage = searchParams?.error
  const errorDetails = searchParams?.message

  return (
    <>
      <CssVarsProvider disableTransitionOnChange>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.surface',
            p: 2,
          }}
        >
          <Card
            variant="outlined"
            sx={{
              maxWidth: 400,
              width: '100%',
              p: 3,
            }}
          >
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography level="h3" textAlign="center">
                  Login
                </Typography>
                <Typography level="body-sm" textAlign="center" color="neutral">
                  Enter your credentials to access your account
                </Typography>
              </Stack>

              {errorMessage && (
                <Alert color="danger" variant="soft">
                  <Typography level="body-sm">
                    <strong>Authentication Error:</strong> {errorMessage}
                    {errorDetails && (
                      <div style={{ marginTop: 4 }}>
                        {errorDetails}
                      </div>
                    )}
                  </Typography>
                </Alert>
              )}

              <form action={handleLogin}>
                <Stack spacing={2}>
                  <FormControl required>
                    <FormLabel>Username</FormLabel>
                    <Input
                      name="username"
                      placeholder="Enter your username"
                      type="text"
                    />
                  </FormControl>

                  <FormControl required>
                    <FormLabel>Password</FormLabel>
                    <Input
                      name="password"
                      placeholder="Enter your password"
                      type="password"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Login
                  </Button>
                </Stack>
              </form>

              <Divider>Or continue with</Divider>

              <DiscordLogin />

              <Typography level="body-sm" textAlign="center">
                Don&apos;t have an account?{" "}
                <Link component={NextLink} href="/auth/register">
                  Sign Up
                </Link>
              </Typography>
            </Stack>
          </Card>
        </Box>
      </CssVarsProvider>

      {/* Debug component - only shows in development */}
      <AuthDebugger />
    </>
  )
} 