import { MetadataRoute } from "next";

// 🔹 Ejemplo de categorías
const categories = [
  { slug: "camisetas", name: "Camisetas" },
  { slug: "pantalones", name: "Pantalones" },
  { slug: "accesorios", name: "Accesorios" },
];

// 🔹 Ejemplo de productos dinámicos
const products = [
  { slug: "camiseta-blanca", updatedAt: new Date("2025-09-01") },
  { slug: "pantalon-azul", updatedAt: new Date("2025-09-20") },
  { slug: "gorra-roja", updatedAt: new Date("2025-09-25") },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // URLs estáticas
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: "https://e-tianguis.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://e-tianguis.com/productos",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://e-tianguis.com/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://e-tianguis.com/register",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // URLs de categorías
  const categoryUrls: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `https://e-tianguis.com/categorias/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // URLs de productos
  const productUrls: MetadataRoute.Sitemap = products.map(prod => ({
    url: `https://e-tianguis.com/producto/${prod.slug}`,
    lastModified: new Date(prod.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Combina todas las URLs
  return [...staticUrls, ...categoryUrls, ...productUrls];
}
