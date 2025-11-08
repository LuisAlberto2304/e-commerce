/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebaseClient";

// 🔹 Obtener todos los productos del carrito del usuario
export const getCartFromFirebase = async (userId: string) => {
  try {
    const cartRef = collection(db, "users", userId, "cart");
    const snapshot = await getDocs(cartRef);

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { items };
  } catch (error) {
    console.error("Error getting cart from Firebase:", error);
    return { items: [] };
  }
};

// 🔹 Vaciar el carrito (eliminar todos los documentos de la subcolección)
export const clearCartFromFirebase = async (userId: string) => {
  try {
    const cartRef = collection(db, "users", userId, "cart");
    const snapshot = await getDocs(cartRef);

    const deletions = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "users", userId, "cart", docSnap.id))
    );

    await Promise.all(deletions);
    console.log("Carrito vaciado exitosamente.");
  } catch (error) {
    console.error("Error clearing cart from Firebase:", error);
  }
};

// 🔹 Calcular totales
export const calculateCartTotals = (items: any[]) => {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  const tax = subtotal * 0.16; // IVA 16%
  const shipping = 0;
  const total = subtotal + tax + shipping;

  return { subtotal, tax, shipping, total };
};
