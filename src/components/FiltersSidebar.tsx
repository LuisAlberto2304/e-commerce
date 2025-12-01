/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { 
  X, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Palette,
  Ruler,
  Tag,
  Sparkles,
  Star,
  DollarSign,
  Zap
} from "lucide-react";

import { Filters } from "@/app/types/filters";


type FiltersSidebarProps = {
  categories: { id: string; name: string }[];
  filters: Filters;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  availableColors?: string[];
  availableSizes?: string[];
  availableBrands?: string[];
  priceRange?: { min: number; max: number };
};

export default function FiltersSidebar({
  categories,
  filters,
  searchTerm,
  onSearchChange,
  setFilters,
  availableColors = [],
  availableSizes = [],
  availableBrands = [],
  priceRange = { min: 0, max: 1000 }
}: FiltersSidebarProps) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    categories: true,
    price: true,
    rating: true,
    condition: true,
    brand: true,
    color: true,
    size: true
  });
  
  const [categorySearch, setCategorySearch] = useState("");
  
  const safeCategories = Array.isArray(categories) ? categories : [];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filtrar categorías basado en búsqueda
  const filteredCategories = safeCategories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Función para manejar filtros de array
  const handleArrayFilterChange = (key: 'color' | 'size' | 'brand' | 'condition', value: string) => {
    setFilters((prev) => {
      const current = prev[key] ?? [];
      const alreadySelected = current.includes(value);

      const updated = alreadySelected
        ? current.filter((item: string) => item !== value)
        : [...current, value];

      return { 
        ...prev, 
        [key]: updated.length > 0 ? updated : undefined 
      };
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setFilters((prev) => {
      const current = prev.categories ?? [];
      const alreadySelected = current.includes(categoryId);

      const updated = alreadySelected
        ? current.filter((id: string) => id !== categoryId)
        : [...current, categoryId];

      return { ...prev, categories: updated.length > 0 ? updated : undefined };
    });
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max }
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      rating: prev.rating === rating ? undefined : rating
    }));
  };

  const clearAllFilters = () => setFilters({});
  
  // Verificar si hay filtros activos
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof Filters];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (key === 'priceRange' && value) {
      const priceRange = value as { min: number; max: number };
      return priceRange.min !== priceRange.min || priceRange.max !== priceRange.max;
    }
    return value !== undefined && value !== '';
  });

  // Componente para secciones de filtro
  const FilterSection = ({ 
    title, 
    icon: Icon, 
    children, 
    sectionKey 
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    sectionKey: keyof typeof expandedSections;
  }) => (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-brown" />
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
        </div>
        {expandedSections[sectionKey] ? 
          <ChevronUp size={16} className="text-gray-400" /> : 
          <ChevronDown size={16} className="text-gray-400" />
        }
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="pt-2 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );

  // Componente para estrellas de rating
  const RatingStars = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors" 
           onClick={() => onRatingChange(rating)}>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={star <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600 ml-1">y más</span>
      </div>
    );
  };

  const sidebarContent = (
    <div className="p-6 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-brown to-amber-800 rounded-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">Filtros</h2>
            <p className="text-xs text-gray-500">Encuentra lo que buscas</p>
          </div>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-brown hover:text-amber-700 font-medium px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Categorías con búsqueda - Estilo Amazon */}
      <FilterSection title="Categorías" icon={Tag} sectionKey="categories">
        <div className="space-y-0 max-h-60 overflow-y-auto custom-scrollbar border border-gray-200 rounded">
          <label
            className={`flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 transition-colors ${
              !filters.categories || filters.categories.length === 0
                ? "bg-amber-50 text-amber-700 font-medium"
                : "text-gray-700"
            }`}
          >
            <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
              !filters.categories || filters.categories.length === 0
                ? "bg-amber-500 border-amber-500"
                : "border-gray-400"
            }`}>
              {(!filters.categories || filters.categories.length === 0) && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={!filters.categories || filters.categories.length === 0}
              onChange={() => setFilters((prev) => ({ ...prev, categories: undefined }))}
              className="hidden"
            />
            <span className="text-sm">Todos las categorías</span>
          </label>

          {filteredCategories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 transition-colors ${
                filters.categories?.includes(cat.id)
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-gray-700"
              }`}
            >
              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                filters.categories?.includes(cat.id)
                  ? "bg-amber-500 border-amber-500"
                  : "border-gray-400"
              }`}>
                {filters.categories?.includes(cat.id) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                value={cat.id}
                checked={filters.categories?.includes(cat.id) ?? false}
                onChange={() => handleCategoryChange(cat.id)}
                className="hidden"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
          {filteredCategories.length === 0 && (
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500">No se encontraron categorías</p>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Color - Estilo Amazon */}
      <FilterSection title="Color" icon={Palette} sectionKey="color">
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
          {availableColors.map((color) => (
            <label
              key={color}
              className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition-all ${
                filters.color?.includes(color)
                  ? "border-amber-500 bg-amber-50 shadow-sm"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${
                filters.color?.includes(color)
                  ? "bg-amber-500 border-amber-500"
                  : "border-gray-400"
              }`}>
                {filters.color?.includes(color) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={filters.color?.includes(color) || false}
                onChange={() => handleArrayFilterChange('color', color)}
                className="hidden"
              />
              <span className="text-sm flex-1">{color}</span>
            </label>
          ))}
          {availableColors.length === 0 && (
            <div className="col-span-2 p-3 text-center">
              <p className="text-xs text-gray-500">No hay colores disponibles</p>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Talla - Estilo Amazon */}
      <FilterSection title="Tamaño" icon={Ruler} sectionKey="size">
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
          {availableSizes.map((size) => (
            <label
              key={size}
              className={`inline-flex items-center justify-center cursor-pointer px-3 py-2 rounded border transition-all min-w-12 ${
                filters.size?.includes(size)
                  ? "border-amber-500 bg-amber-50 text-amber-700 font-medium shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={filters.size?.includes(size) || false}
                onChange={() => handleArrayFilterChange('size', size)}
                className="hidden"
              />
              <span className="text-sm">{size}</span>
            </label>
          ))}
          {availableSizes.length === 0 && (
            <div className="w-full p-3 text-center">
              <p className="text-xs text-gray-500">No hay tallas disponibles</p>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Precio - Estilo Amazon */}
      <FilterSection title="Precio" icon={DollarSign} sectionKey="price">
        <div className="space-y-4">
          {/* Inputs para precio mínimo y máximo */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-600 mb-1 block">Mínimo</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minPrice: e.target.value ? Number(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 mb-1 block">Máximo</label>
              <input
                type="number"
                placeholder="1000"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  maxPrice: e.target.value ? Number(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Rango de precios predefinido */}
          <div className="space-y-2">
            {[
              { label: "Hasta $50", min: 0, max: 50 },
              { label: "$50 - $100", min: 50, max: 100 },
              { label: "$100 - $200", min: 100, max: 200 },
              { label: "$200 - $500", min: 200, max: 500 },
              { label: "Más de $500", min: 500, max: 9999 }
            ].map((range) => (
              <button
                key={range.label}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    minPrice: range.min,
                    maxPrice: range.max
                  }));
                }}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                  filters.minPrice === range.min && filters.maxPrice === range.max
                    ? "bg-amber-50 border-amber-500 text-amber-700 font-medium"
                    : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Rating - Estilo Amazon */}
      <FilterSection title="Calificación" icon={Star} sectionKey="rating">
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition-all ${
                filters.rating === rating
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= rating 
                        ? "text-amber-500 fill-amber-500" 
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm">
                {rating === 5 ? "5 estrellas" : `${rating} estrellas y más`}
              </span>
              
              {filters.rating === rating && (
                <div className="ml-auto w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
          
          {/* Opción para limpiar filtro de rating */}
          {filters.rating && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, rating: undefined }))}
              className="w-full text-center px-3 py-2 text-sm text-amber-600 hover:text-amber-700 font-medium hover:bg-amber-50 rounded-lg transition-colors mt-2"
            >
              Limpiar calificación
            </button>
          )}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop - Sidebar */}
      <aside className="hidden md:block w-80 bg-white h-screen sticky top-0 shadow-lg overflow-y-auto custom-scrollbar border-r border-gray-200">
        {sidebarContent}
      </aside>

      {/* Mobile - Bottom Sheet */}
      <div className="md:hidden">
        {/* FAB Button */}
        {!open && (
          <div className="fixed bottom-6 right-6 z-[9999]">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-brown to-amber-800 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <SlidersHorizontal size={20} />
              <span className="font-semibold">Filtros</span>
              {hasActiveFilters && (
                <span className="bg-white text-brown text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-1">
                  {Object.keys(filters).filter(key => {
                    const value = filters[key as keyof Filters];
                    if (Array.isArray(value)) return value.length > 0;
                    if (key === 'priceRange' && value) {
                      const priceRange = value as { min: number; max: number };
                      return priceRange.min !== priceRange.min || priceRange.max !== priceRange.max;
                    }
                    return value !== undefined && value !== '';
                  }).length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Mobile Overlay */}
        {open && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            
            {/* Bottom Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slideUp">
              {/* Header */}
              <div className="pt-4 px-4">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
                <div className="flex justify-between items-center pb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-brown" />
                    <h2 className="font-bold text-lg">Filtros</h2>
                    {hasActiveFilters && (
                      <span className="bg-amber-100 text-brown text-xs font-bold rounded-full px-2 py-1">
                        {Object.keys(filters).filter(key => {
                          const value = filters[key as keyof Filters];
                          if (Array.isArray(value)) return value.length > 0;
                          if (key === 'priceRange' && value) {
                            const priceRange = value as { min: number; max: number };
                            return priceRange.min !== priceRange.min || priceRange.max !== priceRange.max;
                          }
                          return value !== undefined && value !== '';
                        }).length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                {sidebarContent}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-white sticky bottom-0">
                <div className="flex gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className={`py-3 bg-gradient-to-r from-brown to-amber-700 text-white font-medium rounded-xl hover:shadow-lg transition-all ${
                      hasActiveFilters ? 'flex-1' : 'w-full'
                    }`}
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
}