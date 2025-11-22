/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

import { useAuth } from "@/context/userContext";
import { syncMedusaCustomerWithFirebase } from "@/utils/syncMedusaCustomer";

import { saveUserToFirestore } from "../lib/firestoreHelpers";

export default function RegisterLoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [role, setRole] = useState("buyer");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false); // Nuevo estado para términos

  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  function handleCredentials(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones para registrarte");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Registrar usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Actualizar perfil de Firebase (nombre completo)
      const fullName = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`;
      await updateProfile(user, { displayName: fullName });

      // 3️⃣ Guardar datos en Firestore
      await saveUserToFirestore(
        {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || "",
        },
        {
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          role: role as "buyer" | "seller" | "admin",
          storeName: role === "seller" ? storeName : "",
        }
      );

      // 4️⃣ Sincronizar con Medusa (opcional)
      try {
        await syncMedusaCustomerWithFirebase();
      } catch (syncError) {
        console.error("Error al sincronizar con Medusa:", syncError);
      }

      alert("Cuenta creada exitosamente ✅");
      router.push("/");
    } catch (error: any) {
      console.error("Error en registro:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Este correo electrónico ya está en uso");
          break;
        case "auth/invalid-email":
          setError("El correo electrónico no es válido");
          break;
        case "auth/weak-password":
          setError("La contraseña es demasiado débil");
          break;
        default:
          setError("Error al registrar usuario. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!acceptedTerms) {
        setError("Debes aceptar los términos y condiciones para registrarte");
        return;
      }

      setLoading(true);
      setError("");

      console.log('🔵 Intentando registrarse con Google...');

      // 1. Autenticar con Google
      await signInWithGoogle();

      // 2. Esperar a que Firebase actualice el estado
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Sincronizar con Medusa
      try {
        await syncMedusaCustomerWithFirebase();
        console.log("✅ Usuario de Google registrado en Medusa");
      } catch (syncError: any) {
        console.error("❌ Error al sincronizar Google con Medusa:", syncError);
        // No bloqueamos el registro
      }

      // 4. Redirigir
      router.push("/");

    } catch (error: any) {
      console.error("❌ Error con Google Sign-In:", error);
      console.error('Error completo:', JSON.stringify(error, null, 2));

      // Mostrar mensaje de error más específico
      if (error.message) {
        setError(error.message);
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError("Cerraste la ventana de Google antes de completar el registro.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("El popup fue bloqueado por tu navegador. Por favor, permite popups para este sitio y vuelve a intentarlo.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError("Se canceló la solicitud. Intenta nuevamente.");
      } else {
        setError("Error al registrarse con Google. Verifica tu conexión e inténtalo nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Funciones para alternar la visibilidad de contraseñas
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="p-50 flex flex-col items-center justify-center bg-bg min-h-screen">
      <div className="text-5xl space-x-3.5 p-5 font-bold hover:text-gray-600">
        <Link href="/">
          <h1>E-tianguis</h1>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 sm:p-10">
        <div className="mb-6">
          <Link href="/">
            <p className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm">
              ← Regresar al inicio
            </p>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Regístrate
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields - Grid para móvil */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                required
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown
                           text-base"
              />
            </div>

            <div className="sm:col-span-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="apellidoPaterno" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno
                </label>
                <input
                  id="apellidoPaterno"
                  name="apellidoPaterno"
                  type="text"
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  placeholder="Apellido Paterno"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                             focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown
                             text-base"
                />
              </div>

              <div>
                <label htmlFor="apellidoMaterno" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno
                </label>
                <input
                  id="apellidoMaterno"
                  name="apellidoMaterno"
                  type="text"
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  placeholder="Apellido Materno"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleCredentials}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown"
                />
              </div>

              {/* Selección de tipo de usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de cuenta
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown
                         text-base"
                >
                  <option value="buyer">Comprador</option>
                  <option value="seller">Vendedor</option>
                </select>
              </div>

              {role === "seller" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la tienda
                  </label>
                  <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown
                           text-base"
                    placeholder="Ej. Mi Tienda Artesanal"
                  />
                </div>
              )}

              {/* Campo de contraseña con botón de visibilidad */}
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleCredentials}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6"
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

              {/* Campo de confirmar contraseña con botón de visibilidad */}
              <div className="relative">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-brown focus:border-brown pr-10"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
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

              {/* Checkbox de términos y condiciones */}
              <div className="flex items-start space-x-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-brown focus:ring-brown border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  Acepto los{" "}
                  <Link href="/useTerms" className="text-blue-500 hover:text-blue-700 font-medium">
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacity" className="text-blue-500 hover:text-blue-700 font-medium">
                    Política de Privacidad
                  </Link>
                </label>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading || !acceptedTerms}
                  className={`
                w-full px-4 py-3 text-white bg-brown rounded-lg 
                hover:bg-rosa focus:outline-none focus:ring-2 focus:ring-brown
                focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                font-medium
                ${(loading || !acceptedTerms) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                >
                  {loading ? "Registrando..." : "Registrarse"}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O regístrate con</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || !acceptedTerms}
              className={`
                w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg 
                shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                disabled:opacity-50 disabled:cursor-not-allowed
                ${(loading || !acceptedTerms) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>
          </div>
        </div>


        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
