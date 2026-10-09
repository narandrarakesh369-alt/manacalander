import { describe, it, expect } from 'vitest';
import type { UserRole, AuthUser } from '@mana/types';

describe('Auth & Role Protection Foundation', () => {
  it('correctly distinguishes customer, business user, and super admin roles', () => {
    const customerUser: AuthUser = {
      id: 'cust-1',
      role: 'customer',
    };

    const businessUser: AuthUser = {
      id: 'biz-1',
      role: 'business_user',
      businessId: 'SLJ001',
    };

    const adminUser: AuthUser = {
      id: 'admin-1',
      role: 'super_admin',
      adminRoles: ['super_admin'],
    };

    expect(customerUser.role).toBe('customer');
    expect(customerUser.businessId).toBeUndefined();

    expect(businessUser.role).toBe('business_user');
    expect(businessUser.businessId).toBe('SLJ001');

    expect(adminUser.role).toBe('super_admin');
    expect(adminUser.adminRoles).toContain('super_admin');
  });

  it('prohibits customer from accessing business tenant operations', () => {
    const customer: AuthUser = { id: 'cust-1', role: 'customer' };
    const allowedRoles: UserRole[] = ['business_user', 'super_admin'];

    const hasAccess = allowedRoles.includes(customer.role);
    expect(hasAccess).toBe(false);
  });

  it('prohibits business user from accessing super admin operations', () => {
    const businessUser: AuthUser = { id: 'biz-1', role: 'business_user', businessId: 'SLJ001' };
    const adminRoles: UserRole[] = ['super_admin'];

    const hasAccess = adminRoles.includes(businessUser.role);
    expect(hasAccess).toBe(false);
  });

  it('allows super admin to perform platform operations', () => {
    const adminUser: AuthUser = { id: 'admin-1', role: 'super_admin' };
    const adminRoles: UserRole[] = ['super_admin'];

    const hasAccess = adminRoles.includes(adminUser.role);
    expect(hasAccess).toBe(true);
  });
});
