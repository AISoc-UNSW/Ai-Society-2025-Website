"use client";

import {
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
import { useState, useEffect } from "react";

interface LoginClientProps {
  loginAction: (formData: FormData) => Promise<void>;
}

export default function LoginClient({ loginAction }: LoginClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <h2>Login</h2>
          <p>Loading login form...</p>
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
                Login
              </Typography>
              <Typography level="body-sm" textAlign="center" color="neutral">
                Enter your credentials to access your account
              </Typography>
            </Stack>

            <form action={loginAction}>
              <Stack spacing={2}>
                <FormControl required>
                  <FormLabel>Username</FormLabel>
                  <Input name="username" placeholder="Enter your username" type="text" />
                </FormControl>

                <FormControl required>
                  <FormLabel>Password</FormLabel>
                  <Input name="password" placeholder="Enter your password" type="password" />
                </FormControl>

                <Button type="submit" size="lg" fullWidth sx={{ mt: 2 }}>
                  Login
                </Button>
              </Stack>
            </form>

            <Divider>Or continue with</Divider>

            <Button variant="outlined" size="lg" fullWidth component="a" href="/taskbot/dashboard">
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
    </CssVarsProvider>
  );
}
