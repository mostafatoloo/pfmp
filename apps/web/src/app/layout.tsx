import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PFMP",
  description: "Personal and Family Management Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Direction/lang refined per-request in app pages when user prefs load; default LTR English.
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@400;500;600;650;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
