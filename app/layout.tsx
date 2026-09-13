import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hifz Mentor — The Ustad’s Workspace",
  description: "Listen, mark, and guide. Quran lesson records and personal correction sheets for every student.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
