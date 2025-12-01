/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, doc, setDoc } from "firebase/firestore";
import app from "./firebaseClient"; // tu inicialización de firebase client

const db = getFirestore(app);

// ✅ Define una interfaz para los datos adicionales del usuario
interface ExtraUserData {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  phoneNumber?: string;
  role?: "buyer" | "seller" | "admin";
  storeName?: string;
}

// ✅ Tipamos correctamente el usuario y los datos extra
export async function saveUserToFirestore(
  user: { uid: string; email: string | null; displayName?: string },
  extraData: ExtraUserData = {}
) {
  if (!user?.uid) throw new Error("Usuario inválido");

  const userRef = doc(db, "users", user.uid);

  const userData = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || extraData.nombre || "",
    role: extraData.role || "buyer",
    storeName: extraData.storeName || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(userRef, userData, { merge: true });
  return userData;
}
