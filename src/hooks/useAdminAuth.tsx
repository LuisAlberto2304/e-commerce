/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAdminAuth.ts
import { useAuth } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UseAdminAuthReturn {
  user: any | null; // Puedes reemplazar "any" por tu propio tipo de usuario
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAdminAuth = (
  redirectTo: string = "/login"
): UseAdminAuthReturn => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push(redirectTo);
    }
  }, [user, isAdmin, loading, router, redirectTo]);

  return {
    user,
    role,
    isAdmin,
    loading,
    isAuthenticated: !!user && isAdmin,
  };
};
