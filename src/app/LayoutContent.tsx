'use client'

import { usePathname } from "next/navigation"
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

// 🔹 Rutas que no deben mostrar header
const noHeaderRoutes = ["/login", "/register"];

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <>
      {showHeader && <Header />}
      
      {/* CONTENIDO CON ANCHO COMPLETO */}
      <main className="flex-1 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      
      <Footer />
    </>
  )
}