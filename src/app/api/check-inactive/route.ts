/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { sendReengagementEmail } from "../../lib/sendReengagementEmail";

// Configura Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esta función será llamada por cron-job.org
export async function POST(req: Request) {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const now = new Date();
    const inactiveDays = 7; // número de días para considerar “inactivo”

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();

      if (!userData.email || !userData.lastActive) continue;

      const lastActiveDate = userData.lastActive.toDate();
      const daysInactive =
        (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysInactive >= inactiveDays) {
        await sendReengagementEmail(userData.email, userData.firstName);
        console.log(`📧 Email de reactivación enviado a ${userData.email}`);
      }
    }

    return new Response(
      JSON.stringify({ message: "✅ Revisión completada" }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
