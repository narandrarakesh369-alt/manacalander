import React, { useState } from 'react';
import { Modal, Input, Button, Badge } from '@mana/ui';
import { Palette, Sparkles, Image, Check, CheckCircle2, RefreshCw } from 'lucide-react';

export interface BannerCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
  businessLogo?: string | null;
  onApplyBanner: (bannerDataUrl: string) => void;
}

const TEMPLATES = [
  {
    id: 'festive-gold',
    name: 'Ugadi Gold & Silk',
    bgClass: 'bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600',
    textColor: 'text-amber-50',
    accentColor: 'text-yellow-200',
    btnBg: 'bg-amber-400 text-slate-900',
  },
  {
    id: 'crimson-utsavam',
    name: 'Royal Crimson Festive',
    bgClass: 'bg-gradient-to-r from-rose-900 via-red-800 to-amber-700',
    textColor: 'text-rose-50',
    accentColor: 'text-amber-300',
    btnBg: 'bg-yellow-400 text-slate-900',
  },
  {
    id: 'mana-blue',
    name: 'Mana Classic Blue',
    bgClass: 'bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800',
    textColor: 'text-blue-50',
    accentColor: 'text-cyan-300',
    btnBg: 'bg-white text-blue-900',
  },
  {
    id: 'emerald-fresh',
    name: 'Rythu Emerald Green',
    bgClass: 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-700',
    textColor: 'text-emerald-50',
    accentColor: 'text-emerald-200',
    btnBg: 'bg-yellow-300 text-slate-900',
  },
  {
    id: 'modern-dark',
    name: 'Luxury Dark Platinum',
    bgClass: 'bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-800',
    textColor: 'text-slate-100',
    accentColor: 'text-amber-400',
    btnBg: 'bg-amber-500 text-slate-950',
  },
];

export const BannerCreatorModal: React.FC<BannerCreatorModalProps> = ({
  isOpen,
  onClose,
  businessName = 'Sri Lakshmi Jewellery',
  businessLogo = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300',
  onApplyBanner,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [headline, setHeadline] = useState('ఉగాది స్వర్ణోత్సవం — 50% తయారీ కూలి తగ్గింపు!');
  const [subtext, setSubtext] = useState('916 BIS హాల్‌మార్క్ బంగారు మరియు వజ్రాభరణాలపై ప్రత్యేక పండుగ ఆఫర్.');
  const [ctaText, setCtaText] = useState('రండి సందర్శించండి');
  const [badgeText, setBadgeText] = useState('Festive 2027 Special');
  const [showLogo, setShowLogo] = useState(true);

  const handleApply = () => {
    // Generate simulated high-res SVG/data URL representing the banner
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
        <defs>
          <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#854d0e" />
            <stop offset="50%" stop-color="#b45309" />
            <stop offset="100%" stop-color="#ca8a04" />
          </linearGradient>
        </defs>
        <rect width="1200" height="600" fill="url(#bannerGrad)" />
        <rect x="60" y="60" width="1080" height="480" rx="24" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
        <text x="100" y="140" fill="#fef08a" font-size="28" font-family="system-ui, sans-serif" font-weight="bold">${badgeText}</text>
        <text x="100" y="230" fill="#ffffff" font-size="46" font-family="system-ui, sans-serif" font-weight="900">${headline.replace(/&/g, '&amp;')}</text>
        <text x="100" y="300" fill="#fef3c7" font-size="28" font-family="system-ui, sans-serif">${subtext.replace(/&/g, '&amp;')}</text>
        <text x="100" y="440" fill="#ffffff" font-size="24" font-family="system-ui, sans-serif" font-weight="bold">${businessName}</text>
        <rect x="850" y="380" width="230" height="65" rx="14" fill="#facc15" />
        <text x="965" y="422" fill="#0f172a" font-size="22" font-family="system-ui, sans-serif" font-weight="bold" text-anchor="middle">${ctaText}</text>
      </svg>
    `.trim();

    const bannerUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    onApplyBanner(bannerUrl);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Built-in Banner Creator (Telugu + English Creatives)"
      size="xl"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} leftIcon={<Sparkles size={14} />}>
            Apply & Use This Banner
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Select Color Theme / Festive Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tmpl)}
                className={`p-2 rounded-xl text-left border-2 transition-all flex flex-col justify-between h-20 ${
                  tmpl.bgClass
                } ${
                  selectedTemplate.id === tmpl.id
                    ? 'border-yellow-400 ring-2 ring-yellow-400 scale-[1.02]'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <span className="text-[10px] font-bold text-white drop-shadow-xs line-clamp-2">
                  {tmpl.name}
                </span>
                {selectedTemplate.id === tmpl.id && (
                  <div className="self-end w-5 h-5 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Banner Canvas Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Live Banner Creative Preview (2:1 Aspect Ratio)
            </span>
            <Badge variant="primary" size="sm">
              Ready for Customer App
            </Badge>
          </div>

          <div
            className={`w-full aspect-[2/1] rounded-2xl p-6 ${selectedTemplate.bgClass} flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/20`}
          >
            {/* Background Festive Watermark */}
            <div className="absolute right-4 bottom-2 text-white/10 text-9xl font-bold select-none pointer-events-none">
              మ
            </div>

            {/* Top row: Badge and Logo */}
            <div className="flex items-center justify-between z-10">
              <span className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
                {badgeText}
              </span>
              {showLogo && businessLogo && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/20">
                  <img
                    src={businessLogo}
                    alt={businessName}
                    className="w-6 h-6 rounded-md object-cover bg-white"
                  />
                  <span className="text-xs font-bold text-white hidden sm:inline">
                    {businessName}
                  </span>
                </div>
              )}
            </div>

            {/* Middle row: Headline and Subtitle */}
            <div className="z-10 my-auto">
              <h3 className={`text-lg sm:text-2xl font-black ${selectedTemplate.textColor} drop-shadow-sm`}>
                {headline || 'Your Festive Headline Here'}
              </h3>
              <p className={`text-xs sm:text-sm font-medium ${selectedTemplate.accentColor} mt-1 max-w-lg`}>
                {subtext}
              </p>
            </div>

            {/* Bottom row: Business attribution & CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20 z-10">
              <span className="text-xs font-semibold text-white/90">
                {businessName} • Mana Calendar 2027 Partner
              </span>
              <div
                className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-transform flex items-center gap-1 ${selectedTemplate.btnBg}`}
              >
                <span>{ctaText || 'Learn More'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Input
            label="Festive Headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Ugadi Swarna Utsavam 50% Off"
          />
          <Input
            label="Offer Details / Subtitle"
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            placeholder="e.g. Pure 916 BIS Hallmark Gold Ornaments"
          />
          <Input
            label="Banner Tag / Badge"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            placeholder="e.g. Ugadi 2027 Special"
          />
          <Input
            label="CTA Button Text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder="e.g. Visit Store"
          />
        </div>
      </div>
    </Modal>
  );
};
