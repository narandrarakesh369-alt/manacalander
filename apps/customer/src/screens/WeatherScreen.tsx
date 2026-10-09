import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, LoadingState } from '@mana/ui';
import {
  Sun,
  Moon,
  CloudRain,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  MapPin,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WeatherService, LocationService } from '@mana/services';
import type { WeatherData, LocationConfig } from '@mana/types';
import { WEEKDAYS } from '@mana/config';

export const WeatherScreen: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationConfig>(LocationService.getCurrentLocation());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchWeather = (loc: LocationConfig) => {
    setIsLoading(true);
    WeatherService.getWeather(loc)
      .then((data) => {
        setWeather(data);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchWeather(location);

    const unsub = LocationService.subscribe((newLoc) => {
      setLocation(newLoc);
      fetchWeather(newLoc);
    });

    return () => unsub();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    WeatherService.clearMemoryCache();
    fetchWeather(location);
  };

  if (isLoading && !weather) {
    return (
      <div className="p-8">
        <LoadingState message="వాతావరణ వివరాలను లోడ్ చేస్తోంది... (Loading Weather Forecast...)" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="p-6 text-center text-[#64748B]">
        <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
        <h3 className="font-bold text-sm text-[#0F172A]">వాతావరణ సమాచారం అందుబాటులో లేదు</h3>
        <p className="text-xs text-[#94a3b8] mt-1">Weather data currently unavailable.</p>
        <Button size="sm" variant="outline" className="mt-4" onClick={handleRefresh}>
          మళ్లీ ప్రయత్నించండి (Retry)
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 1. Location Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 text-xs text-[#64748B]">
            <MapPin size={13} className="text-[#1677F2]" />
            <span>{location.state}, {location.country}</span>
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
            {location.name_te ? `${location.name_te} (${location.city})` : location.city}
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1677F2] transition-colors"
          title="Refresh Weather"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-[#1677F2]' : ''} />
        </button>
      </div>

      {/* 2. Current Weather Hero Card */}
      <div className="bg-gradient-to-br from-[#1677F2] via-[#0D5EC4] to-[#0A4EA6] rounded-2xl p-5 text-white shadow-card relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-white/80">
          <Badge variant="primary" size="sm" className="bg-white/20 text-white border-transparent">
            ప్రత్యక్ష సూచన (Live Forecast)
          </Badge>
          <span className="text-[11px] font-medium">{weather.date}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight">{weather.temp_c}°</span>
              <span className="text-lg font-semibold text-white/80">C</span>
            </div>
            <p className="text-sm font-semibold text-white/95 mt-1">{weather.condition_te}</p>
            <p className="text-xs text-white/75">{weather.condition}</p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
            <Sun size={38} className="animate-spin-slow" />
          </div>
        </div>

        {/* High / Low & Feels Like Banner */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/85">
          <span>ఉష్ణోగ్రత: గరిష్ఠం {weather.temp_max_c}° • కనిష్ఠం {weather.temp_min_c}°</span>
          <span>ఫీల్స్ లైక్: {weather.feels_like_c}°C</span>
        </div>
      </div>

      {/* 3. Detailed Weather Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Rain Probability */}
        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center gap-3 shadow-subtle">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CloudRain size={16} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-medium">వర్షపాతం అవకాశం</span>
            <span className="font-bold text-[#0F172A]">{weather.rain_probability}% Rain Chance</span>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center gap-3 shadow-subtle">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wind size={16} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-medium">గాలి వేగం</span>
            <span className="font-bold text-[#0F172A]">{weather.wind_kph} km/h Wind</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center gap-3 shadow-subtle">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Droplets size={16} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-medium">గాలిలో తేమ (Humidity)</span>
            <span className="font-bold text-[#0F172A]">{weather.humidity}% Humidity</span>
          </div>
        </div>

        {/* UV Index */}
        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center gap-3 shadow-subtle">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Eye size={16} />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block font-medium">యువి సూచిక (UV Index)</span>
            <span className="font-bold text-[#0F172A]">{weather.uv_index} of 10</span>
          </div>
        </div>
      </div>

      {/* 4. Sun Timings */}
      <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-around text-xs shadow-subtle">
        <div className="flex items-center gap-2">
          <Sunrise size={18} className="text-amber-500" />
          <div>
            <span className="text-[10px] text-[#64748B] block">సూర్యోదయం (Sunrise)</span>
            <span className="font-bold text-[#0F172A]">{weather.sunrise}</span>
          </div>
        </div>
        <div className="h-6 w-px bg-[#E2E8F0]" />
        <div className="flex items-center gap-2">
          <Sunset size={18} className="text-orange-500" />
          <div>
            <span className="text-[10px] text-[#64748B] block">సూర్యాస్తమయం (Sunset)</span>
            <span className="font-bold text-[#0F172A]">{weather.sunset}</span>
          </div>
        </div>
      </div>

      {/* 5. 24-Hour Hourly Forecast (Horizontal Scroll) */}
      <Card
        title="24 గంటల సూచన (Hourly Forecast)"
        subtitle="నేటి కాలక్రమ వాతావరణ మార్పులు"
        padding="sm"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {weather.hourly_forecast.map((hf) => (
            <div
              key={hf.time}
              className="flex-shrink-0 w-16 p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center flex flex-col items-center justify-between min-h-[92px]"
            >
              <span className="text-[10px] font-semibold text-[#64748B]">{hf.time}</span>
              <div className="my-1 text-amber-500">
                {hf.icon === 'moon' ? (
                  <Moon size={16} className="text-indigo-400" />
                ) : (
                  <Sun size={16} />
                )}
              </div>
              <span className="text-xs font-bold text-[#0F172A]">{hf.temp_c}°</span>
              <span className="text-[9px] text-blue-600 font-medium">{hf.rain_probability}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. 7-Day Extended Forecast */}
      <Card
        title="7 రోజుల వాతావరణ నివేదిక (7-Day Outlook)"
        subtitle="రాబోయే వారపు వాతావరణ అంచనా"
        padding="sm"
      >
        <div className="divide-y divide-[#E2E8F0] text-xs">
          {weather.daily_forecast.map((df, index) => {
            const dayName = WEEKDAYS[df.day_of_week]?.short;
            const isToday = index === 0;

            return (
              <div
                key={df.date}
                className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="w-24">
                  <span className="font-bold text-[#0F172A] block truncate">
                    {isToday ? 'నేడు (Today)' : `${dayName?.te} (${dayName?.en})`}
                  </span>
                  <span className="text-[10px] text-[#64748B]">{df.date.substring(5)}</span>
                </div>

                <div className="flex-1 flex items-center gap-1.5 px-2">
                  <Sun size={14} className="text-amber-500 flex-shrink-0" />
                  <span className="text-[11px] text-[#475569] truncate">
                    {df.condition_te || df.condition}
                  </span>
                </div>

                <div className="text-right flex items-center gap-2">
                  {df.rain_probability > 0 && (
                    <span className="text-[10px] text-blue-600 font-medium">
                      {df.rain_probability}%
                    </span>
                  )}
                  <span className="font-bold text-[#0F172A]">{df.temp_max_c}°</span>
                  <span className="text-[#94a3b8]">{df.temp_min_c}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Climatological Attribution */}
      <p className="text-[10px] text-[#94a3b8] text-center pt-1">
        ప్రాంతీయ ఖచ్చితమైన వాతావరణ గణన • {weather.city} ({weather.latitude.toFixed(2)}°N, {weather.longitude.toFixed(2)}°E)
      </p>
    </div>
  );
};
