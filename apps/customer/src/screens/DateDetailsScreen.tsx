import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Modal, Input, SegmentedControl, PromotionalBannerSlot } from '@mana/ui';
import {
  ChevronLeft,
  Share2,
  Heart,
  Clock,
  Sparkles,
  CloudSun,
  CalendarCheck,
  Plus,
  MapPin,
  ArrowUp,
  ArrowDown,
  Droplets,
  Wind,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import {
  CalendarService,
  PanchangamService,
  WeatherService,
  EventsService,
  LocationService,
  type DateDetailsBundle,
} from '@mana/services';
import type { UserEvent, EventCategory } from '@mana/types';
import { WEEKDAYS, MONTHS, getUiText } from '@mana/config';

type TabType = 'overview' | 'panchangam' | 'weather' | 'events';

export const DateDetailsScreen: React.FC = () => {
  const { date: paramDate } = useParams<{ date: string }>();
  const navigate = useNavigate();

  // Selected date defaults to 2027-01-15 or route param
  const selectedDate = paramDate || '2027-01-15';

  const [location, setLocation] = useState(LocationService.getCurrentLocation());
  const [dateBundle, setDateBundle] = useState<DateDetailsBundle | null>(null);
  const [dateWeather, setDateWeather] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add Event Modal
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>('custom');
  const [newEventDesc, setNewEventDesc] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [bundle, weather] = await Promise.all([
          CalendarService.getDateDetails(selectedDate, location),
          WeatherService.getForecastForDate(selectedDate, location),
        ]);

        if (isMounted) {
          setDateBundle(bundle);
          setDateWeather(weather);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, location]);

  const p = dateBundle?.panchangam;

  // Format English Date: e.g. "14 October 2026" or "15 January 2027"
  const formattedEnglishDate = React.useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const mObj = MONTHS[monthIdx];
      return `${day} ${mObj ? mObj.en : ''} ${year}`;
    }
    return selectedDate;
  }, [selectedDate]);

  // Format Telugu Subtitle Date: e.g. "శుక్రవారం, పుష్య బహుళ సప్తమి • ఉత్తరాషాఢ నక్షత్రం"
  const teluguDateSubtitle = React.useMemo(() => {
    if (!dateBundle) return 'శుక్రవారం, పుష్య బహుళ సప్తమి';
    const dayName = WEEKDAYS[dateBundle.day_of_week]?.full.te || 'శుక్రవారం';
    const masam = p?.masam_te || 'పుష్య మాసం';
    const paksha = p?.paksha_te || 'శుక్ల పక్షం';
    const tithi = p?.tithi || 'సప్తమి';
    return `${dayName}, ${masam}, ${paksha} • ${tithi}`;
  }, [dateBundle, p]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    await EventsService.createEvent({
      title: newEventTitle.trim(),
      event_date: selectedDate,
      start_time: newEventTime,
      category: newEventCategory,
      description: newEventDesc.trim() || undefined,
      reminder_enabled: true,
    });

    // Refresh bundle
    const updated = await CalendarService.getDateDetails(selectedDate, location);
    setDateBundle(updated);

    setIsAddEventModalOpen(false);
    setNewEventTitle('');
    setNewEventDesc('');
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview • ముఖ్యాంశాలు' },
    { id: 'panchangam' as const, label: 'Panchangam • పంచాంగం' },
    { id: 'weather' as const, label: 'Weather • వాతావరణం' },
    { id: 'events' as const, label: 'Events • ఈవెంట్స్' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 1. TOP HEADER (Section 14: Back, Date, Favorite/More) */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => navigate('/calendar')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-white hover:text-[#1677F2] transition-colors border border-transparent hover:border-[#E2E8F0]"
          title="Back to Calendar"
          aria-label="Back to Calendar"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <div className="text-center">
          <h2 className="text-[18px] font-bold text-[#0F172A] leading-tight">
            {formattedEnglishDate}
          </h2>
          <p className="text-[12px] text-[#475569] font-medium mt-0.5 font-telugu">
            {teluguDateSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isFavorite
                ? 'bg-[#FEF2F2] text-[#EF4444]'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
            }`}
            title="Bookmark this date"
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Mana Calendar: ${formattedEnglishDate}`,
                  text: `${formattedEnglishDate} (${teluguDateSubtitle}) పంచాంగ వివరాలు`,
                  url: window.location.href,
                }).catch(() => {});
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-colors"
            title="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* 2. COMPACT SEGMENTED TABS (Section 14) */}
      <div className="flex justify-center overflow-x-auto pb-1">
        <SegmentedControl<TabType>
          options={tabs}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          size="sm"
          variant="subtle"
        />
      </div>

      {/* TAB CONTENT: 1. OVERVIEW (Default) */}
      {(activeTab === 'overview' || activeTab === 'weather') && (
        <>
          {/* SECTION 15: DATE DETAILS — WEATHER FOR SELECTED DATE */}
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2F7]">
              <div>
                <span className="text-[11px] font-bold text-[#1677F2] uppercase tracking-wider block">
                  వాతావరణం • Weather
                </span>
                <h3 className="text-sm font-semibold text-[#0F172A] mt-0.5">
                  {location.name_te || location.city} ({location.city})
                </h3>
              </div>
              <Badge variant="primary" size="sm">
                {selectedDate}
              </Badge>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[12px] bg-[#EAF3FF] text-[#0EA5E9] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                  <CloudSun size={28} strokeWidth={1.9} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[34px] font-bold text-[#0F172A] leading-none">
                      {dateWeather?.temp_c || 30}°C
                    </span>
                    <span className="text-sm font-medium text-[#475569]">
                      {dateWeather?.condition || 'Partly Cloudy'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 font-telugu">
                    {dateWeather?.condition_te || 'పాక్షికంగా మేఘావృతం'} • అనిపించే ఉష్ణోగ్రత {dateWeather?.feels_like_c || 31}°C
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-[#0F172A]">
                  <span className="text-red-600 font-semibold">{dateWeather?.temp_max_c || 32}° ↑</span>{' '}
                  <span className="text-blue-600 font-semibold">{dateWeather?.temp_min_c || 25}° ↓</span>
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">
                  తేమ: {dateWeather?.humidity || 68}%
                </div>
              </div>
            </div>

            {/* Hourly Forecast: Now, 12 PM, 3 PM, 6 PM, 9 PM */}
            <div className="pt-3 border-t border-[#EEF2F7]">
              <span className="text-[11px] font-semibold text-[#64748B] block mb-2">
                గంటల వారీ అంచనా (Hourly Forecast)
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {(dateWeather?.hourly_forecast?.slice(0, 5) || [
                  { time: 'Now', temp_c: 30, condition: 'Partly Cloudy' },
                  { time: '12 PM', temp_c: 32, condition: 'Sunny' },
                  { time: '3 PM', temp_c: 31, condition: 'Partly Cloudy' },
                  { time: '6 PM', temp_c: 28, condition: 'Clear' },
                  { time: '9 PM', temp_c: 26, condition: 'Clear' },
                ]).map((hr: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
                    <span className="text-[10px] text-[#64748B] block font-medium">{hr.time}</span>
                    <CloudSun size={18} className="mx-auto my-1 text-[#0EA5E9]" />
                    <span className="text-[12px] font-bold text-[#0F172A] block">{hr.temp_c}°</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/weather')}
                className="w-full mt-3 py-2 text-center text-xs font-semibold text-[#1677F2] hover:bg-[#EAF3FF] rounded-[10px] transition-colors"
              >
                పూర్తి 7 రోజుల అంచనా చూడు (View 7 Day Forecast) →
              </button>
            </div>
          </div>
        </>
      )}

      {/* SECTION 16: DATE DETAILS — PANCHANGAM DETAILS */}
      {(activeTab === 'overview' || activeTab === 'panchangam') && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#1677F2]" />
              <span className="font-semibold text-[15px] text-[#0F172A]">
                పంచాంగ వివరాలు • Panchangam Details
              </span>
            </div>
          }
          padding="md"
        >
          {/* Compact rows: Tithi, Nakshatra, Yoga, Karana */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
              <span className="text-[11px] text-[#64748B] block font-medium">తిథి (Tithi)</span>
              <span className="font-bold text-[#0F172A] text-[13px] block mt-0.5 truncate">
                {p?.tithi || 'శుక్ల దశమి'}
              </span>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
              <span className="text-[11px] text-[#64748B] block font-medium">నక్షత్రం (Nakshatra)</span>
              <span className="font-bold text-[#0F172A] text-[13px] block mt-0.5 truncate">
                {p?.nakshatram || 'రోహిణి (Rohini)'}
              </span>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
              <span className="text-[11px] text-[#64748B] block font-medium">యోగం (Yoga)</span>
              <span className="font-bold text-[#0F172A] text-[13px] block mt-0.5 truncate">
                {p?.yogam || 'శోభన (Shobhana)'}
              </span>
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
              <span className="text-[11px] text-[#64748B] block font-medium">కరణం (Karana)</span>
              <span className="font-bold text-[#0F172A] text-[13px] block mt-0.5 truncate">
                {p?.karanam || 'బవ (Bava)'}
              </span>
            </div>
          </div>

          {/* Two-column timing area: Sunrise / Sunset, Moonrise / Moonset */}
          <div className="mt-3 grid grid-cols-2 gap-2 pt-2.5 border-t border-[#EEF2F7] text-xs">
            <div className="flex items-center justify-between p-2 rounded-[8px] bg-amber-50/60 border border-amber-100">
              <span className="text-[#B45309] font-medium flex items-center gap-1">
                <Sun size={13} /> సూర్యోదయం
              </span>
              <span className="font-bold text-[#78350F]">{p?.sunrise || '06:28 AM'}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-orange-50/60 border border-orange-100">
              <span className="text-[#C2410C] font-medium flex items-center gap-1">
                <Sun size={13} /> సూర్యాస్తమయం
              </span>
              <span className="font-bold text-[#7C2D12]">{p?.sunset || '05:54 PM'}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-indigo-50/60 border border-indigo-100">
              <span className="text-[#4338CA] font-medium flex items-center gap-1">
                <Moon size={13} /> చంద్రోదయం
              </span>
              <span className="font-bold text-[#312E81]">{p?.moonrise || '11:42 AM'}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[8px] bg-indigo-50/60 border border-indigo-100">
              <span className="text-[#4338CA] font-medium flex items-center gap-1">
                <Moon size={13} /> చంద్రాస్తమయం
              </span>
              <span className="font-bold text-[#312E81]">{p?.moonset || '12:15 AM'}</span>
            </div>
          </div>

          {/* Muhurthams & Kalams: Rahu, Yamagandam, Gulika, Abhijit, Durmuhurtham, Varjyam, Amrita Kalam */}
          <div className="mt-3 pt-2.5 border-t border-[#EEF2F7] space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#FEF2F2]">
              <span className="text-[#EF4444] font-semibold">రాహు కాలం (Rahu Kalam)</span>
              <span className="font-bold text-[#991B1B]">{p?.rahu_kalam || '10:30 AM – 12:00 PM'}</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#FFF7E6]">
              <span className="text-[#F59E0B] font-semibold">యమగండం (Yamagandam)</span>
              <span className="font-bold text-[#92400E]">{p?.yama_gandam || '03:00 PM – 04:30 PM'}</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#F8FAFC]">
              <span className="text-[#64748B] font-medium">గుళిక కాలం (Gulika Kalam)</span>
              <span className="font-bold text-[#0F172A]">{p?.gulika_kalam || '07:30 AM – 09:00 AM'}</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#ECFDF3]">
              <span className="text-[#16A34A] font-semibold">అభిజిత్ ముహూర్తం (Abhijit Muhurtham)</span>
              <span className="font-bold text-[#14532D]">{p?.abhijit_muhurtham || '11:45 AM – 12:35 PM'}</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#FEF2F2]">
              <span className="text-[#EF4444] font-semibold">దుర్ముహూర్తం (Durmuhurtham)</span>
              <span className="font-bold text-[#991B1B]">{p?.durmuhurtham || '08:45 AM – 09:32 AM'}</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#F8FAFC]">
              <span className="text-[#64748B] font-medium">వర్జ్యం (Varjyam)</span>
              <span className="font-bold text-[#0F172A]">{p?.varjyam || '06:10 PM – 07:45 PM'}</span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-[6px] bg-[#F5F3FF]">
              <span className="text-[#7C3AED] font-semibold">అమృత కాలం (Amrita Kalam)</span>
              <span className="font-bold text-[#5B21B6]">{p?.amrita_kalam || '04:15 AM – 05:50 AM'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 17: FESTIVAL / SPECIAL DAY ON THIS DATE */}
      {dateBundle?.festivals && dateBundle.festivals.length > 0 && (activeTab === 'overview' || activeTab === 'events') && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#F97316]" />
              <span className="font-semibold text-[15px] text-[#0F172A]">
                పండుగ & ప్రాముఖ్యత • Festival
              </span>
            </div>
          }
          padding="md"
        >
          {dateBundle.festivals.map((fest) => (
            <div key={fest.id} className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-[12px] bg-[#FFF7E6] border border-[#FED7AA] flex flex-col items-center justify-center shrink-0 text-[#F97316]">
                <span className="text-base font-bold leading-none">
                  {selectedDate.split('-')[2]}
                </span>
                <span className="text-[10px] uppercase font-semibold mt-0.5">
                  పండుగ
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {fest.name_te} ({fest.name_en})
                  </h4>
                  <Badge variant={fest.is_holiday ? 'danger' : 'warning'} size="sm">
                    {fest.tag || 'ముఖ్య దినం'}
                  </Badge>
                </div>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  {fest.description_te || 'ఆంధ్రప్రదేశ్ మరియు తెలంగాణ ప్రాంతాల్లో అత్యంత భక్తి శ్రద్ధలతో జరుపుకునే పవిత్ర పర్వదినం.'}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* SECTION 18: USER EVENTS ON THIS DATE */}
      {(activeTab === 'overview' || activeTab === 'events') && (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-[#1677F2]" />
                <span className="font-semibold text-[15px] text-[#0F172A]">
                  ఈ రోజు ఈవెంట్లు ({formattedEnglishDate})
                </span>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAddEventModalOpen(true)}
                leftIcon={<Plus size={14} />}
              >
                జోడించు
              </Button>
            </div>
          }
          padding="md"
        >
          {dateBundle?.userEvents && dateBundle.userEvents.length > 0 ? (
            <div className="space-y-2">
              {dateBundle.userEvents.map((ev: UserEvent) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-[12px] bg-[#F8FAFC] border border-[#EEF2F7] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EAF3FF] text-[#1677F2] flex items-center justify-center font-bold text-xs">
                      {ev.start_time?.slice(0, 2) || 'AM'}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#0F172A]">{ev.title}</h5>
                      <span className="text-[11px] text-[#64748B]">
                        {ev.start_time || 'రోజంతా'} • {ev.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-[#64748B]">
                ఈ తేదీన వ్యక్తిగత ఈవెంట్లు లేవు. కొత్త ఈవెంట్ జోడించండి.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* SECTION 19: RELATED INFORMATION (Mantra, Pooja Vidhanam, Fasting, Do's & Don'ts) */}
      {(activeTab === 'overview' || activeTab === 'panchangam') && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[#7C3AED]" />
              <span className="font-semibold text-[15px] text-[#0F172A]">
                పూజా విధానం & ప్రాముఖ్యత • Related Information
              </span>
            </div>
          }
          padding="md"
        >
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="p-3 rounded-[10px] bg-[#FFF7E6] border border-[#FED7AA]">
              <span className="font-bold text-[#92400E] block mb-1">
                మంత్రం & పూజా విధానం (Mantra & Pooja Vidhanam)
              </span>
              <p className="text-[#78350F] italic font-telugu">
                "ఓం సూర్యాయ నమః • ఓం ఆదిత్యాయ నమః • గాయత్రీ మంత్ర జపం శ్రేయస్కరం"
              </p>
              <p className="text-[#92400E] mt-1 text-[11px]">
                ఉదయం సూర్యోదయ సమయంలో సూర్య నమస్కారాలు చేయడం మరియు రాగి పాత్రలో నీటితో అర్ఘ్యప్రదానం చేయడం విశేష ఫలప్రదం.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-[10px] bg-[#ECFDF3] border border-[#D1FADF]">
                <span className="font-bold text-[#16A34A] block mb-0.5">ఉపవాస నియమాలు</span>
                <p className="text-[#14532D] text-[11px]">
                  ఏకాదశి / పర్వదిన ఉపవాసం ఉన్నవారు సాత్విక ఆహారం స్వీకరించాలి.
                </p>
              </div>

              <div className="p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
                <span className="font-bold text-[#0F172A] block mb-0.5">శుభ సూచనలు</span>
                <p className="text-[#475569] text-[11px]">
                  నూతన కార్యాలు అభిజిత్ ముహూర్తంలో ప్రారంభించడం శ్రేష్టం.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 20: NEARBY PLACES (Optional nearby temples) */}
      {activeTab === 'overview' && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#1677F2]" />
              <span className="font-semibold text-[15px] text-[#0F172A]">
                సమీప దేవాలయాలు • Nearby Temples
              </span>
            </div>
          }
          padding="md"
        >
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#EEF2F7]">
              <div>
                <span className="font-bold text-[#0F172A] block">
                  శ్రీ వరాహ లక్ష్మీ నరసింహ స్వామి దేవాలయం (సింహాచలం)
                </span>
                <span className="text-[11px] text-[#64748B]">సింహాచలం, విశాఖపట్నం • 14 కి.మీ</span>
              </div>
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=Simhachalam+Temple`, '_blank')}
                className="p-2 rounded-full bg-white border border-[#E2E8F0] text-[#1677F2] hover:bg-[#EAF3FF]"
                title="Directions"
              >
                <Navigation size={14} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 21: PROMOTIONAL BANNER */}
      <PromotionalBannerSlot screen="date_details" variant="compact" />

      {/* ADD EVENT MODAL */}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title={`ఈవెంట్ జోడించండి (${selectedDate})`}
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 py-2">
          <Input
            label="ఈవెంట్ శీర్షిక (Event Title)"
            placeholder="ఉదా: డాక్టర్ అపాయింట్‌మెంట్ / పూజ"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                సమయం (Time)
              </label>
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-full h-[46px] rounded-[10px] border border-[#CBD5E1] px-3 text-sm text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                వర్గం (Category)
              </label>
              <select
                value={newEventCategory}
                onChange={(e) => setNewEventCategory(e.target.value as EventCategory)}
                className="w-full h-[46px] rounded-[10px] border border-[#CBD5E1] px-3 text-sm text-[#0F172A] bg-white"
              >
                <option value="puja">పూజ (Puja)</option>
                <option value="birthday">పుట్టినరోజు (Birthday)</option>
                <option value="meeting">సమావేశం (Meeting)</option>
                <option value="reminder">గుర్తుంచుకో (Reminder)</option>
                <option value="festival">పండుగ (Festival)</option>
              </select>
            </div>
          </div>

          <Input
            label="వివరాలు (Description)"
            placeholder="అదనపు వివరాలు..."
            value={newEventDesc}
            onChange={(e) => setNewEventDesc(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEventModalOpen(false)}
            >
              రద్దు (Cancel)
            </Button>
            <Button type="submit" variant="primary">
              భద్రపరచు (Save)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
