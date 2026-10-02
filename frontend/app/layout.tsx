import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ActionDesk — Business memory, intelligent action',
  description: 'ActionDesk turns scattered business information into the next right action.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
