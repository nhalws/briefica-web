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
  description: "A true law school workspace.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png", // optional but recommended
  },
  openGraph: {
    title: "briefica web (b-web)",
    description: "A true law school workspace.",
    url: "https://briefica.com",
    siteName: "briefica web (b-web)",
    images: [
      {
        url: "https://briefica.com/favicon.png",
        width: 512,
        height: 512,
        alt: "briefica logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "briefica web (b-web)",
    description: "A true law school workspace.",
    images: ["https://briefica.com/favicon.png"],
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
