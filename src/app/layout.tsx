
'use client'
import '../styles/globals.css'
import { usePathname } from "next/navigation";
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'


export default function RootLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();

  const noHeaderRoutes = ["/login", "/register"]; // rutas sin header
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <html lang="es">
      <body className="bg-bg text-text font-sans">
        {showHeader && <Header />}
        <main className="max-w-700 mx-auto p-6">{children}</main> {/* contenido de la página */}
        <Footer /> {/* siempre visible */}
      </body>
    </html>
  )
}
