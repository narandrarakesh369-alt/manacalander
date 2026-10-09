import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, PromotionalBannerSlot, Modal } from '@mana/ui';
import {
  CalendarDays,
  Sparkles,
  PartyPopper,
  CloudSun,
  CalendarCheck,
  BellRing,
  MapPin,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  ArrowUp,
  ArrowDown,
  Droplets,
  Check,
} from 'lucide-react';
import {
  PanchangamService,
  WeatherService,
  CalendarService,
  LocationService,
  NotificationService,
} from '@mana/services';
import type { Panchangam, WeatherData, Festival, LocationConfig } from '@mana/types';
import { POPULAR_LOCATIONS } from '@mana/config';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationConfig>(LocationService.getCurrentLocation());
  const [panchangam, setPanchangam] = useState<Panchangam | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [upcomingFestivals, setUpcomingFestivals] = useState<Festival[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Subscribe to location changes
  useEffect(() => {
    const unsub = LocationService.subscribe((newLoc) => {
      setLocation(newLoc);
    });
    return () => unsub();
  }, []);

  // Fetch today's data (2027 default or active date)
  useEffect(() => {
    PanchangamService.getDailyPanchangam('2027-01-15', location).then(setPanchangam);
    WeatherService.getWeather(location).then(setWeather);
    CalendarService.getFestivals(2027, 1).then((fests) => {
      setUpcomingFestivals(fests.slice(0, 4));
    });
  }, [location]);

  const handleSelectLocation = (loc: LocationConfig) => {
    LocationService.setLocation(loc);
    setIsLocationModalOpen(false);
  };

  // Quick Action items matching Section 10 & 11
  const quickActions = [
    {
      id: 'calendar',
      labelEn: 'Calendar',
      labelTe: 'క్యాలెండర్',
      icon: CalendarDays,
      onClick: () => navigate('/calendar'),
    },
    {
      id: 'panchangam',
      labelEn: 'Panchangam',
      labelTe: 'పంచాంగం',
      icon: Sparkles,
      onClick: () => navigate('/calendar'),
    },
    {
      id: 'festivals',
      labelEn: 'Festivals',
      labelTe: 'పండుగలు',
      icon: PartyPopper,
      onClick: () => navigate('/calendar'),
    },
    {
      id: 'weather',
      labelEn: 'Weather',
      labelTe: 'వాతావరణం',
      icon: CloudSun,
      onClick: () => navigate('/weather'),
    },
    {
      id: 'events',
      labelEn: 'Events',
      labelTe: 'ఈవెంట్స్',
      icon: CalendarCheck,
      onClick: () => navigate('/events'),
    },
    {
      id: 'reminders',
      labelEn: 'Reminders',
      labelTe: 'రిమైండర్స్',
      icon: BellRing,
      onClick: () => navigate('/notifications'),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 1. LOCATION BAR (Tappable to switch) */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-xs text-xs font-semibold text-[#0F172A] hover:border-[#1677F2] transition-colors"
        >
          <MapPin size={14} className="text-[#1677F2]" />
          <span>{location.name_te || location.city}</span>
          <span className="text-[#64748B] font-normal">({location.city})</span>
          <ChevronRight size={13} className="text-[#94A3B8] ml-0.5" />
        </button>

        <span className="text-xs font-semibold text-[#64748B]">
          విశాఖపట్నం వేళల ప్రకారం
        </span>
      </div>

      {/* 2. CLEAN CENTERED DATE BLOCK (Section 9) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 text-center shadow-[0_2px_8px_rgba(15,23,42,0.05)] cursor-pointer hover:border-[#CBD5E1] transition-all"
        onClick={() => navigate('/calendar')}
      >
        <span className="inline-block text-[11px] font-bold tracking-wider text-[#1677F2] uppercase bg-[#EAF3FF] px-2.5 py-0.5 rounded-full mb-1.5">
          నేటి దినం • Today
        </span>
        <h2 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
          Friday, 15 January 2027
        </h2>
        <p className="text-[14px] text-[#475569] font-medium mt-1 font-telugu">
          శుక్రవారం, పుష్య బహుళ సప్తమి • మకర సంక్రాంతి
        </p>
      </div>

      {/* 3. WEATHER CARD (White / light-blue surface, Section 9) */}
      <div
        onClick={() => navigate('/weather')}
        className="bg-[#EAF3FF]/60 border border-[#BFDBFE]/70 rounded-[16px] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] cursor-pointer hover:border-[#1677F2] transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[12px] bg-white border border-[#BFDBFE] text-[#0EA5E9] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <CloudSun size={26} strokeWidth={1.9} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-bold text-[#0F172A] leading-none">
                  {weather?.temp_c || 28}°C
                </span>
                <span className="text-xs font-medium text-[#475569]">
                  {weather?.condition || 'Partly Cloudy'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1 font-telugu">
                {weather?.condition_te || 'పాక్షికంగా మేఘావృతం'} • {location.name_te || location.city}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-[#0F172A]">
              <span className="flex items-center text-red-600">
                <ArrowUp size={12} /> {weather?.temp_max_c || 32}°
              </span>
              <span className="flex items-center text-blue-600">
                <ArrowDown size={12} /> {weather?.temp_min_c || 24}°
              </span>
            </div>
            <div className="flex items-center justify-end gap-1 text-[11px] text-[#64748B] mt-1">
              <Droplets size={12} className="text-[#0EA5E9]" />
              <span>తేమ {weather?.humidity || 68}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. HOME QUICK ACTIONS (Section 10 — Compact rounded icon buttons) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center p-2 rounded-[12px] hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center mb-1.5 group-hover:scale-105 group-hover:bg-[#1677F2] group-hover:text-white transition-all shadow-xs">
                  <Icon size={22} strokeWidth={1.9} />
                </div>
                <span className="text-[12px] font-semibold text-[#0F172A] leading-tight text-center">
                  {action.labelEn}
                </span>
                <span className="text-[10px] text-[#64748B] font-telugu leading-none mt-0.5 text-center">
                  {action.labelTe}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TODAY'S PANCHANGAM CARD (Section 16 compact rows) */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#1677F2]" />
              <span className="font-semibold text-[15px] text-[#0F172A]">నేటి పంచాంగం • Panchangam</span>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-[#1677F2] font-semibold hover:underline flex items-center"
            >
              మొత్తం చూడు <ChevronRight size={13} />
            </button>
          </div>
        }
        padding="md"
      >
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
            <span className="text-[11px] text-[#64748B] block font-medium">తిథి (Tithi)</span>
            <span className="font-bold text-[#0F172A] text-[13px] block mt-0.5 truncate">
              {panchangam?.tithi || 'శుక్ల సప్తమి'}
            </span>
          </div>

          <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
            <span className="text-[11px] text-[#64748B] block font-medium">నక్షత్రం (Nakshatra)</span>
            <span className="font-bold text-[#0F172A] text-[13px] block mt-0.5 truncate">
              {panchangam?.nakshatram || 'ఉత్తరాషాఢ'}
            </span>
          </div>

          <div className="p-2.5 rounded-[10px] bg-[#FEF2F2] border border-[#FEE2E2]">
            <span className="text-[11px] text-[#EF4444] block font-medium">రాహుకాలం (Rahu Kalam)</span>
            <span className="font-bold text-[#991B1B] text-[12px] block mt-0.5">
              {panchangam?.rahu_kalam || '10:30 AM – 12:00 PM'}
            </span>
          </div>

          <div className="p-2.5 rounded-[10px] bg-[#ECFDF3] border border-[#D1FADF]">
            <span className="text-[11px] text-[#16A34A] block font-medium">సూర్యోదయం (Sunrise)</span>
            <span className="font-bold text-[#14532D] text-[12px] block mt-0.5">
              {panchangam?.sunrise || '06:28 AM'}
            </span>
          </div>
        </div>
      </Card>

      {/* 6. PROMOTIONAL BANNER (Section 21 & 30 — Aspect ratio ~16:7, clicking opens Business Profile) */}
      <PromotionalBannerSlot screen="home" variant="prominent" />

      {/* 7. UPCOMING FESTIVALS (Section 17 & 39 — Small thumbnails 48-56px, rounded 10-12px) */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <PartyPopper size={16} className="text-[#F97316]" />
              <span className="font-semibold text-[15px] text-[#0F172A]">పండుగలు • Upcoming Festivals</span>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-[#1677F2] font-semibold hover:underline flex items-center"
            >
              క్యాలెండర్ <ChevronRight size={13} />
            </button>
          </div>
        }
        padding="none"
      >
        <div className="divide-y divide-[#EEF2F7]">
          {upcomingFestivals.map((fest) => (
            <div
              key={fest.id}
              onClick={() => navigate('/calendar')}
              className="p-3.5 flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-[#FFF7E6] text-[#F97316] flex items-center justify-center font-bold text-sm shrink-0 border border-[#FED7AA]">
                  {fest.calendar_date.split('-')[2]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] leading-tight">
                    {fest.name_te}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {fest.name_en} • {fest.calendar_date}
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                fest.is_holiday ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#EAF3FF] text-[#1677F2]'
              }`}>
                {fest.is_holiday ? 'సెలవు దినం' : 'పండుగ'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* LOCATION SELECTION MODAL */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="ప్రాంతాన్ని ఎంచుకోండి • Select Location"
      >
        <div className="space-y-2 py-2">
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = location.city === loc.city;
            return (
              <button
                key={loc.city}
                onClick={() => handleSelectLocation(loc)}
                className={`w-full p-3 rounded-[12px] flex items-center justify-between border transition-all text-left ${
                  isSelected
                    ? 'border-[#1677F2] bg-[#EAF3FF] text-[#1677F2]'
                    : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A]'
                }`}
              >
                <div>
                  <div className="font-bold text-sm">
                    {loc.name_te || loc.city} ({loc.city})
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    {loc.state} • {loc.latitude.toFixed(2)}° N, {loc.longitude.toFixed(2)}° E
                  </div>
                </div>
                {isSelected && <Check size={18} className="text-[#1677F2]" />}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
