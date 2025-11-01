/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, addDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import app from "./firebaseClient";

const db = getFirestore(app);

// 🔧 Función auxiliar para limpiar undefined o null
function cleanObject(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  );
}

export const saveOrder = async (orderData: any) => {
  try {
    console.log("🔥 Intentando guardar en Firebase:", orderData);

    // Validaciones básicas
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("No hay items en la orden");
    }

    if (!orderData.email) {
      throw new Error("No hay email en la orden");
    }

    // 📦 Limpiamos antes de enviar a Firestore
    const cleanedOrder = cleanObject(orderData);

    // 🕓 Agregamos timestamps consistentes
    const orderWithTimestamp = {
      ...cleanedOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      firebaseCreated: new Date().toISOString(),
    };

    console.log("📦 Datos a guardar:", JSON.stringify(orderWithTimestamp, null, 2));
    console.log("🧭 Proyecto Firebase actual:", db.app.options.projectId);

    // 🔥 Guardamos en la colección "orders"
    const docRef = await addDoc(collection(db, "orders"), orderWithTimestamp);

    console.log("📍 Documento guardado en:", docRef.path);
    console.log("✅ Orden guardada en Firebase con ID:", docRef.id);

    return {
      success: true,
      orderId: docRef.id,
      orderNumber: orderData.orderNumber,
    };
  } catch (error: any) {
    console.error("❌ Error guardando en Firebase (detalle completo):", error);
    if (error?.message) console.error("📄 Mensaje:", error.message);
    if (error?.code) console.error("📟 Código:", error.code);
    if (error?.stack) console.error("🧩 Stack:", error.stack);
    throw error;
  }
};
