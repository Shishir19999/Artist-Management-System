import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import Providers from "@/components/Providers";
import { THEME_SCRIPT } from "@/lib/client/theme";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Artist Studio - artist, catalogue and booking management",
    template: "%s | Artist Studio",
  },
  description:
    "Manage artists, music, playlists and bookings in one place. Role-based access for artist managers, artists and users, with analytics, CSV import and export and audio previews.",
  applicationName: "Artist Studio",
  keywords: ["artist management", "music catalogue", "bookings", "playlists", "dashboard"],
  openGraph: {
    title: "Artist Studio",
    description: "Artists, songs, playlists and bookings in one workspace.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5a3fd0" },
    { media: "(prefers-color-scheme: dark)", color: "#14121f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="studio" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
