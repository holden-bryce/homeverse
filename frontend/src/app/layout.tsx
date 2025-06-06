import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'HomeVerse - Affordable Housing Analytics',
    template: '%s | HomeVerse',
  },
  description: 'Enterprise platform for affordable housing demand/supply analytics, CRA compliance, and market intelligence.',
  keywords: ['affordable housing', 'real estate', 'analytics', 'CRA compliance', 'housing development'],
  authors: [{ name: 'HomeVerse Team' }],
  creator: 'HomeVerse',
  publisher: 'HomeVerse',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://app.homeverse.io'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/homeverse-logo-new.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.homeverse.io',
    title: 'HomeVerse - Affordable Housing Analytics',
    description: 'Enterprise platform for affordable housing demand/supply analytics, CRA compliance, and market intelligence.',
    siteName: 'HomeVerse',
    images: [
      {
        url: '/homeverse-logo-new.png',
        width: 1200,
        height: 630,
        alt: 'HomeVerse - Affordable Housing Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeVerse - Affordable Housing Analytics',
    description: 'Enterprise platform for affordable housing demand/supply analytics, CRA compliance, and market intelligence.',
    creator: '@homeverse',
    images: ['/homeverse-logo-new.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              <ToastProvider>
                {children}
                <ToastViewport />
              </ToastProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}