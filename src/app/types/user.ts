// types/user.ts
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'seller';
  storeName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersTableProps {
  onUserSelect: (user: UserProfile) => void;
}

export interface UserDetailsProps {
  user: UserProfile | null;
  onClose: () => void;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
}