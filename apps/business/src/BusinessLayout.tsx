import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BusinessSidebar, businessNavItems, Button, Badge } from '@mana/ui';
import { useAuth } from '@mana/services';
import { Menu, X, LogOut, ExternalLink, Building2 } from 'lucide-react';

export const BusinessLayout: React.FC = () => {
  const { user, businessId, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tenantCode = businessId || 'SLJ001';
  const tenantName =
    tenantCode === 'SLJ001'
      ? 'Sri Lakshmi Jewellery'
      : tenantCode === 'RF002'
      ? 'Rythu Fresh Mart'
      : 'CMR Shopping Mall';

  const handleSignOut = async () => {
    await signOut();
    navigate('/business/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A]">
      {/* Desktop Sidebar */}
      <BusinessSidebar businessId={tenantCode} businessName={tenantName} />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="w-72 bg-white h-full flex flex-col justify-between p-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1677F2] text-white flex items-center justify-center font-bold text-sm">
                    M
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">Mana Calendar</h3>
                    <span className="text-[10px] text-[#64748B]">Business Portal</span>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-3 p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-xs font-bold text-[#0F172A]">{tenantName}</div>
                <div className="text-[11px] text-[#1677F2] font-mono">ID: {tenantCode}</div>
              </div>

              <nav className="mt-4 space-y-1">
                {businessNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <button
                      key={item.to}
                      onClick={() => {
                        navigate(item.to);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                        isActive
                          ? 'bg-[#EAF3FF] text-[#1677F2]'
                          : 'text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut size={14} />}>
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E2E8F0] px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Tenant Workspace
              </span>
              <h1 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <span>{tenantName}</span>
                <Badge variant="primary" size="sm">
                  {tenantCode}
                </Badge>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              leftIcon={<ExternalLink size={14} />}
              className="hidden sm:inline-flex"
            >
              Customer App View
            </Button>
            <div className="h-6 w-px bg-[#E2E8F0] hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EAF3FF] text-[#1677F2] font-semibold text-xs flex items-center justify-center border border-[#bfdbfe]">
                {tenantCode.slice(0, 2)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-[#64748B] hover:text-red-600"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
