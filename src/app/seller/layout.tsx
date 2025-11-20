// app/seller/layout.tsx
'use client';

import { ReactNode } from 'react';
import { useSellerAuth } from '../../hooks/useSellerAuth';
import SellerLayout from '../../components/seller/SellerLayout';
import SellerAuth from '../../components/seller/SellerAuth';

interface SellerRootLayoutProps {
  children: ReactNode;
}

export default function SellerRootLayout({ children }: SellerRootLayoutProps) {
  const { user, isSeller, loading } = useSellerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isSeller) {
    return <SellerAuth />;
  }

  return (
    <SellerLayout storeName={user.storeName}>
      {children}
    </SellerLayout>
  );
}