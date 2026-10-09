import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { CustomerBottomNav } from '@mana/ui';
import { MapPin, Globe, Bell, Menu } from 'lucide-react';
import { LocationService, CustomerBusinessService } from '@mana/services';
import type { LocationConfig } from '@mana/types';

export const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState<LocationConfig>(
    LocationService.getCurrentLocation()
  );

  useEffect(() => {
    const unsub = LocationService.subscribe((loc) => {
      setCurrentLocation(loc);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] flex justify-center selection:bg-[#EAF3FF] selection:text-[#1677F2]">
      {/* Mobile-first container constrained to standard smartphone width (max-w-md) */}
      <div className="w-full max-w-md min-h-screen bg-[#F8FAFC] flex flex-col relative shadow-xl border-x border-[#E2E8F0]">
        {/* Customer Header — Height 60px, Pure White, Section 8 specification */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 h-[60px] flex items-center justify-between shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
          {/* LEFT: Hamburger / Menu */}
          <button
            onClick={() => navigate('/more')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#1677F2] transition-colors"
            title="Menu"
            aria-label="Navigation Menu"
          >
            <Menu size={22} strokeWidth={1.9} />
          </button>

          {/* CENTER: Mana Calendar 2027 */}
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[#1677F2] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              మ
            </div>
            <span className="font-bold text-[16px] text-[#0F172A] tracking-tight">
              Mana Calendar 2027
            </span>
          </div>

          {/* RIGHT: Notification Bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#1677F2] relative transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={1.9} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#1677F2]" />
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 pb-24 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom Navigation (HOME, CALENDAR, EVENTS, MORE) */}
        <CustomerBottomNav />
      </div>
    </div>
  );
};
