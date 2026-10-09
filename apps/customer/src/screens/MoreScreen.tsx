import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge } from '@mana/ui';
import {
  Globe,
  MapPin,
  Bell,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Info,
  Building2,
} from 'lucide-react';
import { APP_CONFIG, DEFAULT_LOCATION } from '@mana/config';

export const MoreScreen: React.FC = () => {
  const navigate = useNavigate();

  // Clean, uncrowded menu items matching Section 29
  const menuItems = [
    {
      id: 'language',
      titleEn: 'Language (భాష)',
      descEn: 'Telugu + English (ద్విభాష)',
      icon: Globe,
      color: 'bg-[#EAF3FF] text-[#1677F2]',
      onClick: () => navigate('/settings'),
    },
    {
      id: 'location',
      titleEn: 'Location (ప్రాంతం)',
      descEn: `${DEFAULT_LOCATION.city}, Andhra Pradesh`,
      icon: MapPin,
      color: 'bg-emerald-50 text-[#16A34A]',
      onClick: () => navigate('/settings'),
    },
    {
      id: 'settings',
      titleEn: 'Settings (సెట్టింగ్స్)',
      descEn: 'Calendar preferences & display options',
      icon: Settings,
      color: 'bg-slate-100 text-[#475569]',
      onClick: () => navigate('/settings'),
    },
    {
      id: 'notifications',
      titleEn: 'Notifications (నోటిఫికేషన్లు)',
      descEn: 'Festival reminders & Panchangam alerts',
      icon: Bell,
      color: 'bg-amber-50 text-[#F59E0B]',
      onClick: () => navigate('/notifications'),
    },
    {
      id: 'privacy',
      titleEn: 'Privacy & Terms (గోప్యత)',
      descEn: 'Data protection & terms of service',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-[#1677F2]',
      onClick: () => navigate('/privacy'),
    },
    {
      id: 'about',
      titleEn: 'About Mana Calendar 2027 (గురించి)',
      descEn: `Version ${APP_CONFIG.version} • Commercial Telugu Calendar`,
      icon: Info,
      color: 'bg-indigo-50 text-[#7C3AED]',
      onClick: () => alert(`Mana Calendar 2027\nVersion ${APP_CONFIG.version}\nDesigned for Andhra Pradesh & Telangana.`),
    },
    {
      id: 'support',
      titleEn: 'Help & Support (సహాయం)',
      descEn: 'FAQs, contact support & user feedback',
      icon: HelpCircle,
      color: 'bg-rose-50 text-[#EF4444]',
      onClick: () => alert('For support, please contact: support@manacalendar2027.com'),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <div>
        <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
          మరిన్ని వివరాలు • More
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5">
          ప్రాధాన్యతలు, సెట్టింగ్స్ మరియు సమాచారం
        </p>
      </div>

      {/* Main Menu List (Section 29) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] divide-y divide-[#EEF2F7] overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${item.color}`}>
                  <Icon size={19} strokeWidth={1.9} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">
                    {item.titleEn}
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    {item.descEn}
                  </div>
                </div>
              </div>
              <ChevronRight size={17} className="text-[#94A3B8]" />
            </button>
          );
        })}
      </div>

      {/* Partner & Platform Portals */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1 block">
          పోర్టల్ ప్రవేశం • Platform Access
        </span>
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] divide-y divide-[#EEF2F7] overflow-hidden shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <button
            onClick={() => navigate('/business/login')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center">
                <Building2 size={18} strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">వ్యాపార డ్యాష్‌బోర్డ్ (Business Portal)</div>
                <div className="text-[11px] text-[#64748B]">Partner login & campaign management</div>
              </div>
            </div>
            <Badge variant="primary" size="sm">Partner</Badge>
          </button>

          <button
            onClick={() => navigate('/admin/login')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck size={18} strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">సూపర్ అడ్మిన్ (Super Admin)</div>
                <div className="text-[11px] text-[#64748B]">Platform governance & central controls</div>
              </div>
            </div>
            <Badge variant="neutral" size="sm">Admin</Badge>
          </button>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="p-4 bg-white rounded-[16px] border border-[#E2E8F0] text-center space-y-1 shadow-xs">
        <div className="text-xs font-bold text-[#0F172A]">మన క్యాలెండర్ 2027 • Mana Calendar</div>
        <div className="text-[11px] text-[#64748B]">Version {APP_CONFIG.version} • Built for Andhra Pradesh & Telangana</div>
      </div>
    </div>
  );
};
