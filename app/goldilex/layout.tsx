import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'goldilex - briefica',
  description: 'patent-protected legal analysis chatbot - based on your actual course materials',
  icons: {
    icon: [
      { url: '/glex.ico', sizes: 'any' },
      { url: '/glex.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/glex.png', sizes: '512x512' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
