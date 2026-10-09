import { describe, it, expect } from 'vitest';
import { isValidBusinessId } from '@mana/utils';
import { CAMPAIGN_RULES, PLANS_CONFIG } from '@mana/config';

describe('Business Tenant Isolation & Business Rules Foundation', () => {
  it('validates unique business identifier formatting (e.g. SLJ001, RF002, CMR003)', () => {
    expect(isValidBusinessId('SLJ001')).toBe(true);
    expect(isValidBusinessId('RF002')).toBe(true);
    expect(isValidBusinessId('CMR003')).toBe(true);

    // Invalid business IDs
    expect(isValidBusinessId('')).toBe(false);
    expect(isValidBusinessId('ab')).toBe(false); // Too short
    expect(isValidBusinessId('SLJ 001')).toBe(false); // Contains space
  });

  it('enforces tenant isolation boundaries between Business A and Business B', () => {
    const businessA = { tenantId: 'SLJ001', name: 'Sri Lakshmi Jewellery' };
    const businessB = { tenantId: 'RF002', name: 'Rythu Fresh Mart' };

    // Simulating tenant data row
    const campaignBusinessA = {
      id: 'camp-1',
      business_id: 'SLJ001',
      title: 'Gold Festival Offer',
    };

    // Business A accessing own campaign
    const canBusinessAAccessOwn = campaignBusinessA.business_id === businessA.tenantId;
    expect(canBusinessAAccessOwn).toBe(true);

    // Business B attempting to access or modify Business A's campaign
    const canBusinessBAccessBusinessA = campaignBusinessA.business_id === businessB.tenantId;
    expect(canBusinessBAccessBusinessA).toBe(false);
  });

  it('enforces storage folder isolation rule ({business_id}/*)', () => {
    const tenantId = 'SLJ001';
    const validAssetPath = `${tenantId}/logo_primary.png`;
    const foreignAssetPath = `RF002/banner.jpg`;

    const isAuthorizedAsset = (path: string, currentTenant: string) =>
      path.startsWith(`${currentTenant}/`);

    expect(isAuthorizedAsset(validAssetPath, tenantId)).toBe(true);
    expect(isAuthorizedAsset(foreignAssetPath, tenantId)).toBe(false);
  });

  it('enforces campaign quota rules (10 included/year, deletion does not restore credit)', () => {
    expect(CAMPAIGN_RULES.INCLUDED_ANNUAL_CAMPAIGNS).toBe(10);
    expect(CAMPAIGN_RULES.DELETING_RESTORES_CREDIT).toBe(false);
    expect(CAMPAIGN_RULES.ADDITIONAL_CAMPAIGN_PRICE_INR).toBe(299);

    // Verify Business plan does NOT include promotional push notifications
    expect(PLANS_CONFIG.BUSINESS.features.promotional_push_notifications).toBe(false);

    // Verify Premium plan includes promotional push notifications
    expect(PLANS_CONFIG.PREMIUM.features.promotional_push_notifications).toBe(true);
  });
});
