import type { Metadata } from 'next'
import './globals.css'
import { BookingProvider } from './context/BookingContext'

export const metadata: Metadata = {
  title: 'SuroyCebu',
  description: 'Your Gateway to Tropical Adventure in Cebu, Philippines',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Potta+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BookingProvider>{children}</BookingProvider>
      </body>
    </html>
  )
}
