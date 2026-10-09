import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge } from '@mana/ui';
import { useAuth, BusinessService } from '@mana/services';
import type { BusinessProfile } from '@mana/types';
import {
  Building2,
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  MessageCircle,
  Share2,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { MobileCustomerPreview } from '../components/MobileCustomerPreview';

export const BusinessProfileScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [companyName, setCompanyName] = useState('Sri Lakshmi Jewellery');
  const [tagline, setTagline] = useState('Pure 916 BIS Hallmarked Gold & Diamond Jewellery');
  const [category, setCategory] = useState('Jewellery & Ornaments');
  const [description, setDescription] = useState(
    'Leading 916 Hallmark Gold & Diamond Jewellery in Vizag since 1985.'
  );
  const [phone, setPhone] = useState('+91 891 275 8899');
  const [whatsapp, setWhatsapp] = useState('+918912758899');
  const [email, setEmail] = useState('contact@srilakshmijewellers.in');
  const [website, setWebsite] = useState('https://srilakshmijewellers.in');
  const [address, setAddress] = useState('Shop No. 14-16, Jagadamba Junction, Main Road');
  const [city, setCity] = useState('Visakhapatnam');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('530002');
  const [hours, setHours] = useState('10:00 AM - 09:30 PM (Mon-Sat)');
  const [instagram, setInstagram] = useState('https://instagram.com/srilakshmijewellers');
  const [facebook, setFacebook] = useState('https://facebook.com/srilakshmijewellers');
  const [logo, setLogo] = useState(
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300'
  );
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    BusinessService.getBusinessProfile(tenantId).then((data) => {
      if (data) {
        if (data.company_name) setCompanyName(data.company_name);
        if (data.tagline) setTagline(data.tagline);
        if (data.category) setCategory(data.category);
        if (data.description) setDescription(data.description);
        if (data.phone) setPhone(data.phone);
        if (data.email) setEmail(data.email);
        if (data.website) setWebsite(data.website);
        if (data.address) setAddress(data.address);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.pincode) setPincode(data.pincode);
        if (data.logo) setLogo(data.logo);
        if (data.cover_image) setCoverImage(data.cover_image);
        if (data.social_links) {
          if (data.social_links.whatsapp) setWhatsapp(data.social_links.whatsapp);
          if (data.social_links.hours) setHours(data.social_links.hours);
          if (data.social_links.instagram) setInstagram(data.social_links.instagram);
          if (data.social_links.facebook) setFacebook(data.social_links.facebook);
        }
      }
    });
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await BusinessService.updateBusinessProfile(tenantId, {
        company_name: companyName,
        tagline,
        category,
        description,
        phone,
        email,
        website,
        address,
        city,
        state,
        pincode,
        logo,
        cover_image: coverImage,
        social_links: {
          whatsapp,
          hours,
          instagram,
          facebook,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Business Profile</h2>
          <p className="text-xs text-[#64748B]">
            Tenant ID: <span className="font-mono text-[#1677F2] font-semibold">{tenantId}</span> • Public storefront details presented in Customer App
          </p>
        </div>

        {/* Tab switcher for mobile / small screen */}
        <div className="flex items-center gap-2">
          <div className="flex lg:hidden bg-slate-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPreviewTab('form')}
              className={`px-3 py-1.5 rounded-lg ${
                previewTab === 'form' ? 'bg-white text-[#1677F2] shadow-sm' : 'text-slate-600'
              }`}
            >
              Edit Form
            </button>
            <button
              onClick={() => setPreviewTab('preview')}
              className={`px-3 py-1.5 rounded-lg ${
                previewTab === 'preview' ? 'bg-white text-[#1677F2] shadow-sm' : 'text-slate-600'
              }`}
            >
              Live Mobile Preview
            </button>
          </div>

          <Badge variant="primary" size="md">
            Tenant: {tenantId}
          </Badge>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Profile changes saved and updated in the customer ecosystem!</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Mobile Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className={`space-y-6 lg:col-span-7 ${previewTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branding Creatives */}
            <Card title="Brand Assets" subtitle="Logos and storefront banner" padding="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
                    Business Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={logo || ''}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-cover border border-[#E2E8F0]"
                    />
                    <div className="flex-1">
                      <Input
                        label=""
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="Logo URL"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-2">
                    Storefront Banner
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={coverImage || ''}
                      alt="Cover"
                      className="w-20 h-16 rounded-xl object-cover border border-[#E2E8F0]"
                    />
                    <div className="flex-1">
                      <Input
                        label=""
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="Banner URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Core Info */}
            <Card title="Store Details & Information" padding="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Official Business / Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Tagline / Telugu Slogan"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Pure 916 BIS Hallmarked Jewellery"
                />

                <Input
                  label="Business Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Jewellery, Groceries, Clothing"
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                    About / Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-[#E2E8F0] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
                  />
                </div>
              </div>
            </Card>

            {/* Contact & Hours */}
            <Card title="Customer Communication & Contact" padding="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Calling Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone size={16} />}
                />

                <Input
                  label="Customer WhatsApp Number"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  leftIcon={<MessageCircle size={16} />}
                  placeholder="+91..."
                />

                <Input
                  label="Official Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                />

                <Input
                  label="Website URL"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  leftIcon={<Globe size={16} />}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Operating Hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    leftIcon={<Clock size={16} />}
                    placeholder="e.g. 10:00 AM - 09:30 PM (Mon-Sat)"
                  />
                </div>
              </div>
            </Card>

            {/* Address */}
            <Card title="Store Location" padding="md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Store Address / Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    leftIcon={<MapPin size={16} />}
                  />
                </div>

                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />

                <Input
                  label="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Save size={16} />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </Card>
          </form>
        </div>

        {/* Live Customer Preview Column */}
        <div className={`lg:col-span-5 sticky top-24 ${previewTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#1677F2]" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Customer Preview
                </span>
              </div>
              <Badge variant="success" size="sm">
                Real-Time
              </Badge>
            </div>

            <MobileCustomerPreview
              businessName={companyName}
              businessLogo={logo}
              coverImage={coverImage}
              category={category}
              phone={phone}
              whatsapp={whatsapp}
              address={address}
              city={city}
              hours={hours}
              campaignDescription={description}
              mode="profile"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
