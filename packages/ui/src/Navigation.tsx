import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Menu,
  LayoutDashboard,
  Building2,
  Megaphone,
  Image,
  QrCode,
  BarChart3,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Users,
  ShieldCheck,
  FileText,
  DollarSign,
  SunMedium,
} from 'lucide-react';

// =============================================================================
// 1. CUSTOMER MOBILE BOTTOM NAVIGATION (HOME, CALENDAR, EVENTS, MORE)
// Strictly NO "BUSINESSES" item as per specification.
// =============================================================================

export interface NavItem {
  to: string;
  labelEn: string;
  labelTe: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

export const customerNavItems: NavItem[] = [
  { to: '/home', labelEn: 'Home', labelTe: 'హోమ్', icon: Home },
  { to: '/calendar', labelEn: 'Calendar', labelTe: 'క్యాలెండర్', icon: CalendarDays },
  { to: '/events', labelEn: 'Events', labelTe: 'ఈవెంట్స్', icon: CalendarCheck },
  { to: '/more', labelEn: 'More', labelTe: 'మరిన్ని', icon: Menu },
];

export const CustomerBottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_10px_rgba(15,23,42,0.04)] pb-safe">
      <div className="max-w-md mx-auto h-[66px] flex items-center justify-around px-2">
        {customerNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 min-w-[68px] rounded-[10px] transition-colors ${
                  isActive
                    ? 'text-[#1677F2]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
                  <span className={`text-[11px] mt-1 leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.labelEn}
                  </span>
                  <span className="text-[9px] text-[#94A3B8] font-telugu mt-0.5 leading-none">
                    {item.labelTe}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

// =============================================================================
// 2. BUSINESS DASHBOARD SIDEBAR NAVIGATION
// =============================================================================

export const businessNavItems = [
  { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/business/media', label: 'Media Library', icon: Image },
  { to: '/business/profile', label: 'Business Profile', icon: Building2 },
  { to: '/business/qr', label: 'QR Code', icon: QrCode },
  { to: '/business/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/business/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/business/notifications', label: 'Notifications', icon: Bell },
  { to: '/business/settings', label: 'Settings', icon: Settings },
  { to: '/business/support', label: 'Support', icon: HelpCircle },
];

export const BusinessSidebar: React.FC<{ businessId?: string; businessName?: string }> = ({
  businessId = 'SLJ001',
  businessName = 'Sri Lakshmi Jewellery',
}) => {
  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] min-h-screen flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1677F2] text-white flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] leading-tight">Mana Calendar</h2>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                Business Portal
              </span>
            </div>
          </div>
          <div className="mt-4 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#0F172A] truncate">{businessName}</div>
            <div className="text-[11px] font-mono text-[#1677F2] font-medium">ID: {businessId}</div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {businessNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EAF3FF] text-[#1677F2]'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="text-[11px] text-[#94a3b8] text-center">
          Mana Calendar 2027 • Multi-Tenant
        </div>
      </div>
    </aside>
  );
};

// =============================================================================
// 3. SUPER ADMIN SIDEBAR NAVIGATION
// =============================================================================

export const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/payments', label: 'Payments', icon: DollarSign },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/admin/calendar', label: 'Calendar Engine', icon: Calendar },
  { to: '/admin/panchangam', label: 'Panchangam', icon: SunMedium },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
  { to: '/admin/support', label: 'Support Tickets', icon: HelpCircle },
  { to: '/admin/users', label: 'Admin Users', icon: Users },
  { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
];

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Mana Calendar</h2>
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        Platform Governance Area
      </div>
    </aside>
  );
};
