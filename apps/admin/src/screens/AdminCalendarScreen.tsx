import React, { useState } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Globe,
  MapPin,
  Edit2,
  Sparkles,
  X,
  UploadCloud,
} from 'lucide-react';
import { APP_CONFIG } from '@mana/config';
import { AdminService } from '@mana/services';

interface CalendarFestival {
  id: string;
  nameEn: string;
  nameTe: string;
  date: string;
  dayOfWeek: string;
  category: 'Gazetted Holiday' | 'Regional Festival' | 'Important Observance';
  regions: ('AP' | 'Telangana' | 'National')[];
  isMajor: boolean;
  status: 'published' | 'draft';
  description?: string;
}

export const AdminCalendarScreen: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const [festivals, setFestivals] = useState<CalendarFestival[]>([
    {
      id: 'fest_01',
      nameEn: 'Makara Sankranti / Pongal',
      nameTe: 'మకర సంక్రాంతి',
      date: '2027-01-15',
      dayOfWeek: 'Friday',
      category: 'Regional Festival',
      regions: ['AP', 'Telangana', 'National'],
      isMajor: true,
      status: 'published',
      description: 'Major Hindu harvest festival celebrating the Sun god transition into Makara Rasi.',
    },
    {
      id: 'fest_02',
      nameEn: 'Kanuma Panduga',
      nameTe: 'కనుమ పండుగ',
      date: '2027-01-16',
      dayOfWeek: 'Saturday',
      category: 'Regional Festival',
      regions: ['AP', 'Telangana'],
      isMajor: true,
      status: 'published',
      description: 'Telugu cattle-rearing celebration honoring farm animals and rural heritage.',
    },
    {
      id: 'fest_03',
      nameEn: 'Republic Day',
      nameTe: 'గణతంత్ర దినోత్సవం',
      date: '2027-01-26',
      dayOfWeek: 'Tuesday',
      category: 'Gazetted Holiday',
      regions: ['National'],
      isMajor: true,
      status: 'published',
      description: 'National gazetted holiday commemorating the adoption of the Constitution of India.',
    },
    {
      id: 'fest_04',
      nameEn: 'Maha Shivaratri',
      nameTe: 'మహా శివరాత్రి',
      date: '2027-03-06',
      dayOfWeek: 'Saturday',
      category: 'Regional Festival',
      regions: ['AP', 'Telangana', 'National'],
      isMajor: true,
      status: 'published',
      description: 'Great night of Shiva, fasting and all-night vigil at jyotirlinga and regional shrines.',
    },
    {
      id: 'fest_05',
      nameEn: 'Ugadi (Telugu New Year)',
      nameTe: 'శ్రీ ప్లవంగ నామ ఉగాది',
      date: '2027-04-07',
      dayOfWeek: 'Wednesday',
      category: 'Regional Festival',
      regions: ['AP', 'Telangana'],
      isMajor: true,
      status: 'published',
      description: 'Chaitra Shukla Pratipada. Preparation of Ugadi Pachadi and Panchanga Sravanam.',
    },
    {
      id: 'fest_06',
      nameEn: 'Sri Rama Navami',
      nameTe: 'శ్రీరామ నవమి',
      date: '2027-04-16',
      dayOfWeek: 'Friday',
      category: 'Regional Festival',
      regions: ['AP', 'Telangana', 'National'],
      isMajor: true,
      status: 'published',
      description: 'Celebration of the descent of Lord Rama with Sita Rama Kalyanam in Bhadrachalam.',
    },
  ]);

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    nameEn: '',
    nameTe: '',
    date: '2027-01-01',
    category: 'Regional Festival' as CalendarFestival['category'],
    regions: ['AP', 'Telangana'] as CalendarFestival['regions'],
    isMajor: true,
    description: '',
  });

  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleAddFestival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nameEn || !addForm.nameTe || !addForm.date) return;

    const newFest: CalendarFestival = {
      id: `fest_${Date.now()}`,
      nameEn: addForm.nameEn,
      nameTe: addForm.nameTe,
      date: addForm.date,
      dayOfWeek: new Date(addForm.date).toLocaleDateString('en-US', { weekday: 'long' }),
      category: addForm.category,
      regions: addForm.regions,
      isMajor: addForm.isMajor,
      status: 'published',
      description: addForm.description,
    };

    setFestivals((prev) => [newFest, ...prev]);
    setIsAddOpen(false);
    setSuccessBanner(`Festival "${newFest.nameEn}" (${newFest.nameTe}) added to year ${selectedYear} calendar!`);

    AdminService.recordAuditLog({
      actor_id: 'admin-content-03',
      actor_type: 'admin',
      action: 'calendar_festival_added',
      resource_type: 'calendar',
      resource_id: newFest.id,
      details: newFest as unknown as Record<string, unknown>,
      ip_address: '103.48.196.12',
    });

    setAddForm({
      nameEn: '',
      nameTe: '',
      date: '2027-01-01',
      category: 'Regional Festival',
      regions: ['AP', 'Telangana'],
      isMajor: true,
      description: '',
    });
  };

  const filtered = festivals.filter((f) => {
    const matchesSearch =
      f.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.nameTe.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesRegion =
      regionFilter === 'all' ||
      f.regions.includes(regionFilter as any) ||
      f.regions.includes('National');
    return matchesSearch && matchesCategory && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Multi-Year Calendar Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure Telugu festivals, gazetted holidays, and regional observances with bilingual names
          </p>
        </div>

        {/* Year Pills & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            {APP_CONFIG.supportedYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedYear === yr
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Year {yr}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="md"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddOpen(true)}
          >
            Add Festival
          </Button>
        </div>
      </div>

      {/* Success banner */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs w-full md:w-80">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search in English or Telugu (ఉగాది)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Filter size={13} />
              <span>Category:</span>
            </div>
            {['all', 'Regional Festival', 'Gazetted Holiday', 'Important Observance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <span>Region:</span>
            </div>
            {['all', 'AP', 'Telangana', 'National'].map((reg) => (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  regionFilter === reg
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg === 'all' ? 'All Regions' : reg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Festivals Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Festivals & Holidays for Year {selectedYear} ({filtered.length} entries)
          </span>
          <span className="text-[11px] text-slate-500">
            Bilingual English + Telugu synchronization
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Festival Name (English & Telugu)</th>
                <th className="px-5 py-3">Date & Day</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Applicable Regions</th>
                <th className="px-5 py-3">Significance</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{f.nameEn}</div>
                    <div className="text-blue-600 font-semibold text-[11px] mt-0.5">{f.nameTe}</div>
                    {f.description && (
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{f.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    <div className="font-semibold text-slate-900">{f.date}</div>
                    <div className="text-[11px] text-slate-400 font-sans">{f.dayOfWeek}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        f.category === 'Gazetted Holiday'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : f.category === 'Regional Festival'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {f.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      {f.regions.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {f.isMajor ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Sparkles size={11} className="text-amber-500" />
                        Major
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Standard</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Festival Modal */}
      {isAddOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddOpen(false)}
          title={`Add Festival / Holiday to Year ${selectedYear}`}
          size="md"
        >
          <form onSubmit={handleAddFestival} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">English Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Vinayaka Chavithi"
                value={addForm.nameEn}
                onChange={(e) => setAddForm({ ...addForm, nameEn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telugu Name (తెలుగు) *</label>
              <input
                type="text"
                required
                placeholder="e.g. వినాయక చవితి"
                value={addForm.nameTe}
                onChange={(e) => setAddForm({ ...addForm, nameTe: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="Regional Festival">Regional Festival</option>
                  <option value="Gazetted Holiday">Gazetted Holiday</option>
                  <option value="Important Observance">Important Observance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description / Cultural Context</label>
              <textarea
                rows={2}
                placeholder="e.g. Celebrated on Bhadrapada Shukla Chavithi with clay Ganesha idols"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMajor"
                checked={addForm.isMajor}
                onChange={(e) => setAddForm({ ...addForm, isMajor: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isMajor" className="font-medium text-slate-700">
                Mark as Major Festival (Highlights in Monthly Calendar & Banner Carousel)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Save & Publish to Calendar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
