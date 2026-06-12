import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}
        style={{ background: '#08090E', color: '#F8FAFC' }}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#0D0F1A',
              border: '1px solid rgba(37,99,235,0.25)',
              color: '#f1f5f9',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '700',
            },
          }}
        />
      </body>
    </html>
  )
}
