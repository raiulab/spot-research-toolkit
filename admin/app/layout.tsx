import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spot Research Desk",
  description: "Evidence-first place research operations",
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
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
