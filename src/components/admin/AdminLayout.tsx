// components/admin/AdminLayout.tsx
import { ReactNode } from 'react';
import { getAuth, signOut } from 'firebase/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const auth = getAuth();

  const handleLogout = async (): Promise<void> => {
    await signOut(auth);
  };

  return (
    <div>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;