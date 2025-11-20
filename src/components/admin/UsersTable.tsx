// components/admin/UsersTable.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import { UserProfile, UsersTableProps } from '@/app/types/user';

const UsersTable = ({ onUserSelect }: UsersTableProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData: UserProfile[] = querySnapshot.docs.map(doc => ({
        ...doc.data()
      } as UserProfile));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función segura para obtener iniciales
  const getUserInitials = (name: string | undefined): string => {
    if (!name || typeof name !== 'string') return 'UU';
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'UU';
    
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Función segura para búsqueda
  const safeToLowerCase = (str: string | undefined | null): string => {
    return (str || '').toLowerCase();
  };

  const filteredUsers = users.filter(user => {
    if (!user) return false;

    const searchTermLower = safeToLowerCase(searchTerm);
    
    const matchesSearch = 
      safeToLowerCase(user.name).includes(searchTermLower) ||
      safeToLowerCase(user.email).includes(searchTermLower) ||
      safeToLowerCase(user.uid).includes(searchTermLower);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string | undefined): string => {
    const userRole = role || 'user';
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'seller': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string | undefined): string => {
    const userRole = role || 'user';
    switch (userRole) {
      case 'admin': return 'Administrador';
      case 'seller': return 'Vendedor';
      case 'customer': return 'Usuario';
      default: return userRole;
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función segura para obtener el nombre de display
  const getDisplayName = (name: string | undefined): string => {
    return name || 'Usuario sin nombre';
  };

  // Función segura para obtener el email de display
  const getDisplayEmail = (email: string | undefined): string => {
    return email || 'No tiene email';
  };

  // Función segura para obtener el UID de display
  const getDisplayUid = (uid: string | undefined): string => {
    return uid || 'sin-id';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Filtros y búsqueda */}
      <div className="p-4 bg-gray-50 border-b space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, email o ID..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex space-x-4">
          <select
            value={roleFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="seller">Vendedores</option>
            <option value="customer">Usuarios</option>
          </select>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tienda
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Registro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user: UserProfile) => (
              <tr key={user.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {getUserInitials(user.name)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getDisplayName(user.name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {getDisplayUid(user.uid).substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getDisplayEmail(user.email)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.storeName || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onUserSelect(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || roleFilter !== 'all' ? 'No se encontraron usuarios con los filtros aplicados' : 'No hay usuarios registrados'}
        </div>
      )}

      {/* Contador */}
      <div className="px-6 py-3 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </p>
      </div>
    </div>
  );
};

export default UsersTable;