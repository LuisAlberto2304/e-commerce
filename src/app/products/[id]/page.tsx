/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductoDetalleClient from "./ProductoDetalleClient";
import { fetchProductById, fetchCategoryById } from "@/app/lib/medusaClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await fetchProductById(params.id);

  if (!product) {
    return {
      title: "Producto no encontrado",
      description: "Este producto no existe",
    };
  }

  const productUrl = `https://e-tianguis.com/producto/${product.id}`;

  return {
    title: product.title,
    description: product.description,
    alternates: {
      canonical: productUrl,
    },
  };
}

export default async function ProductoPage({ params }: { params: { id: string } }) {
  const product = await fetchProductById(params.id);

  if (!product) {
    return <p>Producto no encontrado</p>;
  }

  // Obtener categoría (opcional)
  let category: any = null;
  if (product.category_id) {
    category = await fetchCategoryById(product.category_id);
  }

  const productUrl = `https://e-tianguis.com/producto/${product.id}`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      image: product.images?.map((img: any) => img.url) || [],
      description: product.description,
      sku: product.variants?.[0]?.sku || product.id,
      brand: {
        "@type": "Brand",
        name: product.brand || "E-Tianguis",
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: product.variants?.[0]?.prices?.[0]?.currency_code || "MXN",
        price: (product.variants?.[0]?.prices?.[0]?.amount / 100).toFixed(2) || "0.00",
        availability: product.variants?.[0]?.inventory_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://e-tianguis.com" },
        { "@type": "ListItem", position: 2, name: "Productos", item: "https://e-tianguis.com/productos" },
        ...(category ? [{
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: `https://e-tianguis.com/categoria/${category.id}`
        }] : []),
        { "@type": "ListItem", position: category ? 4 : 3, name: product.title, item: productUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "E-Tianguis",
      url: "https://e-tianguis.com",
      logo: "https://e-tianguis.com/logo.png"
    }
  ];

  return (
    <>
      {/* Renderizar tu componente del detalle */}
      <ProductoDetalleClient id={params.id} />

      {/* ✅ Inyectar datos estructurados */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
