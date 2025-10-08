"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";

export default function RegisterLoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    console.log({ nombre, apellidoPaterno, apellidoMaterno, email, password });
  };

  return (
    <div className="p-50 flex flex-col items-center justify-center bg-white min-h-screen">
      {/* 🔹 Título principal */}
      <div className="text-5xl space-x-3.5 p-5 font-bold hover:text-gray-600">
        <Link href="/">
          <h1>E-tianguis</h1>
        </Link>
      </div>

      {/* 🔹 Caja del formulario */}
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 sm:p-10">
        {/* 🔹 Volver al inicio */}
        <div className="mb-6">
          <Link href="/">
            <p className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm">
              ← Regresar al inicio
            </p>
          </Link>
        </div>

        {/* 🔹 Título del formulario */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Regístrate
        </h1>

        {/* 🔹 Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="apellidoPaterno" className="block text-sm font-medium text-gray-700 mb-2">
              Apellido Paterno
            </label>
            <input
              id="apellidoPaterno"
              type="text"
              value={apellidoPaterno}
              onChange={(e) => setApellidoPaterno(e.target.value)}
              placeholder="Apellido Paterno"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="apellidoMaterno" className="block text-sm font-medium text-gray-700 mb-2">
              Apellido Materno
            </label>
            <input
              id="apellidoMaterno"
              type="text"
              value={apellidoMaterno}
              onChange={(e) => setApellidoMaterno(e.target.value)}
              placeholder="Apellido Materno"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-center">
            <Button variant="primary" size="small" label="Registrarse" />
          </div>
        </form>

        {/* 🔹 Enlace a login */}
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
