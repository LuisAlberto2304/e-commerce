/* eslint-disable @next/next/inline-script-id */
import { generateSeoMetadata } from "../lib/seo";
import LoginPageClient from "./LoginPageClient";
import Script from "next/script";

export const metadata = generateSeoMetadata({
  title: "Login",
  description: "Inicio de sesión en la página.",
  slug: "login",
  canonicanl: "https://e-tianguis.com/login",
});

// 🔹 Datos estructurados para una página de login
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://e-tianguis.com" },
      { "@type": "ListItem", position: 2, name: "Login", item: "https://e-tianguis.com/login" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-Tianguis",
    url: "https://e-tianguis.com",
    logo: "https://e-tianguis.com/logo.png"
  }
];

export default function LoginPage() {
  return (
    <>
      <LoginPageClient />
      {/* 🔹 Insertar JSON-LD */}
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
