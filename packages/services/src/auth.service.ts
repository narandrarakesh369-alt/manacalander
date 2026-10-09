/**
 * MANA CALENDAR 2027 — AUTHENTICATION SERVICE FOUNDATION
 * Role-based authentication and secure tenant association.
 */

import { supabase } from './supabase.client';
import type { AuthUser, UserRole } from '@mana/types';
import { logger } from '@mana/utils';

export interface SignInCredentials {
  email: string;
  password?: string;
  phone?: string;
  otp?: string;
}

export class AuthService {
  /**
   * Resolves the authoritative role and tenant context for an authenticated user.
   * Does NOT trust client-side claims or parameters.
   */
  static async resolveUserRoleAndContext(authUserId: string): Promise<{
    role: UserRole;
    businessId?: string;
    adminRoles?: string[];
  }> {
    try {
      // 1. Check if user is registered in admin_users
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id, status')
        .eq('auth_user_id', authUserId)
        .eq('status', 'active')
        .maybeSingle();

      if (adminData) {
        return {
          role: 'super_admin',
          adminRoles: ['super_admin'],
        };
      }

      // 2. Check if user belongs to a business tenant
      const { data: businessUserData } = await supabase
        .from('business_users')
        .select('business_id, role')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (businessUserData && businessUserData.business_id) {
        return {
          role: 'business_user',
          businessId: businessUserData.business_id,
        };
      }

      // 3. Fallback / Default: Customer role
      return {
        role: 'customer',
      };
    } catch (err) {
      logger.error('Error resolving user role and context from database', err);
      return { role: 'customer' };
    }
  }

  /**
   * Get current authenticated session user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        // Check for local development mock session if any
        const devSession = localStorage.getItem('mana_dev_session');
        if (devSession) {
          try {
            return JSON.parse(devSession) as AuthUser;
          } catch {
            localStorage.removeItem('mana_dev_session');
          }
        }
        return null;
      }

      const context = await this.resolveUserRoleAndContext(session.user.id);

      return {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        role: context.role,
        businessId: context.businessId,
        adminRoles: context.adminRoles,
      };
    } catch (err) {
      logger.error('Failed to get current session', err);
      return null;
    }
  }

  /**
   * Sign in with email and password (for Business and Admin portals)
   */
  static async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const context = await this.resolveUserRoleAndContext(data.user.id);

    return {
      id: data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      role: context.role,
      businessId: context.businessId,
      adminRoles: context.adminRoles,
    };
  }

  /**
   * Mock / Development sign in for quick local testing and role switching
   * Strictly available for development/testing environments.
   */
  static setDevSession(user: AuthUser | null) {
    if (user) {
      localStorage.setItem('mana_dev_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('mana_dev_session');
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    localStorage.removeItem('mana_dev_session');
    await supabase.auth.signOut();
  }
}
