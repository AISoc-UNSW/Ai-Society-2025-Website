import * as React from "react";

export const metadata = {
  title: "AI Society 2025 Taskbot",
  description: "Task management and meeting automation platform for AI Society 2025",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
