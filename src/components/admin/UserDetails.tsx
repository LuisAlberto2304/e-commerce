/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/UserDetails.tsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import { UserProfile, UserDetailsProps } from '@/app/types/user';

const getUserInitials = (name: string | undefined): string => {
  if (!name || typeof name !== 'string') return 'UU';
  const words = name.trim().split(' ').filter(word => word.length > 0);
  if (words.length === 0) return 'UU';
  
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const UserDetails = ({ user, onClose, onUpdateUser }: UserDetailsProps) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState<boolean>(false);

  if (!user) return null;

  const handleEdit = () => {
    setEditing(true);
    setFormData({
      name: user.name,
      role: user.role,
      storeName: user.storeName
    });
  };

  const handleSave = async () => {
    if (!user.uid) return;
    
    setLoading(true);
    try {
      await onUpdateUser(user.uid, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({});
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Detalles del Usuario</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Información del usuario */}
          <div className="space-y-6">
            {/* Avatar y info básica */}
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-lg">
                    {getUserInitials(user.name)}
                    </span>
                </div>
                <div>
                    {editing ? (
                    <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="text-xl font-bold border border-gray-300 rounded px-2 py-1"
                    />
                    ) : (
                    <h3 className="text-xl font-bold text-gray-900">{user.name || 'Usuario sin nombre'}</h3>
                    )}
                    <p className="text-gray-600">{user.email || 'No tiene email'}</p>
                    <p className="text-sm text-gray-500">ID: {user.uid || 'sin-id'}</p>
                </div>
            </div>

            {/* Información detallada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Información de la Cuenta</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    {editing ? (
                      <select
                        value={formData.role || ''}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="user">Usuario</option>
                        <option value="seller">Vendedor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 
                         user.role === 'seller' ? 'Vendedor' : 'Usuario'}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de Tienda
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.storeName || ''}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Nombre de la tienda"
                      />
                    ) : (
                      <p className="text-gray-900">{user.storeName || 'No asignado'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Metadatos</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Fecha de registro:</span>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Última actualización:</span>
                    <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;