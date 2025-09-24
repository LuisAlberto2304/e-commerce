// components/FiltersSidebar.tsx
"use client";

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

  const handleFilterChange = (key: 'q' | 'color' | 'size', value: string) => {
    setFilters({
      ...currentFilters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    setSelectedCategoryId(null);
    setFilters({});
  };

  const hasActiveFilters = selectedCategoryId || currentFilters.q || currentFilters.color || currentFilters.size;

  return (
    <aside className="p-4 border-r md:w-64 w-full bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg">Filtros</h2>
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
        <h3 className="font-semibold mb-3">Categorías</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.length > 0 ? (
            <>
              <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategoryId === null}
                  onChange={() => setSelectedCategoryId(null)}
                  className="text-blue-500"
                />
                <span>Todas las categorías</span>
              </label>
              
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategoryId === cat.id}
                    onChange={() => setSelectedCategoryId(cat.id)}
                    className="text-blue-500"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </>
          ) : (
            <p className="text-gray-500 text-sm">No hay categorías disponibles</p>
          )}
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Buscar productos</h3>
          <input
            type="text"
            placeholder="Nombre o descripción..."
            className="w-full p-2 border rounded"
            value={currentFilters.q || ''}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2">Color</h3>
          <input
            type="text"
            placeholder="Ej: Rojo, Azul..."
            className="w-full p-2 border rounded"
            value={currentFilters.color || ''}
            onChange={(e) => handleFilterChange('color', e.target.value)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2">Talla</h3>
          <input
            type="text"
            placeholder="Ej: S, M, L..."
            className="w-full p-2 border rounded"
            value={currentFilters.size || ''}
            onChange={(e) => handleFilterChange('size', e.target.value)}
          />
        </div>
      </div>

      {/* Estado de filtros */}
      {!hasActiveFilters && (
        <div className="mt-6 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700 text-center">
            No hay filtros aplicados
          </p>
        </div>
      )}
    </aside>
  );
}