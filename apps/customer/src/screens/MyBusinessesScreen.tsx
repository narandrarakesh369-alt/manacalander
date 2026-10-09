import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CustomerBusinessService,
  AnalyticsService,
} from '@mana/services';
import type { FollowedBusiness, Business } from '@mana/types';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink,
  Heart,
  QrCode,
  Search,
  Sparkles,
  Trash2,
  Bell,
  BellOff,
  Plus,
} from 'lucide-react';
import { Card, Button, Input, Badge } from '@mana/ui';

export const MyBusinessesScreen: React.FC = () => {
  const navigate = useNavigate();

  const [followedBusinesses, setFollowedBusinesses] = useState<FollowedBusiness[]>([]);
  const [activeBusinessMode, setActiveBusinessMode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manual QR/Code entry input
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  const loadData = async () => {
    const list = await CustomerBusinessService.getFollowedBusinesses('cust_current');
    setFollowedBusinesses(list);
    setActiveBusinessMode(CustomerBusinessService.getActiveBusinessMode());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await CustomerBusinessService.searchBusinesses(q);
    setSearchResults(results);
  };

  const handleSwitchMode = (bizId: string | null) => {
    CustomerBusinessService.setActiveBusinessMode(bizId);
    setActiveBusinessMode(bizId);
  };

  const handleRemove = async (bizId: string) => {
    await CustomerBusinessService.unfollowBusiness('cust_current', bizId);
    AnalyticsService.track('business_unfollow', bizId);
    await loadData();
  };

  const handleFollowFromSearch = async (bizId: string) => {
    await CustomerBusinessService.followBusiness('cust_current', bizId, 'followed');
    AnalyticsService.track('business_follow', bizId);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    await loadData();
  };

  const handleQrCodeSubmit = () => {
    const clean = qrCodeInput.trim().toUpperCase();
    if (clean) {
      navigate(`/b/${clean.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">My Businesses</h1>
            <p className="text-[11px] text-slate-500">Manage followed businesses & modes</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1.5 text-xs text-amber-800 border-amber-300 bg-amber-50"
          onClick={() => setShowQrModal(true)}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Scan QR</span>
        </Button>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Active Mode Controller Card */}
        <Card className={`p-4 border ${activeBusinessMode ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                activeBusinessMode ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {activeBusinessMode ? 'B' : <Calendar className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Current Application Mode
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {activeBusinessMode ? (
                    <span className="text-amber-800">
                      Business Mode: {activeBusinessMode}
                    </span>
                  ) : (
                    <span>General Calendar Mode</span>
                  )}
                </div>
              </div>
            </div>

            {activeBusinessMode ? (
              <button
                onClick={() => handleSwitchMode(null)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                Switch to General
              </button>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                Default Mode
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {activeBusinessMode
              ? 'Your calendar home emphasizes offers and branding for this tenant.'
              : 'You are viewing the neutral Telugu + English community calendar.'}
          </p>
        </Card>

        {/* Search & Add Business */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search business by name or code (e.g. SLJ001)..."
              className="pl-9 pr-4 text-xs"
            />
          </div>

          {/* Search dropdown results */}
          {isSearching && (
            <Card className="p-2 space-y-1 divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  No businesses found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((b) => (
                  <div key={b.business_id} className="p-2 flex items-center justify-between hover:bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{b.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">CODE: {b.business_id}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1"
                      onClick={() => handleFollowFromSearch(b.business_id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Follow
                    </Button>
                  </div>
                ))
              )}
            </Card>
          )}
        </div>

        {/* Followed Businesses List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Followed Businesses ({followedBusinesses.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading followed businesses...</p>
            </div>
          ) : followedBusinesses.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-300">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Businesses Followed Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                Scan a merchant's calendar QR code or search to follow trusted local businesses for festival offers.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowQrModal(true)}
              >
                Scan Business QR
              </Button>
            </Card>
          ) : (
            followedBusinesses.map((item) => {
              const isCurrentMode = activeBusinessMode === item.business_id;
              const isPrem = item.business?.plan_code === 'premium';

              return (
                <Card
                  key={item.business_id}
                  className={`p-4 transition-all ${
                    isCurrentMode ? 'border-amber-400 ring-1 ring-amber-300/60 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                        {item.profile?.logo_url ? (
                          <img src={item.profile.logo_url} alt={item.business?.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-amber-600" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">
                            {item.business?.name || item.business_id}
                          </h3>
                          {isPrem && (
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.business_id}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            via {item.relationship_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.business_id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Remove business"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/business-profile/${item.business_id}`)}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <span>View Profile & Offers</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    {isCurrentMode ? (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-amber-700" />
                        Active Mode
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitchMode(item.business_id)}
                        className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* QR Scanner / Manual Code Entry Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Scan Business QR</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="aspect-square w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden border border-slate-800">
              <div className="w-48 h-48 border-2 border-dashed border-amber-400/80 rounded-2xl flex items-center justify-center p-4">
                <QrCode className="w-24 h-24 text-amber-400/60 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Align Merchant QR Code within frame
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Or enter business code manually:
              </label>
              <div className="flex gap-2">
                <Input
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  placeholder="e.g. SLJ001 or RF002"
                  className="text-xs uppercase"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleQrCodeSubmit}
                  disabled={!qrCodeInput.trim()}
                >
                  Enter
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setQrCodeInput('SLJ001');
                }}
                className="text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded border border-amber-200"
              >
                Test: SLJ001 (Jewellery)
              </button>
              <button
                onClick={() => {
                  setQrCodeInput('RF002');
                }}
                className="text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded border border-amber-200"
              >
                Test: RF002 (Foods)
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
