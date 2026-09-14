import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "מאמר מוסגר — Bracket City Hebrew";
const description = "חידת הסוגריים היומית — פענחו את המשפט החבוי, סוגר אחר סוגר.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s · מאמר מוסגר",
  },
  description,
  applicationName: "מאמר מוסגר",
  keywords: [
    "מאמר מוסגר",
    "Bracket City",
    "חידה",
    "תשבץ עברי",
    "משחק מילים",
    "חידת היום",
    "עברית",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "he_IL",
    siteName: "מאמר מוסגר",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=David+Libre:wght@400;500;700&family=Frank+Ruhl+Libre:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
