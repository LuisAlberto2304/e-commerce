/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "admin" | "customer"; // Rol opcional
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // 🔹 Si no hay usuario autenticado, redirigir a login
      if (!user) {
        router.replace("/login");
        return;
      }

      // 🔹 Si se requiere un rol específico, validarlo
      const userRole = (user as any)?.role || "customer";
      if (role && userRole !== role) {
        console.warn(`🚫 Acceso denegado: se requiere rol ${role}, pero el usuario es ${userRole}`);
        router.replace("/"); // redirigir al home si no tiene permisos
      }
    }
  }, [user, loading, role, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando acceso...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
