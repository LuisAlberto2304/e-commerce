/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/userContext";
import { ShoppingCart, User, LogOut, LogIn, UserPlus } from "lucide-react";
import ProductSearch from "../components/ProductSearch";
import algoliasearch from "algoliasearch/lite";
import { XCircle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);
const index = searchClient.initIndex("products");


export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout, loading, customer } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUserData = async (uid: string) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data(); // contiene role, name, storeName, etc.
    } else {
      return null;
    }
  };

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

    // 🔍 Búsqueda con Algolia
  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const { hits } = await index.search(q, { hitsPerPage: 5 });
      setResults(hits);
      setShowDropdown(true);
    } catch (err) {
      console.error("Error en búsqueda:", err);
    }
  };

  // Cerrar dropdown si clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        <div className="relative w-full max-w-md" ref={dropdownRef}>
          {/* 🔍 Campo de búsqueda */}
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />

          {/* ❌ Botón de limpiar búsqueda */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setShowDropdown(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-sm transition-all duration-200"
              aria-label="Limpiar búsqueda"
            >
              <XCircle size={18} strokeWidth={2} />
            </button>
          )}

          {/* 🔽 Resultados de búsqueda */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white border rounded shadow-lg max-h-80 overflow-y-auto z-50 mt-1 animate-slide-down">
              {results.map((hit: any) => (
                <Link
                  key={hit.objectID}
                  href={`/products/${hit.objectID}`}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <img
                    src={hit.thumbnail || "/images/placeholder-image.png"}
                    alt={hit.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-[180px] text-gray-800">{hit.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ✨ Animación suave */}
          <style jsx>{`
            .animate-slide-down {
              animation: slideDown 0.2s ease-out forwards;
            }
            @keyframes slideDown {
              0% {
                opacity: 0;
                transform: translateY(-10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
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
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
                {/* Información del usuario */}
                <Link href="/profile">
                  <div className="header__user-info flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-full sm:w-auto justify-center sm:justify-start">
                    <User size={18} className="text-blue-600" />
                    <div className="flex flex-col text-center sm:text-left">
                      <span className="text-xs text-gray-500 leading-none">Hola,</span>
                      <span className="text-sm font-medium text-gray-800 leading-none truncate max-w-[150px] sm:max-w-none">
                        {getDisplayName()}
                      </span>
                    </div>
                  </div>
                </Link>
                {/* Botón de cerrar sesión */}
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="header__buttons flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full">
                <Link href="/login" onClick={closeMenu} className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-4 py-2 text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                    <LogIn size={16} />
                    <span>Entrar</span>
                  </button>
                </Link>
                <Link href="/register" onClick={closeMenu} className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                    <UserPlus size={16} />
                    <span>Registrarse</span>
                  </button>
                </Link>
              </div>
            )}
           {/* Panel admin */}
            {customer?.role === "admin" && (
              <div className="flex gap-4 mt-2">
                <Link href="/admin/page" className="text-blue-600 font-medium">Panel Admin</Link>
                <Link href="/admin/orders" className="text-blue-600 font-medium">Órdenes</Link>
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