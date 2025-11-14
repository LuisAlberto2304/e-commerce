/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { sendAbandonedCartEmail } from "./sendAbandonedCartEmail";

export async function checkAbandonedCarts() {
  const db = getFirestore();

  const usersSnap = await getDocs(collection(db, "users"));

  const now = new Date();
  const abandonedThresholdHours = 3; // ⏰ tiempo para considerar "abandonado"

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const cartSnap = await getDocs(collection(db, `users/${userId}/cart`));

    if (cartSnap.empty) continue;

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
    }
  }
}
