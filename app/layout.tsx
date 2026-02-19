import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { StripeProvider } from '@/components/stripe-provider'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'AgentScrape - AI-Powered Real Estate Agent Data',
  description: 'Extract real estate agent data from any website with AI. Get structured contact info, listings, and market intelligence in seconds.',
  generator: 'v0.app',
  // Icons: add icon.svg, icon-light-32x32.png, icon-dark-32x32.png, apple-icon.png to /public to enable
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <StripeProvider>
            {children}
          </StripeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
