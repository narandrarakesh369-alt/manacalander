import React, { useState } from 'react';
import { Badge } from '@mana/ui';
import {
  Smartphone,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronLeft,
  Share2,
  Heart,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export interface MobileCustomerPreviewProps {
  businessName?: string;
  businessLogo?: string | null;
  coverImage?: string | null;
  category?: string;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  hours?: string | null;
  // Campaign specific props
  campaignTitle?: string;
  campaignHeadline?: string;
  campaignDescription?: string;
  campaignImageUrl?: string | null;
  campaignCtaText?: string;
  campaignCtaUrl?: string;
  mode?: 'home' | 'profile';
}

export const MobileCustomerPreview: React.FC<MobileCustomerPreviewProps> = ({
  businessName = 'Sri Lakshmi Jewellery',
  businessLogo = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300',
  coverImage = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000',
  category = 'Jewellery & Ornaments',
  phone = '+91 891 275 8899',
  whatsapp = '+918912758899',
  address = 'Main Road, Dwaraka Nagar',
  city = 'Visakhapatnam',
  hours = '10:00 AM - 9:30 PM (Mon-Sat)',
  campaignTitle = 'Ugadi Swarna Utsavam Special',
  campaignHeadline = 'Flat 50% Off on Gold Making Charges',
  campaignDescription = 'Special Ugadi festive offer on all 916 BIS Hallmark bridal necklace sets.',
  campaignImageUrl = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
  campaignCtaText = 'View Festive Collection',
  campaignCtaUrl = 'https://srilakshmijewellers.in',
  mode: initialMode = 'home',
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>(initialMode);

  return (
    <div className="flex flex-col items-center">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-xl mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'home'
              ? 'bg-white text-[#1677F2] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Customer Home Screen
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'profile'
              ? 'bg-white text-[#1677F2] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Customer Store Profile
        </button>
      </div>

      {/* Realistic Mobile Device Mockup */}
      <div className="w-[340px] h-[670px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col overflow-hidden">
        {/* Device Speaker & Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
          <div className="w-8 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Device Status Bar */}
        <div className="h-6 w-full pt-1 px-4 flex items-center justify-between text-[11px] text-white font-medium z-20">
          <span>09:41</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2 border border-white rounded-sm p-0.5 flex items-center">
              <div className="w-2 h-1 bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col relative text-slate-900 select-none">
          {activeTab === 'home' ? (
            /* ================= CUSTOMER HOME SCREEN ================= */
            <div className="flex-1 flex flex-col overflow-y-auto pb-14">
              {/* App Header */}
              <div className="bg-[#1677F2] text-white p-3.5 pt-2 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                    <span>మన క్యాలెండర్ 2027</span>
                    <Badge variant="warning" size="sm" className="text-[9px] py-0 px-1 bg-amber-400 text-slate-900 border-none font-bold">
                      తెలుగు
                    </Badge>
                  </h4>
                  <p className="text-[10px] text-blue-100 font-medium">
                    {city} • శ్రీ ప్లవ నామ సంవత్సరం
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  🔔
                </div>
              </div>

              {/* Date & Panchangam Strip */}
              <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex flex-col items-center justify-center text-slate-900 shadow-2xs">
                    <span className="text-[9px] font-bold text-[#1677F2] uppercase">SUN</span>
                    <span className="text-base font-extrabold leading-none">10</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">ఉగాది తెలుగు నూతన సంవత్సరం</div>
                    <div className="text-[10px] text-slate-500">చైత్ర శుద్ధ పాడ్యమి • రేవతి నక్షత్రం</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  శుభ ముహూర్తం
                </span>
              </div>

              {/* Banner Area (Customer View of Campaign) */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#1677F2]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Festive Partner Offer
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Sponsored</span>
                </div>

                {/* True-to-Life Promotional Card */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Creative Banner Image */}
                  <div className="relative h-32 w-full bg-slate-100">
                    <img
                      src={campaignImageUrl || coverImage || ''}
                      alt={campaignTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verified Business
                    </div>
                  </div>

                  {/* Merchant & Offer Details */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        src={businessLogo || ''}
                        alt="Logo"
                        className="w-6 h-6 rounded-md object-cover border border-slate-200"
                      />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {businessName}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-[#0F172A] line-clamp-1">
                      {campaignTitle}
                    </h5>

                    {campaignHeadline && (
                      <p className="text-[11px] font-semibold text-[#1677F2] mt-0.5 line-clamp-1">
                        {campaignHeadline}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {campaignDescription}
                    </p>

                    {/* CTA Button */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {city}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1 bg-[#1677F2] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
                      >
                        <span>{campaignCtaText || 'View Offer'}</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= CUSTOMER BUSINESS PROFILE SCREEN ================= */
            <div className="flex-1 flex flex-col overflow-y-auto pb-14 bg-slate-50">
              {/* Profile Top Bar */}
              <div className="relative h-28 bg-slate-200">
                <img
                  src={coverImage || ''}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <Share2 size={13} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <Heart size={13} />
                  </div>
                </div>
              </div>

              {/* Profile Header Info */}
              <div className="px-3 pb-3 bg-white border-b border-slate-200">
                <div className="flex items-end justify-between -mt-7 mb-2">
                  <img
                    src={businessLogo || ''}
                    alt={businessName}
                    className="w-14 h-14 rounded-2xl object-cover border-3 border-white shadow-md bg-white"
                  />
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Following
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                  {businessName}
                </h4>
                <p className="text-[10px] font-semibold text-[#1677F2] mt-0.5">
                  {category}
                </p>

                <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                  {campaignDescription}
                </p>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-xs"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp Store</span>
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 text-white rounded-xl text-[11px] font-bold shadow-xs"
                    >
                      <Phone size={13} />
                      <span>Call Merchant</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Details & Location */}
              <div className="p-3 space-y-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin size={13} className="text-[#1677F2] shrink-0 mt-0.5" />
                    <span>{address}, {city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 pt-1 border-t border-slate-100">
                    <Clock size={13} className="text-amber-500 shrink-0" />
                    <span className="text-[10px]">{hours}</span>
                  </div>
                </div>

                {/* Active Campaign Card */}
                <div>
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Current Festival Offers
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-2xs">
                    <img
                      src={campaignImageUrl || coverImage || ''}
                      alt="Offer"
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {campaignTitle}
                      </div>
                      <div className="text-[10px] text-[#1677F2] font-semibold truncate">
                        {campaignHeadline}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Bottom Navigation Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 flex items-center justify-between text-[9px] font-bold text-slate-500 z-20">
            <div className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#1677F2]' : ''}`}>
              <Calendar size={15} />
              <span>Calendar</span>
            </div>
            <div className="flex flex-col items-center">
              <span>🕉️</span>
              <span>Panchang</span>
            </div>
            <div className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#1677F2]' : ''}`}>
              <span>🏪</span>
              <span>Stores</span>
            </div>
            <div className="flex flex-col items-center">
              <span>⛅</span>
              <span>Weather</span>
            </div>
          </div>
        </div>

        {/* Device Home Bar indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/60 rounded-full" />
      </div>

      <span className="text-[11px] text-slate-500 mt-2 font-mono">
        📱 High-fidelity customer smartphone viewport
      </span>
    </div>
  );
};
