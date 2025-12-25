/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context
 * Separated from AuthContext component for Fast Refresh compatibility
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

