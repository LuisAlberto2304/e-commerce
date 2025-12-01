/* eslint-disable @typescript-eslint/no-explicit-any */
// app/debug/token/page.tsx
'use client';

import { useState } from 'react';

export default function TokenDebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/medusa/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      });
      
      const data = await response.json();
      setResult({
        status: response.status,
        data: data
      });
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
      <h1 className="text-2xl font-bold mb-4">Debug Token</h1>
      
      <button 
        onClick={testAuth}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Probar Autenticación'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Variables:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>MEDUSA_ADMIN_API_KEY: {process.env.MEDUSA_ADMIN_API_KEY ? '✅ Configurada' : '❌ No configurada'}</p>
          <p>NEXT_PUBLIC_MEDUSA_BACKEND_URL: {process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}</p>
        </div>
      </div>
    </div>
  );
}