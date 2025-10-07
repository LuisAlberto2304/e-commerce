import React, { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";

type Filters = { q?: string; color?: string; size?: string; category?: string };

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
  const safeCategories = Array.isArray(categories) ? categories : [];

  const handleFilterChange = (
    key: keyof Omit<Filters, "category">,
    value: string
  ) => {
    setFilters((prev) => {
      const next = { ...prev };
      const trimmed = value.trim();
      if (!trimmed) delete next[key];
      else next[key] = trimmed;
      return next;
    });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setFilters((prev) => {
      if (categoryId === null) {
        const { category, ...rest } = prev;
        return rest;
      }
      return { ...prev, category: categoryId };
    });
  };

  const clearAllFilters = () => setFilters({});
  const hasActiveFilters = Object.keys(filters).length > 0;

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-semibold text-gray-800 mb-2 text-sm tracking-wide uppercase border-b border-gray-200 pb-1">
      {children}
    </h3>
  );

  const sidebarContent = (
    <div className="p-4 space-y-6 text-sm">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-900">Filtros</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Categorías */}
      <div>
        <SectionTitle>Categorías</SectionTitle>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <label
            className={`block cursor-pointer px-3 py-2 rounded border transition ${
              !filters.category
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-300 hover:bg-gray-100 text-gray-700"
            }`}
          >
            <input
              type="radio"
              name="category"
              value=""
              checked={!filters.category}
              onChange={() => handleCategoryChange(null)}
              className="hidden"
            />
            Todas las categorías
          </label>

          {safeCategories.map((cat) => (
            <label
              key={cat.id}
              className={`block cursor-pointer px-3 py-2 rounded border transition ${
                filters.category === cat.id
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-300 hover:bg-gray-100 text-gray-700"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={cat.id}
                checked={filters.category === cat.id}
                onChange={() => handleCategoryChange(cat.id)}
                className="hidden"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>



      {/* Buscar */}
      <div>
        <SectionTitle>Buscar productos</SectionTitle>
        <input
          type="text"
          placeholder="Nombre o descripción..."
          value={filters.q ?? ""}
          onChange={(e) => handleFilterChange("q", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      {/* Color */}
      <div>
        <SectionTitle>Color</SectionTitle>
        <input
          type="text"
          placeholder="Ej: Rojo, Azul..."
          value={filters.color ?? ""}
          onChange={(e) => handleFilterChange("color", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      {/* Talla */}
      <div>
        <SectionTitle>Talla</SectionTitle>
        <input
          type="text"
          placeholder="Ej: S, M, L..."
          value={filters.size ?? ""}
          onChange={(e) => handleFilterChange("size", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block md:w-64 border-r bg-white h-screen sticky top-0 shadow-sm overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile */}
<div className="md:hidden">
  {!open && (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
      >
      </button>
    </div>
  )}

  {open && (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div
        className="flex justify-between items-center p-4 pt-8 border-b bg-white shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top, 1.5rem)" }}
      >
        <h2 className="font-bold text-base">Filtros</h2>
        <button
          onClick={() => setOpen(false)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto pt-2">{sidebarContent}</div>

      {/* Footer */}
      <div
        className="p-4 border-t bg-white shadow-inner"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}
      >
        <button
          onClick={() => setOpen(false)}
          className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  )}
</div>


    </>
  );
}
