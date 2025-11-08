/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/getWishlistWithDetails.ts
import { db } from "./firebaseClient";
import { collection, getDocs, query, where } from "firebase/firestore";

interface Product {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  createdAt: any; // ✅ Puede ser Timestamp o Date
  userId: string;
}

export async function getWishlistWithDetails(userId: string): Promise<Product[]> {
  if (!userId) return [];

  try {
    // 🔹 Consulta todos los productos guardados por el usuario
    const q = query(collection(db, "wishlist"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    // 🔹 Mapeo con verificación del timestamp
    const wishlist: Product[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        productId: data.productId,
        name: data.name,
        image: data.image,
        price: data.price,
        createdAt: data.createdAt, // ⚠️ Mantén el objeto Timestamp para que toDate() funcione
        userId: data.userId,
      };
    });

    return wishlist;
  } catch (error) {
    console.error("Error al obtener wishlist:", error);
    return [];
  }
}
