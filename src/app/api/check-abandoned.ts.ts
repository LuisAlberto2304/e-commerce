/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { sendAbandonedCartEmail } from "../lib/sendAbandonedCartEmail";

// Configura Firebase (usa tus variables reales)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 👇 Esta función la llamará cron-job.org
export default async function handler(req: { method: string; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error?: any; message?: string; }): void; new(): any; }; }; }) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const now = new Date();
    const abandonedThresholdHours = 3; // tiempo para considerar abandonado

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
      if (hoursPassed >= abandonedThresholdHours) {
        await sendAbandonedCartEmail(userData.email, items);
        console.log(`📧 Enviado a ${userData.email}`);
      }
    }

    res.status(200).json({ message: "✅ Revisión completada" });
  } catch (error:any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
