/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/getRecommendedProducts.ts
export type ProductFromAPI = any; // ajusta si tienes un tipo más estricto

function detectCategoryId(product: ProductFromAPI) {
  return (
    product.categoryId ??
    product.category_id ??
    product.collection_id ??
    product.category?.id ??
    product.categories?.[0]?.id ??
    product.collection?.id ??
    null
  );
}

export default function getRecommendedProducts(
  currentProduct: ProductFromAPI,
  products: ProductFromAPI[] | undefined,
  limit = 8
) {
  if (!currentProduct || !products || products.length === 0) return [];

  const categoryId = detectCategoryId(currentProduct);
  if (!categoryId) return [];

  // Filtrar por misma categoría y excluir el producto actual
  const sameCategory = products.filter((p) => {
    const pCat = detectCategoryId(p);
    return p.id !== currentProduct.id && pCat && String(pCat) === String(categoryId);
  });

  // Si no alcanza, rellenar con otros productos distintos
  let recommended = sameCategory.slice(0, limit);
  if (recommended.length < limit) {
    const others = products.filter((p) => p.id !== currentProduct.id && !recommended.some((r) => r.id === p.id));
    recommended = recommended.concat(others.slice(0, limit - recommended.length));
  }

  // Mapear a la forma que espera tu ProductCarousel / ProductCardCarousel
  return recommended.map((p) => ({
    id: p.id,
    title: p.title ?? p.name ?? 'Producto',
    description: p.description ?? '',
    images: p.images ?? p.image ? [{ url: p.image }] : [],
    imageUrl: (p.images && p.images[0]?.url) || p.image || '/placeholder-image.jpg',
    price: p.price ?? p.variants?.[0]?.price ?? 0,
    originalPrice: p.originalPrice ?? p.compareAtPrice ?? undefined,
    label: p.label,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
  }));
}
