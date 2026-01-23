import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'maapaap - માપાપ',
  description: 'Save accurate body & garment measurements for your family',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#f97316',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'maapaap',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="gu" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-gujarati antialiased">
        {children}
      </body>
    </html>
  )
}
