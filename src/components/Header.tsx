'use client'
import Link from "next/link";
import { useState } from "react";
import { Button } from './Button'
import { useCart } from "@/context/CartContext";
import '../styles/globals.css'
import { ShoppingCart } from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="header">
      {/* Contenedor principal */}
      <div className="header__content">
        {/* Logo y marca */}
        <div className="header__brand">
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
          <Link href="/" onClick={closeMenu}>
            <h1>E-tianguis</h1>
          </Link>
        </div>  

        <Link href="/cart" className="relative">
            <ShoppingCart size={24} className="text-gray-700 hover:text-gray-900" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>



        {/* Botón menú hamburguesa - Solo en móvil */}
        <button 
          className={`header__menu-toggle ${isMenuOpen ? 'header__menu-toggle--open' : ''}`}
          onClick={toggleMenu}
          aria-label="Menú principal"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navegación */}
        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
          {/* Menú de categorías */}
          <div className="header__categories">
            <Link href="/category" onClick={closeMenu} className="header__category-link">
              Todos los productos
            </Link>
            {/* Puedes agregar más categorías aquí */}
          </div>



          {/* Sección de usuario */}
          <div className="header__user-section">
            {user ? (
              <>
                <span className="header__welcome">
                  Bienvenido, <b>{user.name}</b>!
                </span>
                <div className="header__buttons">
                  <Button 
                    size="small" 
                    onClick={() => {
                      onLogout?.();
                      closeMenu();
                    }} 
                    label="Cerrar Sesión" 
                  />
                </div>
              </>
            ) : (
              // Botones estilo glassmorphism
              // Botones con iconos SVG
              <div className="header__buttons">
                <Link href="/login" onClick={closeMenu}>
                  <button className="btn-icon-login">
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Iniciar Sesión</span>
                  </button>
                </Link>
                <Link href="/register" onClick={closeMenu}>
                  <button className="btn-icon-register">
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/>
                      <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Registrarte</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}