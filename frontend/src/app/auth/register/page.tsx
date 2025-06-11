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
import { createUser } from "@/lib/api/user"
import { redirect } from "next/navigation"

async function handleRegister(formData: FormData) {
  'use server'
  
  const email = formData.get('email') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  try {
    await createUser(email, username, password)
    redirect('/auth/login')
  } catch (error) {
    console.error('Registration failed:', error)
    throw error
  }
}

export default function RegisterPage() {
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
              Register
            </Typography>
            <Typography level="body-sm" textAlign="center" color="neutral">
              Create a new account to access the dashboard
            </Typography>
          </Stack>

          <form action={handleRegister}>
            <Stack spacing={2}>
              <FormControl required>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  placeholder="Enter your email"
                  type="email"
                />
              </FormControl>

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
                  placeholder="Create a password"
                  type="password"
                />
              </FormControl>

              <Button
                type="submit"
                size="lg"
                fullWidth
                sx={{ mt: 2 }}
              >
                Register
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
            🔗 Register with Discord
          </Button>

          <Typography level="body-sm" textAlign="center">
            Already have an account?{" "}
            <Link component={NextLink} href="/auth/login">
              Log In
            </Link>
          </Typography>
        </Stack>
      </Card>
    </Box>
  )
} 