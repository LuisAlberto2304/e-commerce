/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useAuth } from "@/context/userContext";
import { syncMedusaCustomerWithFirebase } from "@/utils/syncMedusaCustomer";
import { loginMedusaCustomer } from "@/utils/medusaAuth";

export default function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithGoogle, loginMedusa } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticar en Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuario autenticado en Firebase:", userCredential.user.email);

      // 2. Esperar un momento para que Firebase actualice el estado
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Sincronizar con Medusa
      try {
        await syncMedusaCustomerWithFirebase();
        console.log("Usuario sincronizado con Medusa");
      } catch (syncError: any) {
        console.error("Error al sincronizar con Medusa:", syncError);
        // No bloqueamos el login si falla la sincronización
      }

      // 4. Autenticar en Medusa y guardar el token
      try {
        const medusaToken = await loginMedusa(email, password);
        console.log("Usuario autenticado en Medusa");
      } catch (err) {
        console.error("Error autenticando en Medusa:", err);
      }

      // 5. Redirigir
      router.push('/');
      
    } catch (error: any) {
      console.error("Error en login:", error);
      
      // Manejar errores específicos de Firebase
      switch (error.code) {
        case "auth/invalid-email":
          setError("El correo electrónico no es válido");
          break;
        case "auth/user-disabled":
          setError("Esta cuenta ha sido deshabilitada");
          break;
        case "auth/user-not-found":
          setError("No existe una cuenta con este correo electrónico");
          break;
        case "auth/wrong-password":
          setError("La contraseña es incorrecta");
          break;
        case "auth/invalid-credential":
          setError("Credenciales inválidas. Verifica tu correo y contraseña");
          break;
        case "auth/too-many-requests":
          setError("Demasiados intentos fallidos. Intenta más tarde");
          break;
        default:
          setError("Error al iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 1. Autenticar con Google
      await signInWithGoogle();
      
      // 2. Esperar a que Firebase actualice el estado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. Sincronizar con Medusa
      try {
        await syncMedusaCustomerWithFirebase();
        console.log("Usuario de Google sincronizado con Medusa");
      } catch (syncError: any) {
        console.error("Error al sincronizar Google con Medusa:", syncError);
        // No bloqueamos el login
      }
      
      // La redirección se maneja en el contexto o aquí
      router.push('/');
      
    } catch (error: any) {
      console.error("Error con Google Sign-In:", error);
      
      if (error.message?.includes('no está habilitado')) {
        setError("El inicio de sesión con Google no está configurado correctamente.");
      } else if (error.message?.includes('popup fue bloqueado')) {
        setError("El popup de Google fue bloqueado. Permite popups para este sitio.");
      } else if (error.message?.includes('Cerraste la ventana')) {
        setError("Cerraste la ventana de inicio de sesión de Google.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError("Cerraste la ventana de Google antes de completar el inicio de sesión.");
      } else {
        setError("Error al iniciar sesión con Google");
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para alternar la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Header */}
      <div className="w-full max-w-md mb-4 sm:mb-6">
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-center hover:text-gray-600 transition-colors">
          <Link href="/">
            <h1>E-tianguis</h1>
          </Link>
        </div>
      </div>
      
      {/* Form Container */}
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-5 sm:p-6 md:p-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/">
            <p className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Regresar al inicio
            </p>
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Iniciar Sesión
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown
                         text-base"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown pr-10
                         text-base"
              autoComplete="current-password"
            />
            {/* Botón para mostrar/ocultar contraseña */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-2 top-1/2 transform -translate-y-1/4 p-1"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-500 hover:text-blue-700 font-medium">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full px-4 py-3 text-white bg-brown rounded-lg 
                hover:bg-rosa focus:outline-none focus:ring-2 focus:ring-brown
                focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                font-medium text-base
                transition-all duration-200
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </div>
        </form>

        {/* Separator */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O inicia sesión con</span>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`
                w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg 
                shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
              `}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </div>
        </div>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-blue-500 hover:text-blue-700 font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}