import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@mana/services';
import type { UserRole } from '@mana/types';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { Button } from './Button';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath,
}) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Verifying authentication permissions..." fullScreen />;
  }

  if (!user) {
    const defaultRedirect = allowedRoles.includes('super_admin')
      ? '/admin/login'
      : allowedRoles.includes('business_user')
      ? '/business/login'
      : '/home';

    return <Navigate to={redirectPath || defaultRedirect} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <ErrorState
          title="Access Restricted"
          message={`Your account role (${role.replace('_', ' ')}) is not authorized to access this section.`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Return to Customer App
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
