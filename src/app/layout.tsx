// app/layout.tsx - SERVER COMPONENT
import '../styles/globals.css'
import { Inter, Roboto } from 'next/font/google'
import { PerformanceMetrics } from '../components/PerformanceMetrics'
import LayoutContent from './LayoutContent'
import Script from 'next/script'
import  Analytics  from '@/components/Analytics'


// 🔹 Configuración optimizada de fuentes
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: false,
})

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

// 🔹 Metadata estática para SEO
export const metadata = {
  title: {
    default: 'E-Tianguis - Tu mercado en línea',
    template: '%s | E-Tianguis'
  },
  description: 'Explora todas las categorías de productos en E-Tianguis.',
  keywords: 'tienda online, mercado, productos, compras',
  authors: [{ name: 'E-Tianguis' }],
  creator: 'E-Tianguis',
  metadataBase: new URL('https://e-tianguis.com'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://e-tianguis.com',
    siteName: 'E-Tianguis',
    title: 'E-Tianguis - Tu mercado en línea',
    description: 'Explora todas las categorías de productos en E-Tianguis.',
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

// SERVER COMPONENT - No necesita 'use client'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${roboto.variable}`}>
      <head>
        {/* 🔹 Preconnect para dominios críticos */}
        <link rel="preconnect" href="https://cdn.e-tianguis.com" />
        <link rel="dns-prefetch" href="https://cdn.e-tianguis.com" />
        
        {/* 🔹 Preload para fuentes críticas si es necesario */}
        <link
          rel="preload"
          href="/api/health"
          as="fetch"
          crossOrigin="anonymous"
        />
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=MXN`}
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.className} bg-bg text-text min-h-screen flex flex-col antialiased`}>
          {/* 🔹 Client Component para lógica de ruta */}
          <LayoutContent>{children}</LayoutContent>
          <Analytics /> {/* 👈 nuevo componente para navegación SPA */}
          {/* 🔹 Métricas de performance */}
          <PerformanceMetrics />
      </body>
    </html>
  )
}