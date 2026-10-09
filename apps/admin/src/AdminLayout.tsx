import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar, adminNavItems, Button, Badge } from '@mana/ui';
import { useAuth } from '@mana/services';
import { ShieldCheck, LogOut, Menu, X, ExternalLink, Shield } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A]">
      {/* Desktop Dark Admin Sidebar */}
      <AdminSidebar />

      {/* Mobile Drawer (Dark) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-sm">
          <div className="w-72 bg-slate-900 text-slate-100 h-full flex flex-col justify-between p-4 border-r border-slate-800 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1677F2] text-white flex items-center justify-center font-bold text-sm">
                    మ
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Mana Calendar</h3>
                    <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">Super Admin</span>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-4 space-y-1 overflow-y-auto max-h-[70vh]">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        navigate(item.to);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                        isActive
                          ? 'bg-[#1677F2] text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut size={14} />} className="text-slate-200 border-slate-700 hover:bg-slate-800">
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Light SaaS Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <span className="text-[10px] font-bold text-[#1677F2] uppercase tracking-wider block">
                Platform Governance & Central Operations
              </span>
              <h1 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <span>Mana Calendar 2027</span>
                <span className="text-xs font-normal text-slate-400">• Multi-Tenant Telugu Ecosystem</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
              {user?.email || 'owner@manacalendar2027.com'}
            </span>
            <Badge variant="primary" size="sm" className="font-bold">
              SUPER ADMIN
            </Badge>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
              title="Sign Out"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 overflow-y-auto text-[#0F172A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
