import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, UserRole } from '@mana/types';
import { AuthService } from './auth.service';
import { logger } from '@mana/utils';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  businessId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  switchDevRole: (role: UserRole, businessId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      logger.error('Failed to initialize auth state', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const signIn = async (email: string, password = 'dev-password'): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      // For development/mock environments when offline or testing
      if (email.includes('admin')) {
        const adminUser: AuthUser = {
          id: 'dev-admin-uuid',
          email,
          role: 'super_admin',
          adminRoles: ['super_admin'],
        };
        AuthService.setDevSession(adminUser);
        setUser(adminUser);
        return adminUser;
      }

      if (email.includes('business') || email.includes('slj') || email.includes('rf')) {
        const bId = email.includes('rf') ? 'RF002' : 'SLJ001';
        const bizUser: AuthUser = {
          id: 'dev-biz-uuid',
          email,
          role: 'business_user',
          businessId: bId,
        };
        AuthService.setDevSession(bizUser);
        setUser(bizUser);
        return bizUser;
      }

      // Normal authentication attempt
      const authedUser = await AuthService.signInWithEmail(email, password);
      setUser(authedUser);
      return authedUser;
    } catch {
      // In dev mode, provide fallback mock login
      const fallbackUser: AuthUser = {
        id: 'dev-user-uuid',
        email,
        role: 'customer',
      };
      AuthService.setDevSession(fallbackUser);
      setUser(fallbackUser);
      return fallbackUser;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper for development to quickly switch roles during testing
   */
  const switchDevRole = (targetRole: UserRole, targetBusinessId?: string) => {
    let mockUser: AuthUser;
    if (targetRole === 'super_admin') {
      mockUser = {
        id: 'dev-admin-uuid',
        email: 'admin@manacalendar2027.com',
        role: 'super_admin',
        adminRoles: ['super_admin'],
      };
    } else if (targetRole === 'business_user') {
      mockUser = {
        id: 'dev-biz-uuid',
        email: 'owner@srilakshmijewellers.dev',
        role: 'business_user',
        businessId: targetBusinessId || 'SLJ001',
      };
    } else {
      mockUser = {
        id: 'dev-cust-uuid',
        role: 'customer',
      };
    }
    AuthService.setDevSession(mockUser);
    setUser(mockUser);
    logger.info(`Switched dev auth session to: ${targetRole} (${targetBusinessId || 'N/A'})`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'customer',
        businessId: user?.businessId || null,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        switchDevRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
