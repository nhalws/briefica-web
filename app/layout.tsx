import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "briefica web (b-web)",
  description: "Legal knowledge, structured & shareable",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "briefica web (b-web)",
    description: "Legal knowledge, structured & shareable",
    url: "https://briefica.com",
    siteName: "briefica",
    images: [
      {
        url: "https://briefica.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "briefica - legal knowledge, structured & shareable",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "briefica web (b-web)",
    description: "Legal knowledge, structured & shareable",
    images: ["https://briefica.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}