/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  LogOut,
  Mail,
  User,
  Store,
  Shield,
  Heart,
  Package,
  Settings,
  AlertCircle
} from "lucide-react";
import Image from "next/image";

export function LogoutButton({ handleLogout }: { handleLogout: () => void }) {
  const [showModal, setShowModal] = useState(false);

  const confirmLogout = () => {
    handleLogout();
    setShowModal(false);
  };

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={() => setShowModal(true)}
        className="mt-5 inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">¿Estás seguro?</h2>
            <p className="text-gray-600 mb-5 text-sm">
              ¿Deseas cerrar sesión? Deberás iniciar sesión de nuevo para continuar.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={confirmLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sí, salir
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Inicia sesión para ver tu perfil
        </h2>
        <p className="text-sm text-gray-500">
          Accede a tu cuenta para ver tus datos y tus órdenes.
        </p>
      </div>
    );
  }

  const handleLogout = () => getAuth().signOut();

  return (
    <div className="min-h-screen py-10 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* ENCABEZADO PERFIL */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={user.photoURL || "/images/avatar-placeholder.png"}
              alt="Avatar del usuario"
              width={110}
              height={110}
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
                <span className="text-gray-500">
                  UID: {profile?.uid || user.uid}
                </span>
              </div>
            </div>

           <LogoutButton handleLogout={handleLogout} />
          </div>
        </div>

        {/* SECCIÓN DE ACCESOS RÁPIDOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/profile/orders"
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <Package className="text-indigo-500 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-800">Mis Órdenes</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              Revisa el estado de tus pedidos recientes y su historial.
            </p>
          </Link>

          <Link
            href="/profile/wishlist"
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <Heart className="text-pink-500 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-800">
              Lista de Favoritos
            </h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              Consulta los productos que has guardado para más tarde.
            </p>
          </Link>

          <Link
            href="/settings"
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <Settings className="text-gray-500 mb-3" size={32} />
            <h3 className="text-lg font-semibold text-gray-800">
              Configuración
            </h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              Actualiza tu información personal y preferencias.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
