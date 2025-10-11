'use client'
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/userContext";
import '../styles/globals.css'
import { ShoppingCart, User, LogOut, LogIn, UserPlus } from "lucide-react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout, loading } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Obtener el nombre para mostrar con truncado
  const getDisplayName = () => {
    if (!user) return '';
    
    let displayName = '';
    
    if (user.displayName) {
      displayName = user.displayName;
    } else if (user.email) {
      displayName = user.email.split('@')[0];
    } else {
      return 'Usuario';
    }

    // Truncar nombre si es muy largo
    if (displayName.length > 12) {
      return displayName.substring(0, 12) + '...';
    }
    
    return displayName;
  };

  if (loading) {
    return (
      <header className="header bg-white shadow-sm border-b border-gray-200">
        <div className="header__content">
          <div className="header__brand">
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <path d="M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z" fill="#3B82F6"/>
                <path d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z" fill="#FFFFFF"/>
                <path d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z" fill="#BFDBFE"/>
              </g>
            </svg>
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-800">E-tianguis</h1>
            </Link>
          </div>
          <div className="header__loading text-gray-600">
            Cargando...
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header bg-white shadow-sm border-b border-gray-200">
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
                fill="#3B82F6"
              />
              <path
                d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z"
                fill="#FFFFFF"
              />
              <path
                d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z"
                fill="#BFDBFE"
              />
            </g>
          </svg>
          <Link href="/" onClick={closeMenu}>
            <h1 className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
              E-tianguis
            </h1>
          </Link>
        </div>  

        {/* Navegación */}
        <nav className={`header__nav ${isMenuOpen ? 'header__nav--open' : ''}`}>
          {/* Menú de categorías */}
          <div className="header__categories">
            <Link 
              href="/category" 
              onClick={closeMenu} 
              className="header__category-link text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Todos los productos
            </Link>
          </div>

          {/* Sección de usuario */}
          <div className="header__user-section">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Información del usuario - Mejor organizada */}
                <div className="header__user-info flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                  <User size={18} className="text-blue-600" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Hola,</span>
                    <span className="text-sm font-medium text-gray-800 leading-none">
                      {getDisplayName()}
                    </span>
                  </div>
                </div>
                
                {/* Botón de cerrar sesión */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <div className="header__buttons flex items-center gap-3">
                <Link href="/login" onClick={closeMenu}>
                  <button className="px-4 py-2 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                    <LogIn size={16} />
                    <span className="hidden sm:inline">Entrar</span>
                  </button>
                </Link>
                <Link href="/register" onClick={closeMenu}>
                  <button className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                    <UserPlus size={16} />
                    <span className="hidden sm:inline">Registrarse</span>
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Carrito en el nav - mejor integrado */}
          <Link 
            href="/cart" 
            className="header__cart bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors relative" 
            onClick={closeMenu}
          >
            <ShoppingCart size={20} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="header__cart-badge bg-red-500 text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Carrito para móvil - fuera del nav */}
        <Link 
          href="/cart" 
          className="header__cart-mobile bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors relative"
        >
          <ShoppingCart size={20} className="text-gray-700" />
          {itemCount > 0 && (
            <span className="header__cart-badge bg-red-500 text-white">
              {itemCount}
            </span>
          )}
        </Link>

        {/* Botón menú hamburguesa - Solo en móvil */}
        <button 
          className={`header__menu-toggle ${isMenuOpen ? 'header__menu-toggle--open' : ''} text-gray-700 hover:text-blue-600`}
          onClick={toggleMenu}
          aria-label="Menú principal"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}