import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Modal, Input, PromotionalBannerSlot, SegmentedControl } from '@mana/ui';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Sun,
  Moon,
  Plus,
  Trash2,
  Bell,
  Check,
  AlertCircle,
  Tag,
  Share2,
  CloudRain,
} from 'lucide-react';
import {
  CalendarService,
  PanchangamService,
  LocationService,
  EventsService,
  WeatherService,
  type DateDetailsBundle,
} from '@mana/services';
import type {
  CalendarDate,
  Festival,
  UserEvent,
  LocationConfig,
  LanguagePreference,
  CalendarSearchResult,
  EventCategory,
} from '@mana/types';
import {
  MONTHS,
  WEEKDAYS,
  formatI18n,
  getUiText,
  POPULAR_LOCATIONS,
  DEFAULT_LOCATION,
} from '@mana/config';

export const CalendarScreen: React.FC = () => {
  const navigate = useNavigate();
  // Navigation & State
  const [year, setYear] = useState<number>(2027);
  const [month, setMonth] = useState<number>(1); // 1 = January
  const [selectedDate, setSelectedDate] = useState<string>('2027-01-15');
  const [lang, setLang] = useState<LanguagePreference>('te_en');
  const [location, setLocation] = useState<LocationConfig>(LocationService.getCurrentLocation());

  // Data states
  const [dates, setDates] = useState<CalendarDate[]>([]);
  const [dateDetails, setDateDetails] = useState<DateDetailsBundle | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'panchangam' | 'festivals' | 'events'>('panchangam');

  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CalendarSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>('birthday');
  const [newEventTime, setNewEventTime] = useState<string>('09:00');
  const [newEventDesc, setNewEventDesc] = useState<string>('');
  const [newEventReminder, setNewEventReminder] = useState<boolean>(true);

  // Subscribe to LocationService
  useEffect(() => {
    const unsubscribe = LocationService.subscribe((newLoc) => {
      setLocation(newLoc);
    });
    return () => unsubscribe();
  }, []);

  // Fetch month dates when year, month, or location changes
  useEffect(() => {
    let isMounted = true;
    CalendarService.getMonthDates(year, month, location).then((res) => {
      if (isMounted) setDates(res);
    });
    return () => {
      isMounted = false;
    };
  }, [year, month, location]);

  const [dateWeather, setDateWeather] = useState<any | null>(null);

  // Fetch single date details and weather forecast when selectedDate or location changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingDetails(true);
    CalendarService.getDateDetails(selectedDate, location)
      .then((res) => {
        if (isMounted) {
          setDateDetails(res);
          setIsLoadingDetails(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingDetails(false);
      });

    WeatherService.getForecastForDate(selectedDate, location).then((wf) => {
      if (isMounted) setDateWeather(wf);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, location]);

  // Handle Search input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      CalendarService.searchCalendar(searchQuery, year).then((res) => {
        setSearchResults(res);
        setIsSearching(false);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, year]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => {
    setYear((y) => y - 1);
  };

  const handleNextYear = () => {
    setYear((y) => y + 1);
  };

  const handleGoToday = () => {
    // Jump to 2027-01-15 (or today if current year matches)
    const today = new Date();
    if (today.getFullYear() === 2027) {
      const y = today.getFullYear();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      setYear(y);
      setMonth(m);
      setSelectedDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    } else {
      setYear(2027);
      setMonth(1);
      setSelectedDate('2027-01-15');
    }
  };

  const handleSelectSearchResult = (res: CalendarSearchResult) => {
    setYear(res.year);
    setMonth(res.month);
    setSelectedDate(res.calendar_date);
    setIsSearchModalOpen(false);
    setSearchQuery('');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    await EventsService.createEvent({
      title: newEventTitle.trim(),
      event_date: selectedDate,
      start_time: newEventTime,
      category: newEventCategory,
      description: newEventDesc.trim() || null,
      reminder_enabled: newEventReminder,
    });

    // Reset form & close modal
    setNewEventTitle('');
    setNewEventDesc('');
    setIsAddEventModalOpen(false);

    // Refresh details and dates to update dot indicators
    CalendarService.getDateDetails(selectedDate, location).then(setDateDetails);
    CalendarService.getMonthDates(year, month, location).then(setDates);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await EventsService.deleteEvent(eventId);
    CalendarService.getDateDetails(selectedDate, location).then(setDateDetails);
    CalendarService.getMonthDates(year, month, location).then(setDates);
  };

  // Month Name & Weekday Helpers based on active language
  const currentMonthLabel = useMemo(() => {
    const mItem = MONTHS[month - 1];
    if (!mItem) return '';
    return formatI18n(mItem, lang);
  }, [month, lang]);

  // First day of month padding for correct grid layout
  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  }, [year, month]);

  return (
    <div className="p-4 space-y-4">
      {/* 1. TOP UTILITY BAR: Language Switcher, Location Selector & Search (Section 12) */}
      <div className="flex items-center justify-between gap-2">
        <SegmentedControl<LanguagePreference>
          options={[
            { id: 'te', label: 'తెలుగు' },
            { id: 'en', label: 'English' },
            { id: 'te_en', label: 'Both' },
          ]}
          value={lang}
          onChange={(newLang) => setLang(newLang)}
          size="sm"
          variant="subtle"
        />

        {/* Location & Search Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1677F2] bg-[#EAF3FF] hover:bg-[#dbeafe] px-2.5 py-1 rounded-full transition-colors"
            title="Change Location"
          >
            <MapPin size={13} />
            <span className="truncate max-w-[80px]">
              {lang === 'en' ? location.city : location.name_te || location.city}
            </span>
          </button>

          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#1677F2] hover:bg-white transition-colors border border-[#E2E8F0]"
            title="Search Festivals or Dates"
            aria-label="Search"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* 2. CALENDAR CONTROLS & NAVIGATOR */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-subtle flex items-center justify-between">
        {/* Previous Month & Year */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevYear}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] text-[10px] font-bold px-1.5 transition-colors border border-transparent hover:border-[#E2E8F0]"
            title="Previous Year"
          >
            « {year - 1}
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Month & Year Title with Today Jump */}
        <div className="text-center">
          <h2 className="font-bold text-sm text-[#0F172A] tracking-tight">{currentMonthLabel}</h2>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-[#1677F2]">{year}</span>
            <button
              onClick={handleGoToday}
              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.2 rounded-full transition-colors"
            >
              {lang === 'en' ? 'Today' : 'నేడు (Today)'}
            </button>
          </div>
        </div>

        {/* Next Month & Year */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleNextYear}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] text-[10px] font-bold px-1.5 transition-colors border border-transparent hover:border-[#E2E8F0]"
            title="Next Year"
          >
            {year + 1} »
          </button>
        </div>
      </div>

      {/* 3. WEEKDAYS HEADER */}
      <div className="grid grid-cols-7 gap-1 text-center bg-white/60 p-1.5 rounded-xl border border-[#E2E8F0]/60">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd.short.en}
            className={`py-1 text-xs font-bold ${
              i === 0 ? 'text-red-500' : 'text-[#475569]'
            }`}
          >
            <div>{lang === 'en' ? wd.short.en : wd.short.te}</div>
            {lang === 'te_en' && (
              <div className="text-[9px] text-[#94a3b8] font-normal">{wd.short.en}</div>
            )}
          </div>
        ))}
      </div>

      {/* 4. CALENDAR MONTH GRID */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Blank padding cells before day 1 */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div
            key={`blank-${idx}`}
            className="min-h-[58px] p-1 rounded-xl bg-slate-50/50 border border-transparent"
          />
        ))}

        {/* Active Month Days */}
        {dates.map((d) => {
          const isSelected = selectedDate === d.calendar_date;
          const isSunday = d.day_of_week === 0;

          return (
            <button
              key={d.calendar_date}
              onClick={() => {
                setSelectedDate(d.calendar_date);
                navigate(`/date/${d.calendar_date}`);
              }}
              className={`min-h-[60px] p-1 rounded-[12px] flex flex-col items-center justify-between text-center transition-all border relative ${
                isSelected
                  ? 'border-[#1677F2] bg-[#1677F2] text-white shadow-sm ring-2 ring-[#1677F2]/20'
                  : d.is_today
                  ? 'border-[#1677F2] bg-[#EAF3FF]/40 text-[#0F172A]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] text-[#0F172A]'
              }`}
            >
              {/* Day Number (14-16px bold) */}
              <span
                className={`text-[15px] font-bold leading-none mt-1 ${
                  isSelected
                    ? 'text-white'
                    : isSunday || d.has_holiday
                    ? 'text-[#EF4444]'
                    : 'text-[#0F172A]'
                }`}
              >
                {d.day}
              </span>

              {/* Indicator dots (Festival = 3-5px dot) */}
              <div className="flex items-center gap-1 h-1.5 my-0.5">
                {d.has_festival && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-amber-300' : 'bg-[#F97316]'
                    }`}
                    title="Festival"
                  />
                )}
                {d.has_holiday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-red-200' : 'bg-[#EF4444]'
                    }`}
                    title="Holiday"
                  />
                )}
                {d.has_event && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-blue-200' : 'bg-[#1677F2]'
                    }`}
                    title="Personal Event"
                  />
                )}
              </div>

              {/* Short Tithi or Telugu date underneath (10-11px) */}
              <span
                className={`text-[10px] font-medium truncate w-full px-0.5 font-telugu ${
                  isSelected ? 'text-white/90' : 'text-[#64748B]'
                }`}
              >
                {lang === 'en'
                  ? d.tithi_short_en || 'Tithi'
                  : d.tithi_short_te || 'తిథి'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. SELECTED DATE DETAILS CARD & TABBED PANELS */}
      {dateDetails && (
        <Card padding="none" className="overflow-hidden border border-[#E2E8F0] shadow-card">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1677F2] to-[#0A4EA6] p-4 text-white">
            <div className="flex items-center justify-between text-white/80 text-[11px] font-medium">
              <span>
                {lang === 'en'
                  ? `${dateDetails.panchangam.masam_en || 'Pushya'} • ${dateDetails.panchangam.paksha_en || 'Shukla Paksha'}`
                  : `${dateDetails.panchangam.masam_te || 'పుష్య మాసం'} • ${dateDetails.panchangam.paksha_te || 'శుక్ల పక్షం'}`}
              </span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] backdrop-blur-sm">
                {dateDetails.location.city}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <h3 className="text-xl font-bold leading-tight">
                  {dateDetails.day}{' '}
                  {lang === 'en'
                    ? MONTHS[dateDetails.month - 1].en
                    : MONTHS[dateDetails.month - 1].te}{' '}
                  {dateDetails.year}
                </h3>
                <p className="text-xs text-white/90 mt-0.5 font-medium">
                  {lang === 'en'
                    ? WEEKDAYS[dateDetails.day_of_week].full.en
                    : WEEKDAYS[dateDetails.day_of_week].full.te}
                </p>
              </div>

              {/* Add Personal Event Quick Button */}
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="bg-white text-[#1677F2] hover:bg-white/90 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-all"
              >
                <Plus size={14} />
                <span>{lang === 'en' ? 'Add Event' : 'ఈవెంట్ (+)'}</span>
              </button>
            </div>

            {/* Samvatsaram & Ayanam Subtitle */}
            <div className="mt-3 pt-2.5 border-t border-white/20 text-[11px] text-white/85 flex flex-wrap gap-x-3 gap-y-1">
              <span>
                {lang === 'en'
                  ? dateDetails.panchangam.samvatsaram_en || 'Subhakrut Nama'
                  : dateDetails.panchangam.samvatsaram_te || 'శుభకృత్ నామ సంవత్సరం'}
              </span>
              <span>•</span>
              <span>
                {lang === 'en'
                  ? dateDetails.panchangam.ayanam_en || 'Uttarayana'
                  : dateDetails.panchangam.ayanam_te || 'ఉత్తరాయణం'}
              </span>
              <span>•</span>
              <span>
                {lang === 'en'
                  ? dateDetails.panchangam.rutuvu_en || 'Hemanta'
                  : dateDetails.panchangam.rutuvu_te || 'హేమంత ఋతువు'}
              </span>
            </div>
          </div>

          {/* Selected Date Weather Forecast (compact and visually secondary) */}
          {dateWeather && (
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2 flex items-center justify-between text-xs text-[#475569]">
              <div className="flex items-center gap-2">
                <Sun size={15} className="text-amber-500" />
                <span className="font-bold text-[#0F172A]">
                  {dateWeather.temp_max_c}° / {dateWeather.temp_min_c}°C
                </span>
                <span className="text-[#64748B]">
                  • {lang === 'en' ? dateWeather.condition : dateWeather.condition_te || dateWeather.condition}
                </span>
              </div>
              {dateWeather.rain_probability > 0 ? (
                <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                  <CloudRain size={12} /> {dateWeather.rain_probability}% వర్షం
                </span>
              ) : (
                <span className="text-[10px] text-[#94a3b8]">తేమ: {dateWeather.humidity}%</span>
              )}
            </div>
          )}

          {/* Details Tab Switcher */}
          <div className="flex border-b border-[#E2E8F0] bg-slate-50/70 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('panchangam')}
              className={`flex-1 py-2.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'panchangam'
                  ? 'border-[#1677F2] text-[#1677F2] bg-white'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Clock size={14} />
              <span>{lang === 'en' ? 'Panchangam' : 'పంచాంగం'}</span>
            </button>
            <button
              onClick={() => setActiveTab('festivals')}
              className={`flex-1 py-2.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'festivals'
                  ? 'border-[#1677F2] text-[#1677F2] bg-white'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sparkles size={14} />
              <span>
                {lang === 'en' ? 'Festivals' : 'పండుగలు'}
                {dateDetails.festivals.length > 0 && ` (${dateDetails.festivals.length})`}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'events'
                  ? 'border-[#1677F2] text-[#1677F2] bg-white'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <CalendarIcon size={14} />
              <span>
                {lang === 'en' ? 'My Events' : 'ఈవెంట్లు'}
                {dateDetails.userEvents.length > 0 && ` (${dateDetails.userEvents.length})`}
              </span>
            </button>
          </div>

          {/* TAB 1: PANCHANGAM DETAILS */}
          {activeTab === 'panchangam' && (
            <div className="p-4 space-y-4">
              {/* Core 5 Angas */}
              <div>
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>పంచాంగ ప్రధానాంగాలు (Core 5 Angas)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px] font-semibold uppercase">
                      తిథి (Tithi)
                    </span>
                    <span className="font-bold text-[#0F172A] mt-0.5 block">
                      {dateDetails.panchangam.tithi}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px] font-semibold uppercase">
                      నక్షత్రం (Nakshatra)
                    </span>
                    <span className="font-bold text-[#0F172A] mt-0.5 block">
                      {dateDetails.panchangam.nakshatram}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px] font-semibold uppercase">
                      యోగం (Yoga)
                    </span>
                    <span className="font-bold text-[#0F172A] mt-0.5 block">
                      {dateDetails.panchangam.yogam}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] block text-[10px] font-semibold uppercase">
                      కరణం (Karana)
                    </span>
                    <span className="font-bold text-[#0F172A] mt-0.5 block">
                      {dateDetails.panchangam.karanam}
                    </span>
                  </div>
                </div>
              </div>

              {/* Celestial Timings (Sun & Moon) */}
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                  సూర్య & చంద్ర సంచార సమయాలు (Sun & Moon Timings)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="text-[#64748B] text-[10px] block">సూర్యోదయం / Sunset</span>
                      <span className="font-semibold text-[#0F172A]">
                        {dateDetails.panchangam.sunrise} - {dateDetails.panchangam.sunset}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Moon size={16} className="text-indigo-400 flex-shrink-0" />
                    <div>
                      <span className="text-[#64748B] text-[10px] block">చంద్రోదయం / Moonset</span>
                      <span className="font-semibold text-[#0F172A]">
                        {dateDetails.panchangam.moonrise || '06:45 PM'} -{' '}
                        {dateDetails.panchangam.moonset || '06:15 AM'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auspicious Timings (Shubh Muhurtham) */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>శుభ సమయాలు (Auspicious Timings)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-medium">
                      అభిజిత్ ముహూర్తం
                    </span>
                    <span className="font-bold text-emerald-900">
                      {dateDetails.panchangam.abhijit_muhurtham || '11:45 AM - 12:35 PM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-medium">
                      అమృత ఘడియలు
                    </span>
                    <span className="font-bold text-emerald-900">
                      {dateDetails.panchangam.amrita_kalam || '02:15 PM - 03:45 PM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-medium">
                      బ్రహ్మ ముహూర్తం
                    </span>
                    <span className="font-bold text-emerald-900">
                      {dateDetails.panchangam.brahma_muhurtham || '04:52 AM - 05:40 AM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inauspicious Timings (Ashubh Timings) */}
              <div className="bg-red-50/70 p-3 rounded-xl border border-red-200">
                <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-red-600" />
                  <span>అశుభ సమయాలు (Inauspicious Timings)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-red-700 block text-[10px] font-medium">రాహుకాలం</span>
                    <span className="font-bold text-red-900">
                      {dateDetails.panchangam.rahu_kalam}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700 block text-[10px] font-medium">యమగండం</span>
                    <span className="font-bold text-red-900">
                      {dateDetails.panchangam.yama_gandam}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700 block text-[10px] font-medium">గుళిక కాలం</span>
                    <span className="font-bold text-red-900">
                      {dateDetails.panchangam.gulika_kalam || '07:30 AM - 09:00 AM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700 block text-[10px] font-medium">దుర్ముహూర్తం</span>
                    <span className="font-bold text-red-900">
                      {dateDetails.panchangam.durmuhurtham || '08:45 AM - 09:30 AM'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-red-700 block text-[10px] font-medium">వర్జ్యం</span>
                    <span className="font-bold text-red-900">
                      {dateDetails.panchangam.varjyam || '11:10 PM - 12:40 AM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Astronomical Attribution */}
              <div className="text-[10px] text-[#94a3b8] text-center pt-1 border-t border-[#E2E8F0]">
                గణిత ఆధారిత దృక్ పంచాంగం • {dateDetails.location.city} ({dateDetails.location.latitude.toFixed(2)}°N, {dateDetails.location.longitude.toFixed(2)}°E)
              </div>
            </div>
          )}

          {/* TAB 2: FESTIVALS & HOLIDAYS */}
          {activeTab === 'festivals' && (
            <div className="p-4 space-y-3">
              {dateDetails.festivals.length > 0 ? (
                dateDetails.festivals.map((fest) => (
                  <div
                    key={fest.id}
                    className="p-3.5 rounded-xl border bg-amber-50/50 border-amber-200 text-amber-950"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-600 flex-shrink-0" />
                        <h4 className="font-bold text-sm">
                          {lang === 'en'
                            ? fest.name_en
                            : lang === 'te'
                            ? fest.name_te
                            : `${fest.name_te} (${fest.name_en})`}
                        </h4>
                      </div>
                      {fest.is_holiday && (
                        <Badge variant="danger" size="sm">
                          {lang === 'en' ? 'Holiday' : 'సెలవు'}
                        </Badge>
                      )}
                    </div>

                    {(fest.description_te || fest.description_en) && (
                      <p className="mt-2 text-xs text-amber-900/90 leading-relaxed">
                        {lang === 'en'
                          ? fest.description_en || fest.description_te
                          : fest.description_te || fest.description_en}
                      </p>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800 font-medium">
                      <span className="capitalize">
                        రకం: {fest.festival_type} • ట్యాగ్: {fest.tag || 'festival'}
                      </span>
                      {fest.holiday_type && fest.holiday_type !== 'none' && (
                        <span className="text-red-700 font-semibold">
                          {fest.holiday_type === 'gazetted'
                            ? 'గెజిటెడ్ సెలవు'
                            : fest.holiday_type === 'regional_ap'
                            ? 'ఆంధ్రప్రదేశ్ సెలవు'
                            : 'ఐచ్ఛిక సెలవు'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[#64748B]">
                  <p className="text-sm font-medium">ఈ తేదీన విశేష పండుగలు లేవు</p>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    No major festivals or public holidays on this date.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL EVENTS */}
          {activeTab === 'events' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                  వ్యక్తిగత షెడ్యూల్ (My Schedule)
                </span>
                <button
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="text-xs font-bold text-[#1677F2] hover:text-[#0A4EA6] flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>ఈవెంట్ జోడించండి</span>
                </button>
              </div>

              {dateDetails.userEvents.length > 0 ? (
                dateDetails.userEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between shadow-subtle"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#1677F2]" />
                        <h4 className="font-semibold text-xs text-[#0F172A]">{evt.title}</h4>
                        <span className="text-[10px] bg-slate-100 text-[#475569] px-2 py-0.2 rounded-full font-medium capitalize">
                          {evt.category || 'Event'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-[#64748B]">
                        {evt.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-[#1677F2]" />
                            {evt.start_time}
                          </span>
                        )}
                        {evt.description && <span className="truncate max-w-[160px]">{evt.description}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1.5 text-[#94a3b8] hover:text-red-600 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[#64748B]">
                  <p className="text-xs font-medium">ఈ రోజుకు వ్యక్తిగత ఈవెంట్లు ఏవీ లేవు.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    leftIcon={<Plus size={14} />}
                    onClick={() => setIsAddEventModalOpen(true)}
                  >
                    పుట్టినరోజు లేదా ఈవెంట్‌ను జోడించండి
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* 5B. CONTROLLED NON-INTRUSIVE PROMOTIONAL BANNER */}
      <PromotionalBannerSlot screen="calendar" variant="compact" className="mt-4" />

      {/* 6. MODAL: LOCATION SELECTOR */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[#1677F2]" />
            <span>ప్రాంతాన్ని ఎంచుకోండి (Select Location)</span>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-[#64748B] mb-3">
            సూర్యోదయ, సూర్యాస్తమయ మరియు రాహుకాల సమయాలు మీరు ఎంచుకున్న ప్రాంతం ఆధారంగా ఖచ్చితంగా లెక్కించబడతాయి.
          </p>
          <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto">
            {POPULAR_LOCATIONS.map((loc) => {
              const isCurrent = location.city === loc.city;
              return (
                <button
                  key={loc.code || loc.city}
                  onClick={() => {
                    LocationService.setLocation(loc);
                    setIsLocationModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'border-[#1677F2] bg-[#EAF3FF] font-semibold text-[#1677F2]'
                      : 'border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A]'
                  }`}
                >
                  <div>
                    <div className="text-sm">
                      {loc.name_te ? `${loc.name_te} (${loc.city})` : loc.city}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-normal">
                      {loc.state_te || loc.state}, {loc.country}
                    </div>
                  </div>
                  {isCurrent && <Check size={18} className="text-[#1677F2]" />}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 7. MODAL: SEARCH FESTIVALS & DATES */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[#1677F2]" />
            <span>క్యాలెండర్ వెతుకులాట (Search Calendar)</span>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="సంక్రాంతి, ఉగాది, ఏకాదశి, Diwali, 15 Jan..."
            autoFocus
          />

          <div className="max-h-[320px] overflow-y-auto space-y-2 pt-1">
            {isSearching ? (
              <div className="py-6 text-center text-xs text-[#64748B]">వెతుకుతోంది... (Searching...)</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((res) => (
                <button
                  key={`${res.calendar_date}-${res.title_en}`}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#1677F2] hover:bg-[#EAF3FF]/40 text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">
                      {lang === 'en'
                        ? res.title_en
                        : lang === 'te'
                        ? res.title_te
                        : `${res.title_te} (${res.title_en})`}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {res.calendar_date} • {WEEKDAYS[res.day_of_week].short.en}
                    </div>
                  </div>
                  <Badge variant={res.type === 'holiday' ? 'danger' : 'warning'} size="sm">
                    {res.tag || res.type}
                  </Badge>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <div className="py-6 text-center text-xs text-[#64748B]">
                ఎటువంటి ఫలితాలు కనుగొనబడలేదు. (No matches found)
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-[#94a3b8]">
                పండుగలు, తిథులు లేదా ముఖ్యమైన దినాలను వెతకడానికి టైప్ చేయండి.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 8. MODAL: ADD PERSONAL EVENT */}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-[#1677F2]" />
            <span>నూతన ఈవెంట్ జోడించండి (Add Event)</span>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddEventModalOpen(false)}>
              రద్దు (Cancel)
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateEvent}>
              భద్రపరచండి (Save Event)
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateEvent} className="space-y-3 text-left">
          <Input
            label="ఈవెంట్ పేరు (Title)"
            placeholder="ఉదా: అమ్మ పుట్టినరోజు లేదా సంక్రాంతి పూజ"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              రకం (Category)
            </label>
            <select
              value={newEventCategory}
              onChange={(e) => setNewEventCategory(e.target.value as EventCategory)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1677F2]"
            >
              <option value="birthday">పుట్టినరోజు (Birthday)</option>
              <option value="anniversary">పెళ్లి రోజు (Anniversary)</option>
              <option value="appointment">అపాయింట్‌మెంట్ (Appointment)</option>
              <option value="reminder">రిమైండర్ (Reminder)</option>
              <option value="custom">ఇతర ఈవెంట్ (Custom Event)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                తేదీ (Date)
              </label>
              <input
                type="date"
                value={selectedDate}
                disabled
                className="w-full text-xs p-2 rounded-xl border border-[#E2E8F0] bg-slate-100 text-[#64748B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                సమయం (Time)
              </label>
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1677F2]"
              />
            </div>
          </div>

          <Input
            label="వివరాలు / నోట్స్ (Description / Notes)"
            placeholder="ముఖ్యమైన సమాచారం..."
            value={newEventDesc}
            onChange={(e) => setNewEventDesc(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reminderCheck"
              checked={newEventReminder}
              onChange={(e) => setNewEventReminder(e.target.checked)}
              className="rounded text-[#1677F2] focus:ring-[#1677F2]"
            />
            <label htmlFor="reminderCheck" className="text-xs font-medium text-[#475569]">
              ఈవెంట్ రిమైండర్ ఆన్ చేయండి (Enable Reminder)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
