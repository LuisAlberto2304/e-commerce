"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";

export default function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="p-50 flex flex-col items-center justify-center bg-white">
      <div className="text-5xl space-x-3.5 p-5 font-bold hover:text-gray-600">
        <Link href="/">
          <h1>
            E-tianguis
          </h1>
        </Link>
      </div>
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 sm:p-10 ">
        <div className="mb-6">
          <Link href="/">
            <p className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm">
              ← Regresar al inicio
            </p>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Iniciar Sesión
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-center">
            <Button variant="primary" size="small" label="Entrar" />
          </div>
        </form>

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
