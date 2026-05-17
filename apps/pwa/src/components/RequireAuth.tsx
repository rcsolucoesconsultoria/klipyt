import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth-token';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
