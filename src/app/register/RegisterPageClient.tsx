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
    <main className="login-page">
      <div className="login-box">
        <div className="mt-0 mb-5">
          <Link href="/">
            <p className="login-top">← Regresar al inicio</p>
          </Link>
        </div>
        <h1 className="login-title">Regístrate</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label htmlFor="nombre" className="login-label">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="login-input mb-5"
              placeholder="Nombre"
              required
            />
          </div>

          <div>
            <label htmlFor="apellidoPaterno" className="login-label">Apellido Paterno</label>
            <input
              id="apellidoPaterno"
              type="text"
              value={apellidoPaterno}
              onChange={(e) => setApellidoPaterno(e.target.value)}
              className="login-input mb-5"
              placeholder="Apellido Paterno"
              required
            />
          </div>

          <div>
            <label htmlFor="apellidoMaterno" className="login-label">Apellido Materno</label>
            <input
              id="apellidoMaterno"
              type="text"
              value={apellidoMaterno}
              onChange={(e) => setApellidoMaterno(e.target.value)}
              className="login-input mb-5"
              placeholder="Apellido Materno"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="login-label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="login-label">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="login-label">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="text-center">
            <Button variant="primary" size="small" label="Entrar" />
          </div>
        </form>

        <p className="login-footer">
          ¿Tienes una cuenta?{" "}
          <Link href="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
