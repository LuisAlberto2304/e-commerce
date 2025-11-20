/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/userContext";
import { ShoppingCart, User, LogOut, LogIn, UserPlus } from "lucide-react";
import algoliasearch from "algoliasearch/lite";
import { XCircle } from "lucide-react";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { useRouter } from "next/navigation";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);
const index = searchClient.initIndex("products");

// Tipo para resultados de búsqueda
interface SearchResult {
  type: 'product' | 'store';
  id: string;
  title?: string;
  name?: string;
  storeName?: string;
  thumbnail?: string;
  category?: string;
  slug?: string;
  objectID?: string;
}

// Función helper para convertir a string seguro
const safeToString = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof String) return value.toString();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return value.toString();
  }
  return String(value);
};

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user, logout, loading, customer } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // REFS SEPARADOS para desktop y móvil
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const { role, isAdmin } = useAuth();

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

  // Función para buscar tiendas en Firebase
  const searchStores = async (searchTerm: string): Promise<SearchResult[]> => {
    if (!searchTerm.trim()) return [];

    try {
      console.log('🔍 Buscando tiendas con término:', searchTerm);
      
      const storesQuery = query(
        collection(db, "users"),
        where("role", "==", "seller"),
        limit(3)
      );
      
      console.log('✅ Query creada correctamente');
      
      const storesSnapshot = await getDocs(storesQuery);
      console.log('📊 Documentos encontrados:', storesSnapshot.size);
      
      const results: SearchResult[] = [];
      
      storesSnapshot.forEach((doc) => {
        const storeData = doc.data();
        console.log('📝 Datos del documento:', storeData);
        
        // Hacer type assertion
        const data = storeData as any;
        
        // Convertir a string de forma segura usando template literals
        const storeName = `${data?.storeName || ''}`;
        const sellerName = `${data?.name || ''}`;
        
        console.log('🏪 Tienda procesada:', { storeName, sellerName });
        
        // Buscar coincidencias
        const searchLower = searchTerm.toLowerCase();
        const matchesStoreName = storeName.toLowerCase().includes(searchLower);
        const matchesSellerName = sellerName.toLowerCase().includes(searchLower);
        
        if (matchesStoreName || matchesSellerName) {
          const slug = storeName.toLowerCase().replace(/\s+/g, '-');
          
          results.push({
            type: 'store',
            id: doc.id,
            name: storeName,
            storeName: storeName,
            title: storeName,
            slug: slug,
            category: 'Tienda'
          });
        }
      });
      
      console.log('✅ Resultados de tiendas:', results);
      return results;
    } catch (error) {
      console.error('❌ Error searching stores:', error);
      return [];
    }
  };

  // 🔍 Búsqueda unificada con Algolia y Firebase
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    
    if (!q.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    setShowDropdown(true);
    
    try {
      const allResults: SearchResult[] = [];

      // 1. Buscar productos con Algolia
      try {
        console.log('🔍 Buscando productos en Algolia...');
        const { hits } = await index.search(q, { hitsPerPage: 3 });
        const productResults: SearchResult[] = hits.map((hit: any) => ({
          type: 'product',
          id: safeToString(hit.objectID),
          objectID: safeToString(hit.objectID),
          title: safeToString(hit.title || ''),
          thumbnail: safeToString(hit.thumbnail || ''),
          category: safeToString(hit.category || "Producto")
        }));
        allResults.push(...productResults);
        console.log('✅ Productos encontrados:', productResults.length);
      } catch (algoliaError) {
        console.error("❌ Error en búsqueda de Algolia:", algoliaError);
      }

      // 2. Buscar tiendas con Firebase
      try {
        console.log('🔍 Buscando tiendas en Firebase...');
        const storeResults = await searchStores(q);
        allResults.push(...storeResults);
        console.log('✅ Tiendas encontradas:', storeResults.length);
      } catch (firestoreError) {
        console.error("❌ Error en búsqueda de tiendas:", firestoreError);
      }

      // Ordenar resultados (tiendas primero, luego productos)
      allResults.sort((a, b) => {
        if (a.type === 'store' && b.type === 'product') return -1;
        if (a.type === 'product' && b.type === 'store') return 1;
        return 0;
      });

      setResults(allResults);
      console.log('🎯 Resultados totales:', allResults.length);
    } catch (error) {
      console.error('❌ Error en búsqueda unificada:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Función para manejar clic en resultado - SOLUCIÓN 3 IMPLEMENTADA
  const handleResultClick = (result: SearchResult) => {
    console.log('🎯 Clic en resultado:', result);
    
    // Limpiar estados primero
    setSearchQuery("");
    setResults([]);
    setShowDropdown(false);
    if (isMenuOpen) closeMenu();

    // Navegar usando el router de Next.js después de limpiar estados
    setTimeout(() => {
      if (result.type === 'store' && result.slug) {
        console.log('📍 Navegando a tienda:', `/store/${result.slug}`);
        router.push(`/store/${result.slug}`);
      } else if (result.type === 'product' && result.objectID) {
        console.log('📍 Navegando a producto:', `/products/${result.objectID}`);
        router.push(`/products/${result.objectID}`);
      } else {
        console.warn('⚠️ Resultado no válido para navegación:', result);
      }
    }, 100);
  };

  // Cerrar dropdown si clic fuera - PARA DESKTOP
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = desktopDropdownRef.current && 
        !desktopDropdownRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileDropdownRef.current && 
        !mobileDropdownRef.current.contains(event.target as Node);
      
      if (isOutsideDesktop && isOutsideMobile) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y menú hamburguesa */}
          <div className="flex items-center gap-4">
            {/* Botón menú hamburguesa - Solo móvil */}
            <button 
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              onClick={toggleMenu}
              aria-label="Menú principal"
            >
              <div className="w-6 flex flex-col gap-1">
                <span className={`h-0.5 w-full bg-current transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>

            {/* Logo y marca */}
            <div className="header__brand flex items-center gap-3">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
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
              <Link href="/" className="hover:no-underline">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                  E-tianguis
                </h1>
              </Link>
            </div>
          </div>

          {/* Barra de búsqueda - Oculto en móvil, visible en tablet+ */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <div className="relative" ref={desktopDropdownRef}>
              <div className="flex items-center bg-amber-100 border border-brown rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-brown transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-brown ml-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    if (results.length > 0 || searchQuery) {
                      setShowDropdown(true);
                    }
                  }}
                  placeholder="Buscar productos o tiendas..."
                  className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none px-3 py-2 rounded-r-2xl w-full"
                />

                {/* Loading spinner */}
                {searching && (
                  <div className="mr-3 flex-shrink-0">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brown"></div>
                  </div>
                )}

                {searchQuery && !searching && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setResults([]);
                      setShowDropdown(false);
                    }}
                    className="mr-3 text-black hover:text-brown transition-colors flex-shrink-0"
                    aria-label="Limpiar búsqueda"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>

              {/* DROPDOWN DE RESULTADOS DESKTOP */}
              {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-brown rounded-xl shadow-lg max-h-80 overflow-y-auto z-50 mt-2 animate-fadeIn backdrop-blur-sm">
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 p-3 hover:bg-brown/10 transition-all rounded-lg group cursor-pointer border-b border-brown/10 last:border-b-0"
                    >
                      {/* Icono según tipo */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${
                        result.type === 'store' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {result.type === 'store' ? '🏪' : '🛍️'}
                      </div>
                      
                      {/* Imagen para productos */}
                      {result.type === 'product' && result.thumbnail && (
                        <img
                          src={result.thumbnail || "/images/placeholder-image.png"}
                          alt={result.title}
                          className="w-10 h-10 object-cover rounded-md border border-brown flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/placeholder-image.png";
                          }}
                        />
                      )}
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">
                          {result.type === 'store' ? result.storeName : result.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.type === 'store' 
                            ? `Tienda`
                            : `${result.category || 'Producto'}`
                          }
                        </p>
                      </div>
                      
                      {/* Badge de tipo */}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        result.type === 'store'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {result.type === 'store' ? 'Tienda' : 'Producto'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {showDropdown && results.length === 0 && !searching && searchQuery && (
                <div className="absolute top-full left-0 w-full bg-white border border-brown rounded-xl shadow-lg z-50 mt-2 p-4 text-center">
                  <p className="text-gray-500">No se encontraron resultados</p>
                </div>
              )}
            </div>
          </div>

          {/* Navegación Desktop - Solo visible en desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Menú de categorías */}
            <div className="header__categories">
              <Link 
                href="/category" 
                className="text-gray-700 hover:text-brown transition-colors font-medium"
              >
                Todos los productos
              </Link>  
            </div>

            {/* Sección de usuario Desktop */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* Información del usuario */}
                  <Link href="/profile">
                    <div className="header__user-info flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer">
                      <User size={18} className="text-brown" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 leading-none">Hola,</span>
                        <span className="text-sm font-medium text-gray-800 leading-none max-w-[120px] truncate">
                          {getDisplayName()}
                        </span>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Enlaces de admin y seller */}
                  <div className="flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
                    {/* Panel de Seller */}
                    {(role === "seller" || role === "admin") && (
                      <Link
                        href="/seller/dashboard"
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:shadow-md transition-all"
                      >
                        🏪 Mi Tienda
                      </Link>
                    )}
                    
                    {/* Panel de Admin */}
                    {role === "admin" && (
                      <>
                        <Link
                          href="/admin"
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:shadow-md transition-all"
                        >
                          👑 Panel Admin
                        </Link>

                        <Link
                          href="/admin/returns"
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white shadow-sm border border-gray-100 hover:shadow-md hover:bg-gray-50 transition-all text-black"
                        >
                          🔄 Reembolsos
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Botón de cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2 transition-all flex items-center gap-2 text-sm font-medium cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Salir</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <button className="px-4 py-2 text-brown bg-white border border-brown rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2 transition-all flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <LogIn size={16} />
                      <span>Entrar</span>
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-4 py-2 text-white bg-brown border border-brown rounded-lg hover:bg-rosa focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2 transition-all flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <UserPlus size={16} />
                      <span>Registrarse</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Carrito Desktop */}
            <Link 
              href="/cart" 
              className="relative p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} className="text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Carrito Móvil - Solo visible en móvil */}
          <Link 
            href="/cart" 
            className="lg:hidden relative p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <ShoppingCart size={20} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Barra de búsqueda móvil - Solo visible en móvil */}
        <div className="md:hidden pb-3 px-2">
          <div className="relative" ref={mobileDropdownRef}>
            <div className="flex items-center bg-amber-100 border border-brown rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-brown transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-brown ml-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (results.length > 0 || searchQuery) {
                    setShowDropdown(true);
                  }
                }}
                placeholder="Buscar productos o tiendas..."
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none px-3 py-2 rounded-r-2xl w-full"
              />

              {/* Loading spinner móvil */}
              {searching && (
                <div className="mr-3 flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brown"></div>
                </div>
              )}

              {searchQuery && !searching && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setResults([]);
                    setShowDropdown(false);
                  }}
                  className="mr-3 text-black hover:text-brown transition-colors flex-shrink-0"
                  aria-label="Limpiar búsqueda"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>

            {/* Barra de búsqueda móvil - Dropdown CORREGIDO */}
            {showDropdown && results.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-brown rounded-xl shadow-lg max-h-80 overflow-y-auto z-50 mt-2 animate-fadeIn backdrop-blur-sm">
                {results.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="flex items-center gap-3 p-3 hover:bg-brown/10 transition-all rounded-lg cursor-pointer border-b border-brown/10 last:border-b-0"
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                      result.type === 'store' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {result.type === 'store' ? '🏪' : '🛍️'}
                    </div>
                    
                    {result.type === 'product' && result.thumbnail && (
                      <img
                        src={result.thumbnail || "/images/placeholder-image.png"}
                        alt={result.title}
                        className="w-8 h-8 object-cover rounded-md border border-brown flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/placeholder-image.png";
                        }}
                      />
                    )}
                    
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">
                        {result.type === 'store' ? result.storeName : result.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.type === 'store' ? 'Tienda' : result.category || 'Producto'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showDropdown && results.length === 0 && !searching && searchQuery && (
              <div className="absolute top-full left-0 w-full bg-white border border-brown rounded-xl shadow-lg z-50 mt-2 p-4 text-center">
                <p className="text-gray-500">No se encontraron resultados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      <div className={`lg:hidden fixed inset-0 z-40 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeMenu}
        ></div>
        
        {/* Panel del menú */}
        <div className="relative bg-white w-80 max-w-full h-full overflow-y-auto shadow-xl">
          <div className="p-6 space-y-6">
            
            {/* Encabezado del menú móvil */}
            <div className="flex items-center justify-between border-b pb-4">
              <button 
                onClick={closeMenu}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Navegación móvil */}
            <nav className="space-y-4">
              {/* Categorías */}
              <div className="header__categories">
                <Link 
                  href="/category" 
                  onClick={closeMenu} 
                  className="block py-3 px-4 text-black bg-brown hover:text-brown hover:bg-amber-50 rounded-lg transition-colors font-medium border border-gray-100"
                >
                  Todos los productos
                </Link>  
              </div>

              {/* Sección de usuario */}
              <div className="header__user-section space-y-4 pt-4 border-t">
                {user ? (
                  <div className="space-y-4">
                    {/* Información del usuario */}
                    <Link href="/profile" onClick={closeMenu}>
                      <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                        <User size={20} className="text-brown" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Hola,</span>
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {getDisplayName()}
                          </span>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Enlaces de admin y seller para móvil */}
                    {(role === "seller" || role === "admin") && (
                      <div className="space-y-2 bg-green-50 p-3 rounded-lg border border-green-200">
                        <Link 
                          href="/seller/dashboard" 
                          onClick={closeMenu} 
                          className="block py-2 text-green-700 font-medium hover:text-green-800 transition-colors flex items-center gap-2"
                        >
                          <span>🏪</span>
                          <span>Mi Tienda</span>
                        </Link>
                      </div>
                    )}
                    
                    {role === "admin" && (
                      <div className="space-y-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <Link 
                          href="/admin" 
                          onClick={closeMenu} 
                          className="block py-2 text-purple-700 font-medium hover:text-purple-800 transition-colors flex items-center gap-2"
                        >
                          <span>👑</span>
                          <span>Panel Admin</span>
                        </Link>
                        <Link 
                          href="/admin/returns" 
                          onClick={closeMenu} 
                          className="block py-2 text-purple-700 font-medium hover:text-purple-800 transition-colors flex items-center gap-2"
                        >
                          <span>🔄</span>
                          <span>Reembolsos</span>
                        </Link>
                      </div>
                    )}
                    
                    {/* Botón de cerrar sesión */}
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>Salir</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" onClick={closeMenu} className="block">
                      <button className="w-full px-4 py-3 text-brown bg-white border border-brown rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                        <LogIn size={16} />
                        <span>Entrar</span>
                      </button>
                    </Link>
                    <Link href="/register" onClick={closeMenu} className="block">
                      <button className="w-full px-4 py-3 text-white bg-brown border border-brown rounded-lg hover:bg-rosa flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                        <UserPlus size={16} />
                        <span>Registrarse</span>
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}