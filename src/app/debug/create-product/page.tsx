/* eslint-disable @typescript-eslint/no-explicit-any */
// app/debug/create-product/page.tsx
'use client';

import { useState } from 'react';

export default function CreateProductDebug() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCreateProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/medusa/test-product', {
        method: 'POST'
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Creación de Producto</h1>
      
      <button 
        onClick={testCreateProduct}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Creando producto de prueba...' : 'Crear Producto de Prueba'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded ${
          result.success ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}