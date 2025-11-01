/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { LogOut, Mail, User, Store, Shield } from "lucide-react";
import Image from "next/image";
import OrdersList from "@/components/OrdersList";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <User className="w-12 h-12 text-gray-400 mb-2" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Inicia sesión para ver tu perfil</h2>
        <p className="text-sm text-gray-500">Accede a tu cuenta para ver tus datos y tus órdenes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* ENCABEZADO PERFIL */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={user.photoURL || "/images/avatar-placeholder.png"}
              alt="Avatar del usuario"
              width={100}
              height={100}
              className="rounded-full object-cover border-4 border-indigo-100"
            />
          </div>

          {/* Información del usuario */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-800">
              {profile?.name || "Usuario sin nombre"}
            </h1>

            <div className="mt-3 space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span>{profile?.email || user.email}</span>
              </div>

              {profile?.role && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="capitalize">{profile.role}</span>
                </div>
              )}

              {profile?.storeName && (
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-500" />
                  <span>{profile.storeName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-500">UID: {profile?.uid || user.uid}</span>
              </div>
            </div>

            <button
              onClick={() => getAuth().signOut()}
              className="mt-5 inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
