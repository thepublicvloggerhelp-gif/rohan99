import type { Metadata } from 'next'
import { Space_Grotesk, Syne, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'YPSdudes – JEE & NEET Community',
  description: 'Private community for Class 12 JEE and NEET aspirants of Yugantar Public School, Rajnandgaon.',
  keywords: ['JEE', 'NEET', 'YPS', 'Yugantar Public School', 'Rajnandgaon', 'study community'],
  authors: [{ name: 'YPS Team' }],
  themeColor: '#08090E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}
        style={{ background: '#08090E', color: '#F8FAFC' }}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#13162A',
              border: '1px solid rgba(37,99,235,0.25)',
              color: '#f1f5f9',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: '600',
            },
          }}
        />
      </body>
    </html>
  )
}
