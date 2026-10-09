import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CustomerBusinessService,
  CampaignService,
  AnalyticsService,
} from '@mana/services';
import type { Business, BusinessProfile, Campaign, FollowedBusiness } from '@mana/types';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Building2,
  CheckCircle,
  ExternalLink,
  Globe,
  Heart,
  MapPin,
  Navigation as NavIcon,
  Phone,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, Button, Badge } from '@mana/ui';

export const CustomerBusinessProfileScreen: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [promotionalNotifications, setPromotionalNotifications] = useState(true);
  const [isActiveMode, setIsActiveMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const cleanBizId = (businessId || '').trim().toUpperCase();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!cleanBizId) {
        setLoading(false);
        return;
      }

      const details = await CustomerBusinessService.getBusinessDetails(cleanBizId);
      if (details && isMounted) {
        setBusiness(details.business);
        setProfile(details.profile);
        setIsPremium(details.isPremium);

        AnalyticsService.track('business_profile_view', cleanBizId);

        const [activeCamps, followedList] = await Promise.all([
          CampaignService.getActiveCampaignsForBusiness(cleanBizId),
          CustomerBusinessService.getFollowedBusinesses('cust_current'),
        ]);

        if (isMounted) {
          setCampaigns(activeCamps);
          const followedMatch = followedList.find((f) => f.business_id === cleanBizId);
          if (followedMatch) {
            setIsFollowed(true);
            setPromotionalNotifications(followedMatch.promotional_notifications_enabled !== false);
          }
          setIsActiveMode(CustomerBusinessService.getActiveBusinessMode() === cleanBizId);
        }
      }

      if (isMounted) setLoading(false);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [cleanBizId]);

  const handleToggleFollow = async () => {
    if (!cleanBizId) return;

    if (isFollowed) {
      await CustomerBusinessService.unfollowBusiness('cust_current', cleanBizId);
      setIsFollowed(false);
      setIsActiveMode(false);
      AnalyticsService.track('business_unfollow', cleanBizId);
    } else {
      await CustomerBusinessService.followBusiness('cust_current', cleanBizId, 'followed');
      setIsFollowed(true);
      AnalyticsService.track('business_follow', cleanBizId);
    }
  };

  const handleToggleNotifications = async () => {
    const nextVal = !promotionalNotifications;
    setPromotionalNotifications(nextVal);
    await CustomerBusinessService.toggleBusinessNotifications('cust_current', cleanBizId, nextVal);
  };

  const handleToggleActiveMode = () => {
    if (isActiveMode) {
      CustomerBusinessService.setActiveBusinessMode(null);
      setIsActiveMode(false);
    } else {
      CustomerBusinessService.setActiveBusinessMode(cleanBizId);
      setIsActiveMode(true);
    }
  };

  // Safe external intents
  const handleCall = () => {
    if (profile?.phone) {
      window.location.href = `tel:${profile.phone.replace(/[^0-9+]/g, '')}`;
    }
  };

  const handleDirections = () => {
    if (profile?.latitude && profile?.longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else if (profile?.address) {
      const q = encodeURIComponent(`${profile.address}, ${profile.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWebsite = () => {
    if (profile?.website) {
      window.open(profile.website, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900">Business Not Found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-900 truncate">
            {business.name}
          </span>
        </div>

        <button
          onClick={handleToggleFollow}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            isFollowed
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFollowed ? 'fill-rose-600' : ''}`} />
          <span>{isFollowed ? 'Following' : 'Follow'}</span>
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Cover & Brand Hero */}
        <div className={`overflow-hidden rounded-2xl bg-white border shadow-sm ${
          isPremium ? 'border-amber-400 ring-1 ring-amber-300/40' : 'border-slate-200'
        }`}>
          {/* Cover image */}
          <div className="h-32 w-full bg-gradient-to-r from-amber-600 to-orange-700 relative overflow-hidden">
            {profile?.banner_url && (
              <img
                src={profile.banner_url}
                alt="Cover"
                className="w-full h-full object-cover"
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
                <Badge variant="outline" className="bg-black/50 text-white border-white/30 backdrop-blur-sm">
                  Verified Business
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="-mt-10 mb-2 flex items-end justify-between">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                CODE: {business.business_id}
              </span>
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
              <p className="text-xs text-slate-600 mt-2">
                {profile.description}
              </p>
            )}

            {/* Quick Action Intents */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={handleCall}
                disabled={!profile?.phone}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors border border-slate-200/80"
              >
                <Phone className="w-4 h-4 mb-1 text-emerald-600" />
                <span className="text-[11px] font-semibold">Call</span>
              </button>

              <button
                onClick={handleDirections}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors border border-slate-200/80"
              >
                <NavIcon className="w-4 h-4 mb-1 text-blue-600" />
                <span className="text-[11px] font-semibold">Directions</span>
              </button>

              <button
                onClick={handleWebsite}
                disabled={!profile?.website}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors border border-slate-200/80"
              >
                <Globe className="w-4 h-4 mb-1 text-indigo-600" />
                <span className="text-[11px] font-semibold">Website</span>
              </button>
            </div>
          </div>
        </div>

        {/* Customer Controls & Preferences Card */}
        <Card className="p-4 border-[#E2E8F0] space-y-2">
          {/* Promotional Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#0F172A]">
                Promotional Notifications • ఆఫర్ల అలర్ట్‌లు
              </div>
              <p className="text-[11px] text-[#64748B]">
                Receive special festival offers and discounts from this partner
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`p-1 text-xl transition-colors ${promotionalNotifications ? 'text-[#1677F2]' : 'text-[#94A3B8]'}`}
            >
              {promotionalNotifications ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
        </Card>

        {/* Business Details & Address */}
        <Card className="p-4 border-slate-200 space-y-2.5 text-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Store Location & Hours
          </h3>
          {profile?.address && (
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{profile.address}</p>
                <p className="text-slate-500">{profile.city}, {profile.state} - {profile.pincode}</p>
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
            <span className="font-medium">Business Hours:</span>
            <span className="text-emerald-700 font-semibold">10:00 AM – 9:00 PM (All 7 Days)</span>
          </div>
        </Card>

        {/* Active Promotional Campaigns */}
        <div className="space-y-3 pt-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Active Promotional Campaigns ({campaigns.length})
          </h3>

          {campaigns.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">No active campaigns at this moment.</p>
            </div>
          ) : (
            campaigns.map((camp) => (
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
                        {camp.cta_text || 'View Offer'} →
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Valid 2027
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
