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
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* SECCIÓN DE PERFIL REFINADA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Encabezado con gradiente */}
          <div className="relative h-36 bg-gradient-to-r from-blue-600 to-blue-700">
            {/* Avatar centrado y estable */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30 blur-md"></div>
                <Image
                  src={user.photoURL || "/images/avatar-placeholder.png"}
                  alt="Avatar"
                  width={120}
                  height={120}
                  className="relative rounded-full object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="px-6 pt-14 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

              {/* Nombre + rol */}
              <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.name || "Usuario sin nombre"}
                </h1>

                <div className="flex items-center gap-3 mt-2">
                  {profile?.role && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                      {profile.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout alineado */}
              <LogoutButton handleLogout={handleLogout} />
            </div>

            {/* Información del perfil */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Columna izquierda */}
              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Email</p>
                    <p className="font-medium text-gray-900">{profile?.email || user.email}</p>
                  </div>
                </div>

                {/* Tienda */}
                {profile?.storeName && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Tienda</p>
                      <p className="font-medium text-gray-900">{profile.storeName}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha */}
              <div className="space-y-3">
                
                {/* UID */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">ID de usuario</p>
                    <p className="font-mono text-xs text-gray-900 truncate max-w-xs">
                      {profile?.uid || user.uid}
                    </p>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Estado</p>
                    <p className="font-medium text-green-600">Verificado</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>


        {/* SECCIÓN DE ACCESOS RÁPIDOS MEJORADA */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Acciones rápidas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/profile/orders"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Mis Órdenes
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Revisa el estado de tus pedidos y historial de compras
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium mt-3">
                    Ver órdenes
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/profile/wishlist"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-pink-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                    Lista de Favoritos
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Productos guardados para comprar más tarde
                  </p>
                  <div className="flex items-center text-pink-600 text-sm font-medium mt-3">
                    Ver favoritos
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              href="/settings"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    Configuración
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Actualiza tu información personal y preferencias
                  </p>
                  <div className="flex items-center text-gray-600 text-sm font-medium mt-3">
                    Configurar
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
