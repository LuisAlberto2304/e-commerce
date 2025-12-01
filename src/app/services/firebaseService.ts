/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, doc, getDoc, orderBy, limit, query } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { fetchProductById } from "../lib/medusaClient"; 
// -----------------------------
// Interfaces
// -----------------------------
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  created_at: string;
  updated_at: string;
  status: string;
  seller_id: string;
  store_id: string;
  totalSold: number;
  lastSell: string | undefined;
}

// -----------------------------
// Utilidad: mapear datos Firestore → Product
// -----------------------------
const mapProduct = (
  productId: string,
  data: any,
  sellerId: string,
  totalSold: number,
  lastSell?: string
): Product => {
  return {
    id: productId,
    title: data.title || data.name || "Producto sin nombre",
    description: data.description || "",
    price:
      typeof data.price === "number"
        ? data.price
        : data.price?.amount ?? 0,
    thumbnail: data.thumbnail || data.image || "",
    created_at: data.created_at || data.createdAt || "",
    updated_at: data.updated_at || data.updatedAt || "",
    status: data.status || "published",
    seller_id: sellerId,
    store_id: sellerId,
    totalSold: totalSold ?? 0,
    lastSell: lastSell,
  };
};

// -----------------------------
// Función: obtener producto por ID
// -----------------------------
const getProductById = async (
  sellerId: string,
  productId: string
): Promise<Product | null> => {
  try {
    const productRef = doc(db, "stores", sellerId, "products", productId);
    const snap = await getDoc(productRef);

    if (!snap.exists()) return null;

    return mapProduct(productId, snap.data(), sellerId, 0);
  } catch {
    return null;
  }
};

// -----------------------------
// ⭐ NUEVA FUNCIÓN LIMPIA: Obtener productos más vendidos
// -----------------------------
export const getBestSellingProducts = async (
  maxProducts: number = 6
): Promise<Product[]> => {
  try {
    const statsRef = collection(db, "productStats");
    const statsSnap = await getDocs(statsRef);

    if (statsSnap.empty) return [];

    const stats = statsSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          productId: doc.id,
          sellerId:
            data.sellerId ||
            data.seller_id ||
            data.storeId ||
            data.store_id,
          totalSold: data.totalSold || data.total_sold || 0,
          lastSell: data.lastSell || data.last_sell,
        };
      })
      .filter((x) => x.sellerId)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, maxProducts);

    const products = await Promise.all(
      stats.map(async (entry) => {
        const medusaProduct = await fetchProductById(entry.productId);
        if (!medusaProduct) return null;

        const price =
          medusaProduct.variants?.[0]?.prices?.[0]?.amount ?? 0;

        return {
          id: medusaProduct.id,
          store_id: entry.sellerId,
          title: medusaProduct.title,
          description: medusaProduct.description,
          price,
          thumbnail: medusaProduct.thumbnail,
          totalSold: entry.totalSold,
          lastSell: entry.lastSell ?? new Date().toISOString(),
        };
      })
    );

    return products.filter(Boolean) as Product[];
  } catch (error) {
    console.error("Error en getBestSellingProducts:", error);
    return [];
  }
};

// --------------------------------------------
// Obtener productos más nuevos (simplificado)
// --------------------------------------------
export const getNewestProducts = async (
  maxProducts: number = 6
): Promise<Product[]> => {
  try {
    const storesRef = collection(db, "stores");
    const stores = await getDocs(storesRef);

    const result: Product[] = [];

    for (const storeDoc of stores.docs) {
      const storeId = storeDoc.id;
      const productsRef = collection(db, "stores", storeId, "products");

      const q = query(productsRef, orderBy("created_at", "desc"), limit(maxProducts));
      const snap = await getDocs(q);

      snap.forEach((doc) => {
        const data = doc.data();
        result.push(
          mapProduct(doc.id, data, storeId, data.totalSold ?? 0, data.lastSell)
        );
      });
    }

    return result
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, maxProducts);
  } catch (err) {
    console.error("Error en getNewestProducts:", err);
    return [];
  }
};
