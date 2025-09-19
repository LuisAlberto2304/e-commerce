import '../app/globals.css'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-bg text-text font-sans">
        <Header /> {/* siempre visible */}
        <main className="max-w-6xl mx-auto p-6">{children}</main> {/* contenido de la página */}
        <Footer /> {/* siempre visible */}
      </body>
    </html>
  )
}
