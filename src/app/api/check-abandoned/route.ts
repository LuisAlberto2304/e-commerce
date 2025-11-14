/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { sendAbandonedCartEmail } from "@/app/lib/sendAbandonedCartEmail"; // Ajusta la ruta si es distinta

// 🔐 Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🕒 Umbral de abandono (en horas)
const ABANDONED_THRESHOLD_HOURS = 3;

export async function POST() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const now = new Date();

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const cartSnap = await getDocs(collection(db, `users/${userId}/cart`));

      if (cartSnap.empty || !userData.email) continue;

      let lastAdded = 0;
      const items: any[] = [];

      cartSnap.forEach((item) => {
        const data = item.data();
        items.push(data);
        lastAdded = Math.max(lastAdded, data.addedAt?.toMillis?.() || 0);
      });

      const hoursPassed = (now.getTime() - lastAdded) / (1000 * 60 * 60);
      if (hoursPassed >= ABANDONED_THRESHOLD_HOURS) {
        await sendAbandonedCartEmail(userData.email, items);
        console.log(`📧 Email enviado a ${userData.email}`);
      }
    }

    return Response.json({ message: "✅ Revisión completada correctamente" });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
