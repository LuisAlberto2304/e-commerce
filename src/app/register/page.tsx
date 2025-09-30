/* eslint-disable @next/next/inline-script-id */
import { generateSeoMetadata } from "../lib/seo";
import RegisterLoginClient from "./RegisterPageClient";
import Script from "next/script";

export const metadata = generateSeoMetadata({
  title: "Register",
  description: "Registro del usuario en la plataforma.",
  slug: "register",
  canonicanl: "https://e-tianguis.com/registro",
});

// 🔹 Datos estructurados para página de registro
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://e-tianguis.com" },
      { "@type": "ListItem", position: 2, name: "Registro", item: "https://e-tianguis.com/registro" },
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

export default function RegisterPage() {
  return (
    <>
      <RegisterLoginClient />
      {/* 🔹 Insertar JSON-LD */}
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
