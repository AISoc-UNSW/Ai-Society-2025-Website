import { 
  Box, 
  Button, 
  Card, 
  Divider, 
  FormControl, 
  FormLabel, 
  Input, 
  Link, 
  Stack, 
  Typography 
} from "@mui/joy"
import NextLink from "next/link"
import { loginUser } from "@/lib/api/user"
import { setAuthToken } from "@/lib/session"
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

export default function LoginPage() {
  return (
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

          <Button
            variant="outlined"
            size="lg"
            fullWidth
            component="a"
            href="/taskbot/dashboard"
          >
            🔗 Login with Discord
          </Button>

          <Typography level="body-sm" textAlign="center">
            Don&apos;t have an account?{" "}
            <Link component={NextLink} href="/auth/register">
              Sign Up
            </Link>
          </Typography>
        </Stack>
      </Card>
    </Box>
  )
} 