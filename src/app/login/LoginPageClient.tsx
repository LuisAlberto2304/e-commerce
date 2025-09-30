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
    <main className="login-page">
      <div className="login-box">
        <div className="mt-0 mb-5">
          <Link href="/">
            <p className="login-top">← Regresar al inicio</p>
          </Link>
        </div>

        <h1 className="login-title">Iniciar Sesión</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label htmlFor="email" className="login-label">
              Correo electrónico
            </label>
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
            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
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

          <div className="text-center">
            <Button variant="primary" size="small" label="Entrar" />
          </div>
        </form>

        <p className="login-footer">
          ¿No tienes cuenta?{" "}
          <Link href="/register">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
