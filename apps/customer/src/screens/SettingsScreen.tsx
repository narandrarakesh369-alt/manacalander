import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@mana/ui';
import { Check, Globe, MapPin, Bell } from 'lucide-react';
import { LANGUAGE_CONFIG, POPULAR_LOCATIONS } from '@mana/config';
import { LocationService } from '@mana/services';
import type { LanguagePreference, LocationConfig } from '@mana/types';

export const SettingsScreen: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<LanguagePreference>('te_en');
  const [selectedLocation, setSelectedLocation] = useState<LocationConfig>(
    LocationService.getCurrentLocation()
  );
  const [notifs, setNotifs] = useState({
    festivals: true,
    panchangam: true,
    promotions: true,
  });

  useEffect(() => {
    const unsub = LocationService.subscribe((loc) => {
      setSelectedLocation(loc);
    });
    return () => unsub();
  }, []);

  const handleSelectLocation = (loc: LocationConfig) => {
    setSelectedLocation(loc);
    LocationService.setLocation(loc);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#0F172A]">సెట్టింగ్స్ (Settings)</h2>
        <p className="text-xs text-[#64748B]">భాష మరియు ప్రాంతీయ ప్రాధాన్యతలు</p>
      </div>

      {/* 1. Language Preference */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-[#1677F2]" />
            <span>భాష ఎంపిక (Select Language)</span>
          </div>
        }
        padding="sm"
      >
        <div className="space-y-1.5 p-1">
          {LANGUAGE_CONFIG.supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left text-xs transition-colors border ${
                selectedLang === lang.code
                  ? 'border-[#1677F2] bg-[#EAF3FF] font-semibold text-[#1677F2]'
                  : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A]'
              }`}
            >
              <div>
                <span>{lang.nativeLabel}</span>
                <span className="text-[#64748B] text-[11px] ml-2">({lang.label})</span>
              </div>
              {selectedLang === lang.code && <Check size={16} />}
            </button>
          ))}
        </div>
      </Card>

      {/* 2. Location Preference */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#1677F2]" />
            <span>ప్రాంతం (Location for Panchangam & Weather)</span>
          </div>
        }
        padding="sm"
      >
        <div className="space-y-1.5 p-1">
          {POPULAR_LOCATIONS.map((loc) => (
            <button
              key={loc.city}
              onClick={() => handleSelectLocation(loc)}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left text-xs transition-colors border ${
                selectedLocation.city === loc.city
                  ? 'border-[#1677F2] bg-[#EAF3FF] font-semibold text-[#1677F2]'
                  : 'border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A]'
              }`}
            >
              <div>
                <span>{loc.name_te ? `${loc.name_te} (${loc.city})` : loc.city}</span>
                <span className="text-[#64748B] text-[11px] ml-2">({loc.state})</span>
              </div>
              {selectedLocation.city === loc.city && <Check size={16} />}
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Notifications Foundation */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[#1677F2]" />
            <span>నోటిఫికేషన్లు (Notification Preferences)</span>
          </div>
        }
        padding="md"
      >
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[#0F172A] font-medium">పండుగలు మరియు సెలవులు (Festivals & Holidays)</span>
            <input
              type="checkbox"
              checked={notifs.festivals}
              onChange={(e) => setNotifs({ ...notifs, festivals: e.target.checked })}
              className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[#0F172A] font-medium">రోజువారీ పంచాంగం (Daily Panchangam)</span>
            <input
              type="checkbox"
              checked={notifs.panchangam}
              onChange={(e) => setNotifs({ ...notifs, panchangam: e.target.checked })}
              className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[#0F172A] font-medium">వ్యాపార ప్రత్యేక ఆఫర్లు (Partner Offers)</span>
            <input
              type="checkbox"
              checked={notifs.promotions}
              onChange={(e) => setNotifs({ ...notifs, promotions: e.target.checked })}
              className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
            />
          </label>
        </div>
      </Card>
    </div>
  );
};
