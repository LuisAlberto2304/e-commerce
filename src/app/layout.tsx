'use client'
import '../styles/globals.css'
import { usePathname } from "next/navigation";
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noHeaderRoutes = ["/login", "/register"];
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <html lang="es">
      <body className="bg-bg text-text font-sans min-h-screen flex flex-col">
        {showHeader && <Header />}
        
        {/* CONTENIDO CON ANCHO COMPLETO */}
        <main className="flex-1 w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        
        <Footer />
      </body>
    </html>
  )
}