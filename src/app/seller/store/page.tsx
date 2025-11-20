// app/seller/store/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSellerAuth } from '../../../hooks/useSellerAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';

export default function SellerStorePage() {
  const { user } = useSellerAuth();
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    storePhone: '',
    storeAddress: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Inicializar formData cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      setFormData({
        storeName: user.storeName || '',
        storeDescription: user.storeDescription || '',
        storePhone: user.storePhone || '',
        storeAddress: user.storeAddress || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setMessage('✅ Configuración guardada correctamente');
    } catch (error) {
      setMessage('❌ Error al guardar la configuración');
      console.error('Error updating store settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Tienda</h1>
        <p className="text-gray-600">Personaliza la información de tu tienda</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Tienda *
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Mi Tienda Online"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la Tienda
            </label>
            <textarea
              value={formData.storeDescription}
              onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe qué hace única a tu tu tienda..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: +52 123 456 7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Ciudad, Estado"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Próximamente</h4>
            <p className="text-yellow-700 text-sm">
              En futuras actualizaciones podrás: subir logo de tienda, añadir banner, 
              enlaces a redes sociales, y más opciones de personalización.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !formData.storeName.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Vista previa de la tienda */}
      <div className="mt-8 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Vista Previa de la Tienda</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{formData.storeName || 'Nombre de Tienda'}</h3>
              {formData.storeDescription && (
                <p className="text-gray-600 mb-4">{formData.storeDescription}</p>
              )}
              <div className="text-sm text-gray-500">
                <p>Esta es cómo se verá tu tienda pública.</p>
                <p>Los productos aparecerán aquí una vez que los añadas.</p>
              </div>
              <button 
                onClick={() => window.open(`/store/${formData.storeName.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Ver Tienda Pública
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}