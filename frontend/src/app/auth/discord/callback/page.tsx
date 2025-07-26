"use client";

import { useInitializeUserFromAPI } from "@/stores/userStore";
import { Alert, Box, CircularProgress, Typography } from "@mui/joy";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DiscordCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initializeUser = useInitializeUserFromAPI();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get("token");
        const tokenType = searchParams.get("token_type");

        if (!token) {
          setStatus("error");
          setErrorMessage("No authentication token received");
          return;
        }

        // 使用API端点设置httpOnly cookie
        const response = await fetch('/api/auth/set-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to set authentication token');
        }

        // 等待一下确保cookie设置完成
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize user data in the store
        await initializeUser();

        setStatus("success");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/taskbot/dashboard");
        }, 1500);

      } catch (error) {
        console.error("Discord login callback error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Failed to complete login process");
      }
    };

    processCallback();
  }, [searchParams, router, initializeUser]);

  // Handle error cases from URL parameters
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setStatus("error");
      switch (error) {
        case "no_oauth_code":
          setErrorMessage("OAuth authorization was cancelled or failed");
          break;
        case "oauth_token_failed":
          setErrorMessage("Failed to exchange authorization code for token");
          break;
        case "no_access_token":
          setErrorMessage("No access token received from Discord");
          break;
        case "failed_to_get_user_info":
          setErrorMessage("Failed to retrieve user information from Discord");
          break;
        case "invalid_discord_user_data":
          setErrorMessage("Invalid user data received from Discord");
          break;
        case "registration_failed":
          setErrorMessage("Failed to create user account");
          break;
        case "discord_registration_failed":
          setErrorMessage("Discord user registration failed");
          break;
        default:
          setErrorMessage("An unknown error occurred during login");
      }
    }
  }, [searchParams]);

  const handleReturnToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 3,
        p: 3,
      }}
    >
      {status === "loading" && (
        <>
          <CircularProgress size="lg" />
          <Typography level="h4">Completing Discord Login...</Typography>
          <Typography level="body-md" color="neutral">
            Please wait while we set up your account
          </Typography>
        </>
      )}

      {status === "success" && (
        <>
          <Typography level="h4" color="success">
            Login Successful! 🎉
          </Typography>
          <Typography level="body-md" color="neutral">
            Redirecting you to the dashboard...
          </Typography>
        </>
      )}

      {status === "error" && (
        <>
          <Alert color="danger" variant="soft" sx={{ maxWidth: 400 }}>
            <Typography level="title-md">Login Failed</Typography>
            <Typography level="body-sm">{errorMessage}</Typography>
          </Alert>
          <Typography
            level="body-md"
            color="primary"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={handleReturnToLogin}
          >
            Return to Login Page
          </Typography>
        </>
      )}
    </Box>
  );
} 