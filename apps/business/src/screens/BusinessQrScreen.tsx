import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '@mana/ui';
import { useAuth, DeferredDeepLinkService, BusinessService } from '@mana/services';
import type { BusinessProfile } from '@mana/types';
import {
  QrCode,
  Download,
  Printer,
  Share2,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BusinessQrScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  useEffect(() => {
    BusinessService.getBusinessProfile(tenantId).then(setProfile);
  }, [tenantId]);

  const qrDestinationUrl = DeferredDeepLinkService.generateQrUrl(tenantId);
  const businessName = profile?.company_name || (tenantId === 'SLJ001' ? 'Sri Lakshmi Jewellery' : tenantId);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(qrDestinationUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadQr = () => {
    // Generate simulated QR SVG download
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
        <rect width="500" height="500" fill="#ffffff" />
        <rect x="50" y="50" width="400" height="400" fill="#f8fafc" stroke="#1677f2" stroke-width="6" rx="24" />
        <text x="250" y="110" font-size="28" font-family="sans-serif" font-weight="bold" fill="#0f172a" text-anchor="middle">మన క్యాలెండర్ 2027</text>
        <text x="250" y="145" font-size="18" font-family="sans-serif" font-weight="bold" fill="#1677f2" text-anchor="middle">${businessName}</text>
        <rect x="125" y="175" width="250" height="250" fill="#0f172a" rx="16" />
        <text x="250" y="310" font-size="32" font-family="sans-serif" fill="#ffffff" text-anchor="middle">QR CODE</text>
        <text x="250" y="455" font-size="14" font-family="monospace" fill="#64748b" text-anchor="middle">${qrDestinationUrl}</text>
      </svg>
    `.trim();

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mana_calendar_qr_${tenantId.toLowerCase()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Store QR Code Management</h2>
        <p className="text-xs text-[#64748B]">
          In-store retail counter QR badge connects visiting customers directly to your business promotions inside Mana Calendar 2027.
        </p>
      </div>

      {copySuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>QR Destination URL copied to clipboard!</span>
        </div>
      )}

      <Card padding="lg" className="text-center">
        {/* Printable/Counter Preview Badge */}
        <div className="max-w-xs mx-auto p-6 bg-white border-2 border-dashed border-[#1677F2]/40 rounded-2xl shadow-subtle space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#1677F2] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-sm">
            మ
          </div>

          <div>
            <h3 className="font-bold text-sm text-[#0F172A]">మన క్యాలెండర్ 2027</h3>
            <p className="text-xs text-[#1677F2] font-semibold">{businessName}</p>
          </div>

          {/* QR visual presentation */}
          <div className="w-48 h-48 mx-auto bg-slate-50 border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center p-3 relative group">
            <QrCode size={140} className="text-[#0F172A]" />
            <span className="text-[10px] font-mono font-bold text-[#1677F2] mt-1">
              TENANT: {tenantId}
            </span>
          </div>

          <div className="text-[11px] text-[#64748B]">
            Scan with any smartphone camera to open your store profile or install Mana Calendar 2027 with instant business attribution.
          </div>
        </div>

        {/* Destination URL Display */}
        <div className="max-w-md mx-auto mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-left">
          <div className="truncate mr-2">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Permanent QR Destination:
            </span>
            <code className="text-slate-900 font-mono text-[11px] font-semibold">
              {qrDestinationUrl}
            </code>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
              title="Copy URL"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => navigate(`/b/${tenantId.toLowerCase()}`)}
              className="p-1.5 text-blue-600 hover:text-blue-800 rounded transition-colors"
              title="Test Landing Page"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadQr}
            leftIcon={<Download size={16} />}
          >
            Download High-Res QR (SVG)
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsPosterModalOpen(true)}
            leftIcon={<Printer size={16} />}
          >
            Print Counter Poster
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(`/b/${tenantId.toLowerCase()}`)}
            leftIcon={<ExternalLink size={16} />}
          >
            Test Customer QR Landing
          </Button>
        </div>
      </Card>

      {/* PRINT-FRIENDLY POSTER MODAL */}
      {isPosterModalOpen && (
        <Modal
          isOpen={isPosterModalOpen}
          onClose={() => setIsPosterModalOpen(false)}
          title="Print-Friendly Store Counter Poster"
          size="lg"
        >
          <div className="p-4 bg-white border-4 border-[#1677F2] rounded-3xl text-center space-y-4 max-w-sm mx-auto shadow-xl">
            <div className="w-14 h-14 bg-[#1677F2] text-white rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
              మ
            </div>

            <h3 className="font-extrabold text-lg text-slate-900">
              మన క్యాలెండర్ 2027
            </h3>
            <p className="text-xs font-semibold text-[#1677F2]">
              Official Business Partner: {businessName}
            </p>

            <div className="w-56 h-56 mx-auto bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4">
              <QrCode size={180} className="text-slate-900" />
            </div>

            <div className="text-xs text-slate-600 font-medium px-4">
              Scan this QR code with Google Lens or Camera to get festive gold offers and Telugu Panchangam on your phone!
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
              Powered by Mana Calendar 2027 • Visakhapatnam
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPosterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print?.()}
              leftIcon={<Printer size={14} />}
            >
              Print Poster Now
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
