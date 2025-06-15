import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  metadata: Record<string, any>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const isAdmin = context.user?.user_metadata?.role === 'admin';
  const isAuthenticated = !!context.user;

  return {
    ...context,
    isAdmin,
    isAuthenticated,
    user: context.user ? {
      id: context.user.id,
      email: context.user.email,
      role: context.user.user_metadata?.role || 'user',
      metadata: context.user.user_metadata || {},
    } as User : null,
  };
} 