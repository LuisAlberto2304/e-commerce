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
  Sparkles
} from "lucide-react";

type Filters = { q?: string; color?: string; size?: string; categories?: string[] };

type FiltersSidebarProps = {
  categories: { id: string; name: string }[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
};

export default function FiltersSidebar({
  categories,
  filters,
  setFilters,
}: FiltersSidebarProps) {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    search: true,
    color: true,
    size: true
  });
  const safeCategories = Array.isArray(categories) ? categories : [];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (
    key: keyof Omit<Filters, "categories">,
    value: string
  ) => {
    setFilters((prev) => {
      const next = { ...prev };
      const trimmed = value.trim();
      if (!trimmed) delete next[key];
      else next[key] = trimmed as any;
      return next;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setFilters((prev) => {
      const current = prev.categories ?? [];
      const alreadySelected = current.includes(categoryId);

      const updated = alreadySelected
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId];

      return { ...prev, categories: updated.length > 0 ? updated : undefined };
    });
  };

  const clearAllFilters = () => setFilters({});
  const hasActiveFilters = Object.keys(filters).length > 0;

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

  const sidebarContent = (
    <div className="p-6 space-y-2">
      {/* Header Mejorado */}
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
            className="text-sm text-brown hover:text-rosa font-medium px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {hasActiveFilters && (
        <div className="bg-wihte border border-amber-100 rounded-lg p-3 mb-4">
          <p className="text-sm text-brown font-medium">
            Filtros activos: {Object.keys(filters).length}
          </p>
        </div>
      )}

      {/* Buscar */}
      <FilterSection title="Buscar productos" icon={Search} sectionKey="search">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Nombre, descripción..."
            value={filters.q ?? ""}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown focus:border-brown outline-none text-sm transition-all"
          />
        </div>
      </FilterSection>

      {/* Categorías */}
      <FilterSection title="Categorías" icon={Tag} sectionKey="categories">
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          <label
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
              !filters.categories || filters.categories.length === 0
                ? "border-brown bg-white text-brown font-medium shadow-sm"
                : "border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
              !filters.categories || filters.categories.length === 0
                ? "bg-brown border-brown"
                : "border-gray-400"
            }`}>
              {(!filters.categories || filters.categories.length === 0) && (
                <div className="w-1.5 h-1.5 bg-white rounded-sm" />
              )}
            </div>
            <input
              type="checkbox"
              checked={!filters.categories || filters.categories.length === 0}
              onChange={() => setFilters((prev) => ({ ...prev, categories: undefined }))}
              className="hidden"
            />
            <span className="text-sm">Todas las categorías</span>
          </label>

          {safeCategories.map((cat) => (
            <label
              key={cat.id}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                filters.categories?.includes(cat.id)
                  ? "border-brown bg-blue-50 text-brown font-medium shadow-sm"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                filters.categories?.includes(cat.id)
                  ? "bg-brown border-brown"
                  : "border-gray-400"
              }`}>
                {filters.categories?.includes(cat.id) && (
                  <div className="w-1.5 h-1.5 bg-white rounded-sm" />
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
        </div>
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color" icon={Palette} sectionKey="color">
        <div className="relative">
          <Palette size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Ej: Rojo, Azul, Negro..."
            value={filters.color ?? ""}
            onChange={(e) => handleFilterChange("color", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown focus:border-brown outline-none text-sm transition-all"
          />
        </div>
      </FilterSection>

      {/* Talla */}
      <FilterSection title="Talla" icon={Ruler} sectionKey="size">
        <div className="relative">
          <Ruler size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Ej: S, M, L, XL..."
            value={filters.size ?? ""}
            onChange={(e) => handleFilterChange("size", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brown focus:border-brown outline-none text-sm transition-all"
          />
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop - Sidebar Moderno */}
      <aside className="hidden md:block w-80 bg-white h-screen sticky top-0 shadow-lg overflow-y-auto custom-scrollbar border-r border-gray-200">
        {sidebarContent}
      </aside>

      {/* Mobile - Bottom Sheet Moderno */}
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
                  {Object.keys(filters).length}
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
              {/* Header con agarre */}
              <div className="pt-4 px-4">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
                <div className="flex justify-between items-center pb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-brown" />
                    <h2 className="font-bold text-lg">Filtros</h2>
                    {hasActiveFilters && (
                      <span className="bg-white text-brown text-xs font-bold rounded-full px-2 py-1">
                        {Object.keys(filters).length}
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

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                {sidebarContent}
              </div>

              {/* Footer con acciones */}
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