import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, EmptyState } from '@mana/ui';
import { useAuth, CampaignService, MediaService, BusinessService } from '@mana/services';
import {
  Megaphone,
  Plus,
  Calendar,
  AlertCircle,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  Palette,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import type { Campaign, CampaignUsage, BusinessProfile } from '@mana/types';
import { MobileCustomerPreview } from '../components/MobileCustomerPreview';
import { BannerCreatorModal } from '../components/BannerCreatorModal';

export const BusinessCampaignsScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usage, setUsage] = useState<CampaignUsage | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');

  // 6-Step Guided Wizard State (Section 25)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form Fields
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignHeadline, setCampaignHeadline] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignType, setCampaignType] = useState<'banner' | 'festival_offer'>('festival_offer');
  const [bannerImageUrl, setBannerImageUrl] = useState(
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'
  );
  const [ctaText, setCtaText] = useState('View Collection');
  const [ctaUrl, setCtaUrl] = useState('');
  const [startDate, setStartDate] = useState('2027-01-10');
  const [endDate, setEndDate] = useState('2027-01-20');
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Banner Creator Modal
  const [isBannerCreatorOpen, setIsBannerCreatorOpen] = useState(false);

  // Purchase Extra Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [camps, u, prof] = await Promise.all([
        CampaignService.getBusinessCampaigns(tenantId),
        CampaignService.getCampaignUsage(tenantId, 2027),
        BusinessService.getBusinessProfile(tenantId),
      ]);
      setCampaigns(camps);
      setUsage(u);
      setProfile(prof);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const totalAllowed = (usage?.included_campaigns_total || 10) + (usage?.extra_campaigns_purchased || 0);
  const totalUsed = (usage?.included_campaigns_used || 0) + (usage?.extra_campaigns_used || 0);
  const remainingCredits = Math.max(0, totalAllowed - totalUsed);

  // Step Validation for 6-Step Wizard
  const handleNextStep = () => {
    setWizardError(null);
    if (wizardStep === 1) {
      if (!campaignTitle.trim()) {
        setWizardError('Campaign Name is required.');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!campaignDescription.trim()) {
        setWizardError('Campaign Description is required.');
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      if (!bannerImageUrl.trim()) {
        setWizardError('Please select or upload a banner image.');
        return;
      }
      setWizardStep(4);
    } else if (wizardStep === 4) {
      if (!startDate || !endDate) {
        setWizardError('Start and end dates are required.');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setWizardError('Start date must be before or equal to End date.');
        return;
      }
      setWizardStep(5);
    } else if (wizardStep === 5) {
      setWizardStep(6);
    }
  };

  // Publish Campaign in Step 5
  const handlePublishCampaign = async () => {
    setWizardError(null);
    if (remainingCredits <= 0) {
      setWizardError('No campaign credits available. Please purchase extra credits (₹299 each).');
      return;
    }

    setIsSubmitting(true);
    try {
      await CampaignService.publishOrScheduleCampaign(tenantId, {
        title: campaignTitle,
        description: campaignDescription,
        campaign_type: campaignType,
        image_url: bannerImageUrl,
        cta_text: ctaText,
        cta_url: ctaUrl || `https://manacalendar.in/b/${tenantId.toLowerCase()}`,
        priority: 8,
        status: new Date(startDate) > new Date() ? 'scheduled' : 'active',
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T23:59:59Z`,
      });

      setIsWizardOpen(false);
      resetWizard();
      await loadData();
    } catch (err: any) {
      setWizardError(err.message || 'Failed to publish campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setCampaignTitle('');
    setCampaignHeadline('');
    setCampaignDescription('');
    setBannerImageUrl('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800');
    setCtaText('View Collection');
    setCtaUrl('');
    setWizardError(null);
  };

  const handleDeleteCampaign = async (campId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this campaign? NOTICE: In accordance with platform policy, deleting a campaign does NOT restore the consumed campaign credit.'
      )
    ) {
      await CampaignService.deleteCampaign(tenantId, campId);
      await loadData();
    }
  };

  const handlePurchaseExtra = async () => {
    try {
      const res = await CampaignService.purchaseExtraCampaigns(tenantId, purchaseQuantity, 2027);
      setPurchaseSuccess(
        `Successfully purchased ${purchaseQuantity} extra campaign(s) for ₹${res.amountInr}. Balance updated!`
      );
      setTimeout(() => {
        setIsPurchaseModalOpen(false);
        setPurchaseSuccess(null);
      }, 1500);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Campaign Manager</h2>
          <p className="text-xs text-[#64748B]">
            Create, schedule, and preview seasonal promotional campaigns for Tenant: <strong>{tenantId}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsPurchaseModalOpen(true)}
            leftIcon={<ShoppingCart size={16} />}
          >
            Buy Extra Credits (₹299)
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              resetWizard();
              setIsWizardOpen(true);
            }}
            leftIcon={<Plus size={16} />}
            disabled={remainingCredits === 0}
          >
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Quota & Usage Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card padding="md" className="border-l-4 border-l-blue-600">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Included / Year</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{usage?.included_campaigns_total || 10}</div>
          <span className="text-[11px] text-slate-400">Annual Plan Allowance</span>
        </Card>

        <Card padding="md" className="border-l-4 border-l-emerald-600">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Credits Remaining</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{remainingCredits}</div>
          <span className="text-[11px] text-slate-400">Available to schedule</span>
        </Card>

        <Card padding="md" className="border-l-4 border-l-amber-600">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Used Credits</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalUsed}</div>
          <span className="text-[11px] text-slate-400">Active & Completed</span>
        </Card>

        <Card padding="md" className="border-l-4 border-l-purple-600">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Extra Purchased</span>
          <div className="text-2xl font-bold text-purple-700 mt-1">{usage?.extra_campaigns_purchased || 0}</div>
          <span className="text-[11px] text-slate-400">@ ₹299 per booster</span>
        </Card>
      </div>

      {/* Policy Notice */}
      <div className="bg-[#EAF3FF] border border-[#bfdbfe] rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-[#1677F2] shrink-0 mt-0.5" />
        <div className="text-xs text-[#0F172A]">
          <span className="font-bold">Auditable Quota Enforcement: </span>
          Each campaign published consumes 1 annual credit. If all 10 credits are used, additional campaigns can be topped up at ₹299 each. Deleting an active campaign does NOT restore the credit.
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          {(['all', 'active', 'scheduled', 'expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded-lg font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[#1677F2] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading campaigns...</div>
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            title="No Campaigns Found"
            description={searchQuery ? 'No campaigns match your search query.' : 'Create your first seasonal promotion or festive calendar offer.'}
            action={
              <Button size="sm" variant="primary" onClick={() => setIsWizardOpen(true)}>
                Create Campaign
              </Button>
            }
          />
        ) : (
          filteredCampaigns.map((camp) => (
            <Card key={camp.id} padding="md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {camp.image_url && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img src={camp.image_url} alt={camp.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-[#0F172A]">{camp.title}</h4>
                      <Badge
                        variant={
                          camp.status === 'active'
                            ? 'success'
                            : camp.status === 'scheduled'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {camp.status.toUpperCase()}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {camp.campaign_type === 'festival_offer' ? 'Festive Special' : 'Banner'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 max-w-xl">{camp.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-[#64748B]">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={12} className="text-[#1677F2]" />
                        {camp.start_date.split('T')[0]} to {camp.end_date.split('T')[0]}
                      </span>
                      <span>CTA: <strong>{camp.cta_text || 'Learn More'}</strong></span>
                      {camp.cta_url && (
                        <span className="truncate max-w-[200px] text-blue-600 font-mono">
                          {camp.cta_url}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteCampaign(camp.id)}
                    leftIcon={<Trash2 size={14} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 6-STEP GUIDED CAMPAIGN CREATION WIZARD MODAL (SECTION 25) */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Create Campaign (6-Step Guided Wizard)"
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500 font-medium">
              Step {wizardStep} of 6
            </div>
            <div className="flex gap-2">
              {wizardStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  leftIcon={<ArrowLeft size={14} />}
                >
                  Back
                </Button>
              )}
              {wizardStep < 6 ? (
                <Button variant="primary" size="sm" onClick={handleNextStep} rightIcon={<ArrowRight size={14} />}>
                  Continue to Step {wizardStep + 1}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePublishCampaign}
                  isLoading={isSubmitting}
                  leftIcon={<Sparkles size={14} />}
                >
                  Publish Campaign (Uses 1 Credit)
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6 text-left">
          {/* Wizard Step Progress Tracker */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Content' },
              { num: 3, label: 'Banner' },
              { num: 4, label: 'Schedule' },
              { num: 5, label: 'Preview' },
              { num: 6, label: 'Publish' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizardStep === s.num
                      ? 'bg-[#1677F2] text-white'
                      : wizardStep > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {wizardStep > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    wizardStep === s.num ? 'text-[#1677F2]' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {wizardError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {wizardError}
            </div>
          )}

          {/* STEP 1: BASIC INFO */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#bfdbfe] text-xs text-[#0F172A]">
                <strong>Step 1: Basic Info</strong> — Set the promotional campaign name and campaign format.
              </div>

              <Input
                label="Campaign Name"
                placeholder="e.g. Ugadi Swarna Utsavam 2027"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Campaign Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setCampaignType('festival_offer')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      campaignType === 'festival_offer'
                        ? 'border-[#1677F2] bg-blue-50/40 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Festive Special Promotion</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Top priority placement on Telugu festival days (Ugadi, Sankranti, Diwali, Dussehra) and auspicious dates.
                    </p>
                  </div>

                  <div
                    onClick={() => setCampaignType('banner')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      campaignType === 'banner'
                        ? 'border-[#1677F2] bg-blue-50/40 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <Megaphone size={14} className="text-[#1677F2]" />
                      <span>Standard In-App Banner</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Evenly rotated promotional slot across customer Home and Calendar screens for the scheduled date range.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTENT */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#bfdbfe] text-xs text-[#0F172A]">
                <strong>Step 2: Content</strong> — Define the offer headline, Telugu/English description, and CTA actions.
              </div>

              <Input
                label="Offer Headline"
                placeholder="e.g. Flat 50% Off on Gold Making Charges"
                value={campaignHeadline}
                onChange={(e) => setCampaignHeadline(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Offer Description / Terms
                </label>
                <textarea
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Detailed offer terms, hallmark purity details, or festival greetings..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="CTA Button Text"
                  placeholder="e.g. View Collection, Visit Store, Call Now"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                />
                <Input
                  label="CTA Destination URL (Optional)"
                  placeholder="https://... (or leave blank for store profile)"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: BANNER CREATIVE */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#bfdbfe] text-xs text-[#0F172A]">
                <strong>Step 3: Banner Creative</strong> — Select or generate the banner image (16:7 aspect ratio recommended).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Built-in Banner Creator */}
                <Card padding="md" className="border-2 border-dashed border-[#1677F2] bg-blue-50/20">
                  <div className="flex flex-col items-center text-center p-2">
                    <Palette size={32} className="text-[#1677F2] mb-2" />
                    <h5 className="font-bold text-xs text-slate-900">Built-in Banner Creator</h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Choose festive background, Telugu typography, and logo overlay in seconds.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsBannerCreatorOpen(true)}
                      leftIcon={<Sparkles size={14} />}
                    >
                      Open Banner Creator
                    </Button>
                  </div>
                </Card>

                {/* Option 2: Upload / Direct URL */}
                <Card padding="md">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">Upload or Banner Image URL</h5>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Provide a custom 16:7 ratio creative URL (JPEG, PNG, WebP).
                      </p>
                    </div>
                    <div className="mt-3">
                      <Input
                        label="Image URL"
                        value={bannerImageUrl}
                        onChange={(e) => setBannerImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Banner Image Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Banner Aspect Ratio (16:7) Preview
                </label>
                <div className="aspect-[16/7] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={bannerImageUrl}
                    alt="Creative Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SCHEDULE */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#bfdbfe] text-xs text-[#0F172A]">
                <strong>Step 4: Campaign Schedule</strong> — Set the runtime duration for this promotion on the 2027 calendar.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900">Calendar Placement & Festive Runtime</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Campaign will automatically appear in customer feeds across Andhra Pradesh & Telangana from <strong>{startDate}</strong> through <strong>{endDate}</strong>.
                </p>
                <div className="text-[11px] text-[#1677F2] font-medium flex items-center gap-1.5 pt-1">
                  <Calendar size={13} />
                  <span>Aligns with Telugu 2027 festival days and customer auspicious dates.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LIVE CUSTOMER BANNER PREVIEW (SECTION 25) */}
          {wizardStep === 5 && (
            <div className="space-y-4">
              <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#bfdbfe] text-xs text-[#0F172A] flex items-center justify-between">
                <span>
                  <strong>Step 5: Preview</strong> — Live customer banner preview matching the mobile customer card exactly.
                </span>
                <Badge variant="primary" size="sm">Customer Card Match</Badge>
              </div>

              {/* Exact Banner Preview Component matching PromotionalBannerSlot */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Customer In-App Banner Preview (16:7 Aspect Ratio)
                </div>

                <div className="relative overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] p-3.5 max-w-xl mx-auto">
                  {/* Micro-badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F7] mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-800 uppercase bg-[#FFF7E6] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        ప్రాయోజిత • Featured Partner
                      </span>
                      <span className="text-[11px] font-semibold text-[#0F172A]">
                        {profile?.company_name || tenantId}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">16:7 Banner</span>
                  </div>

                  {/* Banner Body */}
                  <div className="flex items-center gap-3.5">
                    {bannerImageUrl && (
                      <div className="relative shrink-0 w-24 h-20 rounded-[12px] overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0]">
                        <img
                          src={bannerImageUrl}
                          alt={campaignTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#0F172A] truncate">
                        {campaignTitle || 'Campaign Title'}
                      </h4>
                      {campaignHeadline && (
                        <p className="text-xs font-semibold text-[#1677F2] truncate mt-0.5">
                          {campaignHeadline}
                        </p>
                      )}
                      <p className="text-xs text-[#475569] line-clamp-2 mt-0.5 leading-relaxed">
                        {campaignDescription || 'Offer description goes here...'}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] bg-[#FFF7E6] border border-[#FCD34D] px-3 py-1 rounded-[8px] shadow-2xs">
                          <span>{ctaText || 'View Offer'}</span>
                          <ExternalLink className="w-3 h-3 text-amber-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Full Smartphone Mockup Drawer */}
              <div className="pt-2">
                <details className="text-xs">
                  <summary className="cursor-pointer font-bold text-[#1677F2] hover:underline">
                    View in full customer smartphone screen mockup ▾
                  </summary>
                  <div className="pt-4 flex justify-center">
                    <MobileCustomerPreview
                      businessName={profile?.company_name || tenantId}
                      businessLogo={profile?.logo}
                      coverImage={profile?.cover_image}
                      category={profile?.category}
                      city={profile?.city || 'Visakhapatnam'}
                      phone={profile?.phone}
                      whatsapp={profile?.social_links?.whatsapp}
                      campaignTitle={campaignTitle}
                      campaignHeadline={campaignHeadline}
                      campaignDescription={campaignDescription}
                      campaignImageUrl={bannerImageUrl}
                      campaignCtaText={ctaText}
                      campaignCtaUrl={ctaUrl}
                      mode="home"
                    />
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* STEP 6: PUBLISH (SECTION 25) */}
          {wizardStep === 6 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <h5 className="font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  Ready to Publish Campaign
                </h5>
                <p>
                  Review the summary details below. Publishing this campaign will deduct 1 campaign credit and schedule it across customer apps for the configured dates.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Campaign Name:</span>
                  <span className="font-bold text-slate-900">{campaignTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Campaign Type:</span>
                  <span className="font-bold text-slate-900">
                    {campaignType === 'festival_offer' ? 'Festive Special Promotion' : 'Standard In-App Banner'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Schedule Duration:</span>
                  <span className="font-mono text-slate-900">{startDate} to {endDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">CTA Button:</span>
                  <span className="font-bold text-[#1677F2]">{ctaText}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Credit Balance Before:</span>
                  <span className="font-bold text-emerald-700">{remainingCredits} remaining</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-900 font-bold">Credits Consumed:</span>
                  <span className="font-bold text-amber-800">1 Credit</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Important Policy: </strong> Once published, 1 campaign credit will be deducted from your tenant account. In accordance with multi-tenant platform rules, deleting the campaign later will NOT refund the credit.
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* BANNER CREATOR MODAL */}
      <BannerCreatorModal
        isOpen={isBannerCreatorOpen}
        onClose={() => setIsBannerCreatorOpen(false)}
        businessName={profile?.company_name || tenantId}
        businessLogo={profile?.logo}
        onApplyBanner={(dataUrl) => {
          setBannerImageUrl(dataUrl);
        }}
      />

      {/* PURCHASE EXTRA CREDITS MODAL */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Purchase Additional Campaign Credits"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handlePurchaseExtra}>
              Pay ₹{purchaseQuantity * 299} & Add Credits
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {purchaseSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{purchaseSuccess}</span>
            </div>
          )}
          <p className="text-xs text-slate-600">
            Need to run more seasonal campaigns? Purchase additional credits for your tenant at <strong>₹299 per campaign</strong>.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Quantity of Campaigns:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                  className="w-7 h-7 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  -
                </button>
                <span className="font-bold text-sm text-slate-900 w-6 text-center">{purchaseQuantity}</span>
                <button
                  type="button"
                  onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                  className="w-7 h-7 rounded bg-white border border-slate-300 font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Total Payable:</span>
              <span className="text-base font-bold text-amber-800">₹{purchaseQuantity * 299}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
