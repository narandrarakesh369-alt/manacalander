import React, { useState } from 'react';
import { Badge, Button, Modal } from '@mana/ui';
import {
  SunMedium,
  Moon,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  History,
  MapPin,
  Calendar,
  X,
} from 'lucide-react';
import { DEFAULT_LOCATION } from '@mana/config';
import { AdminService } from '@mana/services';
import type { PanchangamAuditRecord } from '@mana/types';

export const AdminPanchangamScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2027-01-15');
  const [selectedCity, setSelectedCity] = useState('Visakhapatnam');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('Astronomical calculations verified against Tirumala Tirupati Devasthanams ephemeris data.');
  const [auditList, setAuditList] = useState<PanchangamAuditRecord[]>(AdminService.getPanchangamAudits());
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Panchangam inspection data
  const panchangamData = {
    date: selectedDate,
    city: selectedCity,
    tithi: 'Shukla Ashtami (శుక్ల అష్టమి)',
    tithiEndTime: '04:12 PM',
    nakshatra: 'Rohini (రోహిణి)',
    nakshatraEndTime: '06:45 PM',
    yoga: 'Siddha (సిద్ధ)',
    yogaEndTime: '08:15 PM',
    karana: 'Bava (బవ)',
    karanaEndTime: '04:12 PM',
    sunrise: '06:28 AM',
    sunset: '05:48 PM',
    moonrise: '12:40 PM',
    moonset: '01:15 AM (Next day)',
    rahuKalam: '10:45 AM - 12:10 PM',
    yamagandam: '03:00 PM - 04:25 PM',
    gulikaKalam: '07:55 AM - 09:20 AM',
    abhijitMuhurtham: '11:45 AM - 12:32 PM',
    durmuhurtham: '08:45 AM - 09:30 AM, 12:32 PM - 01:18 PM',
    varjyam: '09:12 PM - 10:48 PM',
    amritaKalam: '02:15 PM - 03:48 PM',
  };

  const handleVerifyPublish = () => {
    try {
      const audit = AdminService.verifyAndPublishPanchangam(
        selectedDate,
        panchangamData,
        verificationNotes,
        'admin-content-03',
        'Pandit Sharma'
      );

      setAuditList(AdminService.getPanchangamAudits());
      setIsVerifying(false);
      setSuccessBanner(`Panchangam for ${selectedDate} (${selectedCity}) verified and published to production calendar!`);
    } catch (err) {
      console.error('Failed to verify Panchangam:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Panchangam & Ephemeris Engine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Astronomical calculations verification, muhurtham validation, and published Telugu calendar telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
            leftIcon={<ShieldCheck size={16} />}
            onClick={() => setIsVerifying(true)}
          >
            Verify & Publish Date
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

      {/* Date & Location Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Calendar Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ephemeris City Anchor</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none focus:border-blue-500 font-medium"
            >
              <option value="Visakhapatnam">Visakhapatnam, AP (Lat: 17.7126, Lon: 83.3012)</option>
              <option value="Vijayawada">Vijayawada, AP (Lat: 16.5062, Lon: 80.6480)</option>
              <option value="Hyderabad">Hyderabad, TS (Lat: 17.3850, Lon: 78.4867)</option>
              <option value="Tirupati">Tirupati, AP (Lat: 13.6288, Lon: 79.4192)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Editorial Status</label>
            <div className="flex items-center h-9">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Verified & Published to App
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Panchangam Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Five Elements (Panchanga) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Compass size={16} className="text-blue-600" />
              Panchanga Essentials (పంచాంగ విషయములు)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">ASTRO-CALC</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Tithi (తిథి):</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">{panchangamData.tithi}</span>
                <span className="text-[11px] text-slate-400 font-mono">Until {panchangamData.tithiEndTime}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Nakshatra (నక్షత్రం):</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">{panchangamData.nakshatra}</span>
                <span className="text-[11px] text-slate-400 font-mono">Until {panchangamData.nakshatraEndTime}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Yoga (యోగం):</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">{panchangamData.yoga}</span>
                <span className="text-[11px] text-slate-400 font-mono">Until {panchangamData.yogaEndTime}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-medium">Karana (కరణం):</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">{panchangamData.karana}</span>
                <span className="text-[11px] text-slate-400 font-mono">Until {panchangamData.karanaEndTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Solar & Lunar Cycles */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <SunMedium size={16} className="text-amber-500" />
              Surya & Chandra Ephemeris (సూర్యోదయ / చంద్రోదయ)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">EPHEMERIS-IST</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
              <span className="text-[11px] text-amber-700 block font-medium">Sunrise (సూర్యోదయం)</span>
              <span className="font-mono text-lg font-bold text-slate-900 mt-1 block">
                {panchangamData.sunrise}
              </span>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
              <span className="text-[11px] text-amber-700 block font-medium">Sunset (సూర్యాస్తమయం)</span>
              <span className="font-mono text-lg font-bold text-slate-900 mt-1 block">
                {panchangamData.sunset}
              </span>
            </div>

            <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
              <span className="text-[11px] text-indigo-700 block font-medium">Moonrise (చంద్రోదయం)</span>
              <span className="font-mono text-lg font-bold text-slate-900 mt-1 block">
                {panchangamData.moonrise}
              </span>
            </div>

            <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
              <span className="text-[11px] text-indigo-700 block font-medium">Moonset (చంద్రాస్తమయం)</span>
              <span className="font-mono text-xs font-bold text-slate-900 mt-2 block">
                {panchangamData.moonset}
              </span>
            </div>
          </div>
        </div>

        {/* Inauspicious Timings (Varjyam / Rahu) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" />
              Inauspicious Periods (వర్జ్య కాలములు)
            </h3>
            <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Strict Caution
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Rahu Kalam (రాహు కాలం):</span>
              <span className="font-mono font-bold text-rose-700 bg-rose-50/70 px-2 py-0.5 rounded">
                {panchangamData.rahuKalam}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Yamagandam (యమగండం):</span>
              <span className="font-mono font-bold text-slate-800">
                {panchangamData.yamagandam}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Gulika Kalam (గుళిక కాలం):</span>
              <span className="font-mono font-bold text-slate-800">
                {panchangamData.gulikaKalam}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Varjyam (వర్జ్యం):</span>
              <span className="font-mono font-bold text-rose-700 bg-rose-50/70 px-2 py-0.5 rounded">
                {panchangamData.varjyam}
              </span>
            </div>
          </div>
        </div>

        {/* Auspicious Muhurtham */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-emerald-500" />
              Auspicious Muhurtham (శుభ ముహూర్తములు)
            </h3>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Shubham
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Abhijit Muhurtham (అభిజిత్):</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded">
                {panchangamData.abhijitMuhurtham}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Amrita Kalam (అమృత కాలం):</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded">
                {panchangamData.amritaKalam}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <History size={16} className="text-slate-600" />
            Immutable Ephemeris Verification Audit Trail
          </h3>
          <span className="text-[11px] text-slate-400">Total verified dates: {auditList.length}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {auditList.map((a) => (
            <div key={a.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-blue-600 mr-2">{a.calendar_date}</span>
                <span className="text-slate-900 font-medium">{a.notes}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">By {a.admin_name}</span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifying && (
        <Modal
          isOpen={true}
          onClose={() => setIsVerifying(false)}
          title={`Publish & Verify Panchangam: ${selectedDate}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Sign off on the mathematical and ephemeris values for <b>{selectedDate}</b> in{' '}
              <b>{selectedCity}</b>. This will push the verified status to millions of Mana Calendar Android users.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Content Admin Editorial Notes (Audit Requirement) *
              </label>
              <textarea
                required
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setIsVerifying(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleVerifyPublish}
              >
                Sign Off & Publish to Production
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
