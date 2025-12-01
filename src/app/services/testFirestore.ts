'use client';

import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

export const testFirestore = async () => {
  console.log("🔥 TEST — leyendo stores...");

  const snap = await getDocs(collection(db, "stores"));

  console.log("📊 Cantidad:", snap.size);

  snap.forEach((doc) => {
    console.log("➤ Doc:", doc.id, doc.data());
  });
};
