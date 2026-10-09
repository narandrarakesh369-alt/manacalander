import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CustomerBusinessService,
  CampaignService,
  DeferredDeepLinkService,
  AnalyticsService,
} from '@mana/services';
import type { Business, BusinessProfile, Campaign } from '@mana/types';
import {
  Building2,
  CheckCircle,
  ExternalLink,
  MapPin,
  Phone,
  QrCode,
  Sparkles,
  Smartphone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, Button, Badge } from '@mana/ui';

export const BusinessLandingScreen: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
  const campaignParam = searchParams.get('c') || searchParams.get('campaign_id');
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [attributionToken, setAttributionToken] = useState<string | null>(null);
  const [installSimulated, setInstallSimulated] = useState(false);

  const cleanBizId = (businessId || '').trim().toUpperCase();

  useEffect(() => {
    let isMounted = true;

    const initLanding = async () => {
      if (!cleanBizId) {
        setLoading(false);
        return;
      }

      // Record QR scan analytics event
      AnalyticsService.track('qr_scan', cleanBizId, campaignParam, {
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      });

      // Register deferred attribution token for post-install recovery
      const token = await DeferredDeepLinkService.registerPendingAttribution(
        cleanBizId,
        campaignParam || undefined,
        'qr'
      );
      if (isMounted) setAttributionToken(token);

      // Load business details
      const details = await CustomerBusinessService.getBusinessDetails(cleanBizId);
      if (details && isMounted) {
        setBusiness(details.business);
        setProfile(details.profile);
        setIsPremium(details.isPremium);

        // Record profile view
        AnalyticsService.track('business_profile_view', cleanBizId);

        // Load active campaigns
        const activeCamps = await CampaignService.getActiveCampaignsForBusiness(cleanBizId);
        if (isMounted) setCampaigns(activeCamps);
      }

      if (isMounted) setLoading(false);
    };

    initLanding();

    return () => {
      isMounted = false;
    };
  }, [cleanBizId, campaignParam]);

  // Handle immediate transition to Business Mode in Web / App
  const handleEnterBusinessMode = async () => {
    if (!cleanBizId) return;

    // Follow business with qr_scanned relationship
    await CustomerBusinessService.followBusiness('cust_current', cleanBizId, 'qr_scanned');
    // Set active business mode
    CustomerBusinessService.setActiveBusinessMode(cleanBizId);

    // If campaign was targeted, navigate to campaign or home
    if (campaignParam) {
      navigate(`/campaigns/${campaignParam}`);
    } else {
      navigate('/');
    }
  };

  // Simulate complete deferred deep link: Install from Play Store → First Launch
  const handleSimulateDeferredAttribution = async () => {
    if (!attributionToken) return;
    setInstallSimulated(true);

    const recovered = await DeferredDeepLinkService.simulateInstallAndLaunch(attributionToken);
    if (recovered && recovered.business_id) {
      await CustomerBusinessService.followBusiness('cust_current', recovered.business_id, 'qr_scanned');
      CustomerBusinessService.setActiveBusinessMode(recovered.business_id);
      setTimeout(() => {
        navigate('/');
      }, 800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Business Not Found</h2>
          <p className="text-slate-600 text-sm mt-1 mb-4">
            The business code <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-semibold">{cleanBizId}</code> does not exist or is inactive.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Mana Calendar Home
          </Button>
        </Card>
      </div>
    );
  }

  const playStoreUrl = DeferredDeepLinkService.generatePlayStoreReferrerUrl(cleanBizId, campaignParam || undefined);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top App Bar Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-900 text-sm">
            మ
          </div>
          <span className="font-bold text-sm tracking-wide">MANA CALENDAR 2027</span>
        </div>
        <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-medium">
          Business QR Gateway
        </span>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
        {/* Business Hero Card */}
        <div className={`relative overflow-hidden rounded-2xl bg-white border shadow-md ${
          isPremium ? 'border-amber-400/80 shadow-amber-100/50' : 'border-slate-200'
        }`}>
          {/* Banner cover */}
          <div className="h-28 w-full bg-gradient-to-r from-amber-600 to-orange-700 relative overflow-hidden">
            {profile?.banner_url && (
              <img
                src={profile.banner_url}
                alt="Business cover"
                className="w-full h-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-2.5 right-3">
              {isPremium ? (
                <Badge variant="warning" className="bg-amber-400 text-slate-950 font-bold border-amber-300 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-900" />
                  Premium Partner
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-black/40 text-white border-white/30 backdrop-blur-sm">
                  Verified Business
                </Badge>
              )}
            </div>
          </div>

          {/* Logo & Identity */}
          <div className="px-5 pb-5 pt-0 relative">
            <div className="-mt-10 mb-3 flex items-end justify-between">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-amber-600" />
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  TENANT: {business.business_id}
                </span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              {business.name}
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </h1>
            {profile?.tagline && (
              <p className="text-xs font-medium text-amber-700 mt-0.5">
                {profile.tagline}
              </p>
            )}

            {profile?.description && (
              <p className="text-xs text-slate-600 mt-2.5 line-clamp-3">
                {profile.description}
              </p>
            )}

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
              {profile?.address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{profile.address}, {profile.city}</span>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${profile.phone}`} className="text-amber-700 font-medium hover:underline">
                    {profile.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Gateway: App Installed vs App Not Installed */}
        <Card className="p-5 border-amber-300 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Mana Calendar 2027 Experience
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Connect directly with <strong>{business.name}</strong> inside the unified Mana Calendar 2027 multi-tenant app to receive authentic Telugu calendar, Panchangam, and exclusive festive offers.
          </p>

          <div className="flex flex-col gap-2.5">
            {/* Direct In-App Activation */}
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md"
              onClick={handleEnterBusinessMode}
            >
              <span>Open in Mana Calendar (App Installed)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Play Store Link with Deferred Referrer */}
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm text-center"
            >
              <span>Install from Google Play Store (Deferred Referrer)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Interactive Deferred Attribution Simulator for Automated Verification */}
            <div className="pt-2 border-t border-amber-200/60 mt-1">
              <button
                onClick={handleSimulateDeferredAttribution}
                disabled={installSimulated}
                className="w-full text-center text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-white border border-amber-300 rounded-md py-1.5 transition-colors"
              >
                {installSimulated
                  ? '✓ Post-Install Attribution Verified! Launching...'
                  : '⚡ Test Deferred Attribution: Simulate Install → First Launch Recovery'}
              </button>
            </div>
          </div>
        </Card>

        {/* Active Special Offers & Campaigns */}
        {campaigns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Special Offers & Campaigns ({campaigns.length})
              </h3>
            </div>

            {campaigns.map((camp) => (
              <Card
                key={camp.id}
                className="p-4 cursor-pointer hover:border-amber-400 transition-all group"
                onClick={() => navigate(`/campaigns/${camp.id}`)}
              >
                <div className="flex gap-3">
                  {camp.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img src={camp.image_url} alt={camp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors">
                      {camp.title}
                    </h4>
                    {camp.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {camp.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-amber-700">
                        {camp.cta_text || 'View Details'} →
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Valid in 2027
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
