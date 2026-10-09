import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '@mana/ui';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Share2,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { CampaignService } from '@mana/services';
import type { Campaign, Banner } from '@mana/types';

export const CampaignDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<{
    id: string;
    business_id: string;
    business_name: string;
    title: string;
    description: string;
    discount: string;
    valid_until: string;
    image_url: string;
    phone: string;
    location: string;
    terms: string[];
  }>({
    id: id || 'DIWALI2027',
    business_id: 'SLJ001',
    business_name: 'Sri Lakshmi Jewellery',
    title: 'సంక్రాంతి & దీపావళి ప్రత్యేక బంగారు ఆభరణాల ఆఫర్',
    description:
      'పండుగ సందర్భంగా మా షోరూమ్‌ను సందర్శించండి. 916 BIS హాల్‌మార్క్ బంగారు ఆభరణాలు, డైమండ్ నెక్లెస్‌లు మరియు సాంప్రదాయ ఆభరణాలపై ప్రత్యేక ధరలు.',
    discount: 'తయారీ కూలి (VA) లో 50% తగ్గింపు',
    valid_until: '31 జనవరి 2027 వరకు',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    phone: '+91 891 2548999',
    location: 'ద్వారకా నగర్ మెయిన్ రోడ్, విశాఖపట్నం',
    terms: [
      'కనీస కొనుగోలు నిబంధనలు వర్తిస్తాయి',
      'ఈ ఆఫర్ ఇతర రాయితీలతో కలపబడదు',
      'స్టాక్ ఉన్నంత వరకు మాత్రమే',
    ],
  });

  return (
    <div className="p-4 space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#1677F2] hover:underline"
      >
        <ArrowLeft size={16} />
        <span>వెనుకకు (Back)</span>
      </button>

      {/* Hero Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-card h-48 bg-slate-100">
        <img
          src={campaign.image_url}
          alt={campaign.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <Badge variant="warning" size="sm" className="mb-1 font-bold">
            ప్రత్యేక ఆఫర్ • {campaign.business_id}
          </Badge>
          <h2 className="text-base font-bold leading-snug drop-shadow-sm">
            {campaign.title}
          </h2>
        </div>
      </div>

      {/* Business Details Card */}
      <Card padding="md">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[#0F172A]">{campaign.business_name}</span>
              <ShieldCheck size={14} className="text-emerald-600" />
            </div>
            <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-[#1677F2]" />
              {campaign.location}
            </p>
          </div>
          <Badge variant="primary" size="sm">Verified Partner</Badge>
        </div>

        {/* Highlight discount banner */}
        <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">రాయితీ వివరాలు</span>
          <span className="text-sm font-extrabold text-amber-900 block mt-0.5">{campaign.discount}</span>
          <span className="text-[11px] text-amber-800 flex items-center gap-1 mt-1">
            <Clock size={12} /> చెల్లుబాటు: {campaign.valid_until}
          </span>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          {campaign.description}
        </p>

        {/* Terms */}
        <div className="mt-3 pt-3 border-t border-[#E2E8F0] text-xs">
          <span className="font-semibold text-[#0F172A] block mb-1">నిబంధనలు & షరతులు:</span>
          <ul className="space-y-1 text-[11px] text-[#64748B]">
            {campaign.terms.map((t, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
          <a
            href={`tel:${campaign.phone}`}
            className="flex-1 py-2 px-3 rounded-xl border border-[#1677F2] text-[#1677F2] hover:bg-[#EAF3FF] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone size={14} />
            <span>సంప్రదించండి (Call)</span>
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: campaign.title, text: campaign.description, url: window.location.href });
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] transition-colors"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
};
