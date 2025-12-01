/* eslint-disable @typescript-eslint/no-explicit-any */
import { doc, setDoc, increment } from "firebase/firestore";
import { db } from "./firebaseClient";

export const updateProductStats = async (items: any[]) => {
  for (const item of items) {
    const ref = doc(db, "productStats", item.productId);

    await setDoc(
      ref,
      {
        productId: item.productId,
        productName: item.productName,
        totalSold: increment(item.quantity),
        lastSell: new Date().toISOString(),
        sellerId: item.sellerId,
      },
      { merge: true }
    );
  }
};
