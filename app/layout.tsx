import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'YPSdudes – JEE & NEET Community',
  description: 'Private community for Class 12 JEE and NEET aspirants of Yugantar Public School, Rajnandgaon.',
  keywords: ['JEE', 'NEET', 'YPS', 'Yugantar Public School', 'Rajnandgaon', 'study community'],
  authors: [{ name: 'YPS Team' }],
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-surface-1 text-slate-100 min-h-screen`}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(28,28,40,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f1f5f9',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
      </body>
    </html>
  )
}
