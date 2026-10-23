import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PFMP",
  description: "Personal and Family Management Platform — Phase 1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // RTL-ready: set dir/lang from user prefs later; default LTR English for Stage 3
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Source+Sans+3:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
