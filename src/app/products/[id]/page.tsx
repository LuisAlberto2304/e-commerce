/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductoDetalleClient from "./ProductoDetalleClient";
import { fetchProductById, fetchCategoryById, fetchProducts } from "@/app/lib/medusaClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const product = await fetchProductById(id);

    if (!product) {
      return {
        title: "Producto no encontrado",
        description: "Este producto no existe",
      };
    }

    const productUrl = `https://e-tianguis.com/producto/${product.id}`;
    const imageUrl = 
  product.images?.[0]?.url || 
  product.thumbnail || 
  "https://e-tianguis.com/placeholder.jpg";


    return {
      title: product.title,
      description: product.description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        type: "website",
        url: productUrl,
        title: product.title,
        description: product.description,
        siteName: "E-Tianguis",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description: product.description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error en generateMetadata:", error);
    return {
      title: "Producto no encontrado",
      description: "Este producto no existe",
    };
  }
}

export default async function ProductoPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  try {
    const product = await fetchProductById(id);

    if (!product) {
      return (
        <div className="max-w-6xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <p className="mt-4">El producto que buscas no existe o ha sido removido.</p>
        </div>
      );
    }

    let category: any = null;
    let recommended: any[] = [];

    // ✅ Soporte para productos con array de categorías
   // ✅ Detectar categoría desde el producto
    const categoryId = product.category?.id || product.category_id || product.categories?.[0]?.id;
    const categoryName = product.categories?.[0]?.name || product.category?.name || "Sin categoría";

    if (categoryId) {
      // ✅ Ya no llamamos a fetchCategoryById porque no existe /categories/[id]
      category = { id: categoryId, name: categoryName };

      // ✅ Obtener productos recomendados de la misma categoría
      // Obtener productos recomendados de la misma categoría
      const rec = await fetchProducts({
        categoryId,
        limit: 4,
      });

      // ✅ Usar rec.products porque rec no es un array
      recommended = rec.products.filter((p: any) => p.id !== id);

    } else {
      console.warn("⚠️ Producto sin categoría válida, no se mostrarán recomendaciones");
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
        {/* ✅ Pasar los datos ya obtenidos al cliente */}
        <ProductoDetalleClient 
          id={id}
          initialProduct={product}
          initialCategory={category}
          recommendedProducts={recommended}
        />

        {/* ✅ Inyectar datos estructurados */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </>
    );

  } catch (error) {
    console.error("Error en ProductoPage:", error);
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Error al cargar el producto</h1>
        <p className="mt-4">Hubo un problema al cargar la información del producto.</p>
      </div>
    );
  }
}