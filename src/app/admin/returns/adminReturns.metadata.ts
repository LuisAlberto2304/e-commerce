// app/admin/returns/adminReturns.metadata.ts

export const metadataReturns = {
  title: "Devoluciones | Panel de Administración",
  description: "Gestión de solicitudes de devoluciones.",
  slug: "admin/returns",
  canonical: "https://e-tianguis.com/admin/returns",
};

export const structuredDataReturns = [
  {
    "@context": "https://schema.org",
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
        name: "Panel Admin",
        item: "https://e-tianguis.com/admin"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Devoluciones",
        item: "https://e-tianguis.com/admin/returns"
      }
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
