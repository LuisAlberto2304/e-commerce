/* eslint-disable @next/next/inline-script-id */
import { generateSeoMetadata } from "../lib/seo";
import CategoryPageClient from "./CategoryPageClient";
import Script from "next/script";


// 🔹 Metadata estática
export const metadata = generateSeoMetadata({
  title: "Categorías",
  description: "Explora todas las categorías de productos.",
  slug: "categorias",
  canonicanl: "https://e-tianguis.com/categorias",
});

// Datos estructurados para la página de categorías
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { 
          "@type": "ListItem", 
          position: 1, 
          name: "Inicio", 
          item: "https://e-tianguis.com" 
        },
        { 
          "@type": "ListItem", 
          position: 2, 
          name: "Categorías", 
          item: "https://e-tianguis.com/categorias" 
        }
      ]
    },
    {
      "@type": "Organization",
      name: "E-Tianguis",
      url: "https://e-tianguis.com",
      logo: "https://e-tianguis.com/logo.png"
    }
  ]
};

// Server Component
export default function CategoryPage() {
  return (
    <>
      <CategoryPageClient />
      {/* 🔹 JSON-LD optimizado */}
      <Script
        id="structured-data"
        type="application/ld+json"
        strategy="afterInteractive" // 🔹 Mejor para performance
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(structuredData) 
        }}
      />
    </>
  );
}
