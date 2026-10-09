import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign, BannerSlotScreen } from '@mana/types';
import { CampaignService, AnalyticsService, CustomerBusinessService } from '@mana/services';
import { ExternalLink, Sparkles, X } from 'lucide-react';

export interface PromotionalBannerSlotProps {
  screen: BannerSlotScreen;
  activeBusinessId?: string | null;
  followedBusinessIds?: string[];
  variant?: 'compact' | 'prominent';
  className?: string;
}

export const PromotionalBannerSlot: React.FC<PromotionalBannerSlotProps> = ({
  screen,
  activeBusinessId,
  followedBusinessIds,
  variant = 'compact',
  className = '',
}) => {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadBanner = async () => {
      try {
        const activeMode = activeBusinessId !== undefined
          ? activeBusinessId
          : CustomerBusinessService.getActiveBusinessMode();

        const banner = await CampaignService.getRotatedBanners(
          screen,
          followedBusinessIds,
          activeMode
        );

        if (isMounted) {
          setCampaign(banner);
          setIsLoading(false);
          if (banner) {
            AnalyticsService.track('banner_impression', banner.business_id, banner.id, {
              screen,
              variant,
            });
          }
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadBanner();
    return () => {
      isMounted = false;
    };
  }, [screen, activeBusinessId, followedBusinessIds, variant]);

  if (isLoading || !campaign || isDismissed) {
    return null;
  }

  const handleBannerClick = () => {
    AnalyticsService.track('banner_click', campaign.business_id, campaign.id, {
      screen,
      variant,
    });

    if (campaign.cta_url && campaign.cta_url.startsWith('http') && !campaign.cta_url.includes(window.location.host)) {
      window.open(campaign.cta_url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/business-profile/${campaign.business_id}`);
    }
  };

  const isProminent = variant === 'prominent';

  return (
    <div
      className={`relative overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all hover:border-[#CBD5E1] ${
        isProminent ? 'p-4' : 'p-3.5'
      } ${className}`}
      data-testid="promotional-banner-slot"
      data-screen={screen}
    >
      {/* Non-intrusive micro-badge & dismiss button */}
      <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F7] mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-800 uppercase bg-[#FFF7E6] border border-[#FDE68A] px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            ప్రాయోజిత • Featured Partner
          </span>
          <span className="text-[11px] font-semibold text-[#0F172A]">
            {campaign.business_id === 'SLJ001' ? 'Sri Lakshmi Jewellers' : campaign.business_id === 'RF002' ? 'Radha Flours & Foods' : campaign.business_id}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded-full transition-colors"
          title="Dismiss for this session"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Banner Body (responsive ~16:7 look) */}
      <div
        onClick={handleBannerClick}
        className="cursor-pointer group flex items-center gap-3.5"
      >
        {campaign.image_url && (
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-20 rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0]">
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#1677F2] transition-colors line-clamp-1">
            {campaign.title}
          </h4>
          {campaign.description && (
            <p className="text-xs text-[#475569] line-clamp-2 mt-0.5 leading-relaxed">
              {campaign.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] bg-[#FFF7E6] hover:bg-[#FDE68A] border border-[#FCD34D] px-3 py-1 rounded-[8px] transition-colors shadow-xs"
            >
              <span>{campaign.cta_text || 'View Offer'}</span>
              <ExternalLink className="w-3 h-3 text-amber-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
