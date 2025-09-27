"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";

type FiltersSidebarProps = {
  categories: { id: string; name: string }[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  setFilters: (filters: { size?: string; color?: string; q?: string }) => void;
  currentFilters: { size?: string; color?: string; q?: string };
};

export default function FiltersSidebar({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  setFilters,
  currentFilters,
}: FiltersSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleFilterChange = (key: "q" | "color" | "size", value: string) => {
    setFilters({
      ...currentFilters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    setSelectedCategoryId(null);
    setFilters({});
  };

  const hasActiveFilters =
    selectedCategoryId ||
    currentFilters.q ||
    currentFilters.color ||
    currentFilters.size;

  const sidebarContent = (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-xl text-gray-800">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Categorías */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-700">Categorías</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-blue-50 rounded transition">
            <input
              type="radio"
              name="category"
              checked={selectedCategoryId === null}
              onChange={() => setSelectedCategoryId(null)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Todas las categorías</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-blue-50 rounded transition"
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategoryId === cat.id}
                onChange={() => setSelectedCategoryId(cat.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-5">
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Buscar productos</h3>
          <input
            type="text"
            placeholder="Nombre o descripción..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={currentFilters.q || ""}
            onChange={(e) => handleFilterChange("q", e.target.value)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Color</h3>
          <input
            type="text"
            placeholder="Ej: Rojo, Azul..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={currentFilters.color || ""}
            onChange={(e) => handleFilterChange("color", e.target.value)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Talla</h3>
          <input
            type="text"
            placeholder="Ej: S, M, L..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={currentFilters.size || ""}
            onChange={(e) => handleFilterChange("size", e.target.value)}
          />
        </div>
      </div>

      {!hasActiveFilters && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            No hay filtros aplicados
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:block md:w-64 border-r bg-gray-50 h-screen sticky top-0 shadow-sm"
        role="complementary"
        aria-label="Filtros de productos"
      >
        {sidebarContent}
      </aside>

      {/* Mobile */}
      <div className="md:hidden">
        {/* Botón flotante fijo */}
        {!open && (
          <div className="fixed bottom-5 right-5 z-[9999]">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir filtros"
              aria-expanded={open}
              aria-controls="panel-filtros"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
            >
              <SlidersHorizontal size={18} />
              Filtros
            </button>
          </div>
        )}

        {/* Drawer */}
        {open && (
          <div
            className="fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-filtros"
            id="panel-filtros"
          >
            {/* Overlay */}
            <div
              className="flex-1 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div className="w-72 bg-white h-screen overflow-y-auto shadow-lg transform transition-transform duration-300 translate-x-0">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 id="titulo-filtros" className="font-bold text-lg">
                  Filtros
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar filtros"
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X size={20} />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
