/* eslint-disable @next/next/inline-script-id */
import { generateSeoMetadata } from "../lib/seo";
import Script from "next/script";

export const metadata = generateSeoMetadata({
  title: "Política de Cookies",
  description:
    "Política de Cookies de E-Tianguis. Conoce cómo utilizamos cookies para mejorar tu experiencia de navegación y personalizar contenido.",
  slug: "cookies",
  canonicanl: "https://e-tianguis.com/cookies",
});

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://e-tianguis.com" },
      { "@type": "ListItem", position: 2, name: "Política de Cookies", item: "https://e-tianguis.com/cookies" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-Tianguis",
    url: "https://e-tianguis.com",
    logo: "https://e-tianguis.com/logo.png",
  },
];

export default function PoliticaCookiesPage() {
  return (
    <>
      <section className="max-w-4xl mx-auto p-6 text-justify text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Política de Cookies</h1>

        <p className="mb-4">
          En E-Tianguis utilizamos cookies y tecnologías similares para mejorar la
          experiencia del usuario, personalizar el contenido y analizar el tráfico del
          sitio. Esta política explica qué son las cookies, cómo las utilizamos y cómo
          puede gestionarlas.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">1. ¿Qué son las cookies?</h2>
        <p className="mb-4">
          Las cookies son pequeños archivos de texto que se almacenan en su dispositivo
          cuando visita un sitio web. Permiten recordar sus preferencias, mejorar el
          rendimiento del sitio y ofrecer funciones personalizadas.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">2. Tipos de cookies que utilizamos</h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Cookies esenciales:</strong> Son necesarias para el funcionamiento
            básico del sitio (como el inicio de sesión, el carrito de compras o la
            seguridad de las transacciones).
          </li>
          <li>
            <strong>Cookies de rendimiento:</strong> Nos ayudan a entender cómo los
            usuarios interactúan con la plataforma y a mejorar su funcionamiento.
          </li>
          <li>
            <strong>Cookies de personalización:</strong> Permiten recordar sus
            preferencias de idioma, región o vista del catálogo.
          </li>
          <li>
            <strong>Cookies de marketing:</strong> Se utilizan para mostrar anuncios o
            promociones relevantes y medir la efectividad de nuestras campañas.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-3">3. Consentimiento del usuario</h2>
        <p className="mb-4">
          Al acceder a nuestro sitio, se le mostrará un banner informativo donde podrá
          aceptar, rechazar o configurar el uso de cookies. El consentimiento puede
          modificarse o revocarse en cualquier momento a través de la configuración de
          su navegador o el panel de preferencias del sitio.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">4. Cómo gestionar o desactivar cookies</h2>
        <p className="mb-4">
          Puede configurar su navegador para bloquear o eliminar las cookies instaladas.
          Tenga en cuenta que al deshabilitar ciertas cookies, algunas funcionalidades del
          sitio pueden verse afectadas. A continuación, se incluyen enlaces a las guías
          de configuración de los navegadores más utilizados:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Mozilla Firefox</a></li>
          <li><a href="https://support.microsoft.com/es-es/help/17442" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Microsoft Edge</a></li>
          <li><a href="https://support.apple.com/es-es/HT201265" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Safari</a></li>
        </ul>

        <h2 className="text-2xl font-semibold mt-6 mb-3">5. Actualizaciones</h2>
        <p className="mb-4">
          Nos reservamos el derecho de modificar esta Política de Cookies en cualquier
          momento. Cualquier cambio será publicado en esta misma página con la fecha de
          actualización correspondiente.
        </p>

        <p className="mt-8 text-sm text-gray-600">
          Última actualización: Octubre 2025
        </p>
      </section>

      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
