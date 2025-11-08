// lib/wishlist.ts
import { db } from "./firebaseClient";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

interface Product {
  id: string;
  title: string;
  thumbnail: string;
  price?: number;
}

/**
 * Agrega un producto al wishlist del usuario
 */
export const addToWishlist = async (userId: string, product: Product) => {
  // ID compuesto: garantiza que no se dupliquen productos del mismo usuario
  const docRef = doc(db, "wishlist", `${userId}_${product.id}`);
  await setDoc(docRef, {
    userId,
    productId: product.id,
    name: product.title,
    image: product.thumbnail,
    price: product.price ?? 0,
    createdAt: serverTimestamp(),
  });
};

/**
 * Elimina un producto del wishlist
 */
export const removeFromWishlist = async (userId: string, productId: string) => {
  const docRef = doc(db, "wishlist", `${userId}_${productId}`);
  await deleteDoc(docRef);
};

/**
 * Obtiene los productos guardados por el usuario
 */
export const getWishlistIds = async (userId: string): Promise<string[]> => {
  const q = query(collection(db, "wishlist"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data().productId as string);
};
