"use client";

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
  Typography,
} from "@mui/joy";
import NextLink from "next/link";
import { useEffect, useState, useTransition } from "react";

interface RegisterClientProps {
  registerAction: (formData: FormData) => Promise<void>;
}

export default function RegisterClient({ registerAction }: RegisterClientProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (formData: FormData) => {
    setError(null);

    startTransition(async () => {
      try {
        await registerAction(formData);
      } catch (err) {
        // Check if it's a Next.js redirect error
        if (err && typeof err === 'object' && 'digest' in err) {
          const digest = (err as { digest?: string }).digest;
          if (typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
            // It's a redirect, don't show error
            return;
          }
        }

        // Check if error message contains NEXT_REDIRECT
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
          // It's a redirect, don't show error
          return;
        }

        // Show actual error
        setError(err instanceof Error ? err.message : "Registration failed, please try again later.");
      }
    });
  };

  // Prevent hydration mismatch by not rendering MUI components until mounted
  if (!mounted) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Register</h2>
          <p>Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.surface",
          p: 2,
        }}
      >
        <Card
          variant="outlined"
          sx={{
            maxWidth: 400,
            width: "100%",
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

            {/* Error message */}
            {error && (
              <Alert color="danger" variant="soft">
                {error}
              </Alert>
            )}

            <form action={handleSubmit}>
              <Stack spacing={2}>
                <FormControl required>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    placeholder="Enter your email"
                    type="email"
                    disabled={isPending}
                  />
                </FormControl>

                <FormControl required>
                  <FormLabel>Username</FormLabel>
                  <Input
                    name="username"
                    placeholder="Enter your username"
                    type="text"
                    disabled={isPending}
                  />
                </FormControl>

                <FormControl required>
                  <FormLabel>Password</FormLabel>
                  <Input
                    name="password"
                    placeholder="Create a password (at least 6 characters)"
                    type="password"
                    disabled={isPending}
                  />
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  sx={{ mt: 2 }}
                  loading={isPending}
                  disabled={isPending}
                >
                  {isPending ? "Registering..." : "Register"}
                </Button>
              </Stack>
            </form>

            <Divider>Or continue with</Divider>

            <Button
              variant="outlined"
              size="lg"
              fullWidth
              component="a"
              href="/api/v1/auth/discord"
              disabled={isPending}
            >
              🔗 Login with Discord
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
    </CssVarsProvider>
  );
}
