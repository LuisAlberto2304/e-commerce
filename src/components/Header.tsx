'use client'
import Link from "next/link";
import { useState } from "react";
import { Button } from './Button'
import '../styles/globals.css'

type User = {
  name: string
}

export interface HeaderProps {
  user?: User
  onLogin?: () => void
  onLogout?: () => void
  onCreateAccount?: () => void
}

export const Header = ({ user, onLogin, onLogout, onCreateAccount }: HeaderProps) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-blue-700 shadow-md">
      {/* Primera fila: logo y login */}
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="none" fillRule="evenodd">
              <path
                d="M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z"
                fill="#FFF"
              />
              <path
                d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z"
                fill="#555AB9"
              />
              <path
                d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z"
                fill="#91BAF8"
              />
            </g>
          </svg>
          <Link href="/">
            <h1 className="text-xl font-bold">E-tianguis</h1>
          </Link>
        </div>

        {/* Botones login/register */}
        <div className="flex gap-3">
          {user ? (
            <>
              <span className="text-gray-700">
                Bienvenido, <b>{user.name}</b>!
              </span>
              <Button size="small" onClick={onLogout} label="Cerrar Sesión" />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" size="medium" label="Iniciar Sesión" />
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="medium" label="Registrarte" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Segunda fila: menú categorías */}
      <nav className="bg-blue-100 border-black border-1">
        <ul className="flex gap-6 px-6 py-3 text-black font-medium justify-center items-center">
          <li>
            <Link href="/category" className="hover:text-blue-600">
              Camisas
            </Link>
          </li>
          <li>
            <Link href="/categoria/electronica" className="hover:text-blue-600">
              Pantalones
            </Link>
          </li>
          <li>
            <Link href="/categoria/hogar" className="hover:text-blue-600">
              Infantil
            </Link>
          </li>
          <li className="relative group">
            <button className="hover:text-blue-600 flex items-center gap-1">
              Más
              <span className="transition-transform duration-200 group-hover:rotate-180">▼</span>
            </button>
            <div className="absolute left-0 mt-2 w-40 z-50 hidden group-hover:block">
              <ul className="relative bg-white border rounded-lg shadow-lg p-2 
                            before:content-[''] before:absolute before:-top-2 before:left-0 
                            before:w-full before:h-2">
                <li>
                  <Link
                    href="/categoria/deportes"
                    className="block px-3 py-2 hover:bg-gray-100"
                  >
                    Deportiva
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categoria/juguetes"
                    className="block px-3 py-2 hover:bg-gray-100"
                  >
                    Trabajo
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categoria/calzado"
                    className="block px-3 py-2 hover:bg-gray-100"
                  >
                    Calzado
                  </Link>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
}
