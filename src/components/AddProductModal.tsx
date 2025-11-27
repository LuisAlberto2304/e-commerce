/* eslint-disable @typescript-eslint/no-explicit-any */
// components/AddProductModal.tsx
'use client';

import { useState, useEffect } from 'react';

interface ProductVariant {
  title: string;
  price: number;
  quantity: number;
}

interface ProductFormData {
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  variants: ProductVariant[];
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  storeId: string;
  userId: string;
  userEmail: string;
  createProduct: (productData: ProductFormData, storeId: string, userId: string, userEmail: string) => Promise<any>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export default function AddProductModal({ 
  isOpen, 
  onClose, 
  onProductCreated, 
  storeId, 
  userId,
  userEmail,
  createProduct,
  loading,
  error,
  clearError
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    thumbnail: '',
    images: [''],
    variants: [
      { title: '', price: 0, quantity: 1 }
    ]
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setSuccessMessage('');
      clearError();
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    clearError();
    
    try {
      // Validaciones básicas
      if (!formData.title.trim()) {
        alert('El título del producto es requerido');
        return;
      }

      if (!formData.thumbnail.trim()) {
        alert('La imagen principal es requerida');
        return;
      }

      // Filtrar imágenes vacías
      const filteredImages = formData.images.filter(img => img.trim() !== '');
      
      // Validar variantes
      const validVariants = formData.variants.filter(variant => 
        variant.title.trim() && variant.price > 0 && variant.quantity >= 0
      );

      if (validVariants.length === 0) {
        alert('Debe agregar al menos una variante válida');
        return;
      }

      const productData = {
        ...formData,
        images: filteredImages,
        variants: validVariants
      };

      console.log('Enviando datos del producto...');
      
      // Usar la función createProduct pasada como prop
      await createProduct(productData, storeId, userId, userEmail);
      
      setSuccessMessage(`¡Producto "${formData.title}" creado exitosamente!`);
      
      setTimeout(() => {
        onProductCreated();
        onClose();
        resetForm();
      }, 2000);
      
    } catch (err) {
      console.error('Error creando producto:', err);
      // El error ya está manejado en la función createProduct
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail: '',
      images: [''],
      variants: [
        { title: '', price: 0, quantity: 1 }
      ]
    });
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImage = (index: number) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const updateImage = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { title: '', price: 0, quantity: 1 }]
    }));
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));
    }
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Producto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ✕
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              ✅ {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Producto</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Camiseta de algodón premium"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe tu producto..."
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen principal (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.thumbnail}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com/imagen-principal.jpg"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imágenes adicionales
                  </label>
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://example.com/imagen-adicional.jpg"
                        disabled={loading}
                      />
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 disabled:text-gray-400"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImage}
                    className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                    disabled={loading}
                  >
                    + Agregar otra imagen
                  </button>
                </div>
              </div>
            </div>

            {/* Variantes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Variantes del Producto</h3>
              
              {formData.variants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Variante {index + 1}</h4>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-800 text-sm disabled:text-gray-400"
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.title}
                        onChange={(e) => updateVariant(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Talla S, Color Azul"
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addVariant}
                className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                disabled={loading}
              >
                + Agregar otra variante
              </button>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando producto...
                  </>
                ) : (
                  'Crear Producto'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}