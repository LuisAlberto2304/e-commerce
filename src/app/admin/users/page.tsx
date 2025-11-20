'use client'
// pages/admin/users.tsx
import { useState } from 'react';
import { useAuth } from '@/context/userContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminAuth from '@/components/auth/AdminAuth';
import UsersTable from '@/components/admin/UsersTable';
import UserDetails from '@/components/admin/UserDetails';
import { UserProfile } from '@/app/types/user';

const AdminUsers = () => {
  const { user, isAdmin, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      // Recargar la página o actualizar el estado para reflejar los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminAuth />;
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Administra los usuarios registrados en la plataforma E-Tianguis
          </p>
        </div>
        
        <UsersTable onUserSelect={setSelectedUser} />
        
        {selectedUser && (
          <UserDetails 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;