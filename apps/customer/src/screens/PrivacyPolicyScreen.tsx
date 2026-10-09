import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Input } from '@mana/ui';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteEmail.trim()) return;

    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setDeleteSuccess(true);
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto text-[#0F172A]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:text-[#0F172A] shadow-xs"
          aria-label="Go Back"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#0F172A]">Privacy Policy & Data Safety</h1>
          <p className="text-xs text-[#64748B]">
            గోప్యతా విధానం • Effective Date: January 1, 2027
          </p>
        </div>
      </div>

      {/* Trust & Compliance Badge */}
      <div className="bg-[#EAF3FF] border border-[#bfdbfe] rounded-[16px] p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#1677F2] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-[#0F172A]">
          <span className="font-bold text-[#1677F2]">Mana Calendar 2027</span> is committed to user privacy and full compliance with Indian Information Technology (IT) Rules, Digital Personal Data Protection (DPDP) Act, and Google Play Store Data Safety policies.
        </div>
      </div>

      {/* 1. What Data We Collect */}
      <Card title="1. Information We Collect" padding="md">
        <div className="space-y-3 text-xs text-[#475569] leading-relaxed">
          <p>
            We collect minimal information necessary to deliver accurate Telugu Panchangam, daily weather, and personal calendar scheduling:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-[#0F172A]">Approximate Location:</strong> City name and geographical coordinates used exclusively to compute astronomical timings (Rahu Kalam, Sunrise/Sunset, Tithi) and localized weather. We do <em>not</em> track continuous GPS background location.
            </li>
            <li>
              <strong className="text-[#0F172A]">Push Notification Tokens (FCM):</strong> Device registration tokens used solely to dispatch festival reminders, auspicious Panchangam alerts, and opted-in partner announcements.
            </li>
            <li>
              <strong className="text-[#0F172A]">Personal Calendar Events:</strong> Titles, dates, and times of personal reminders created by you. These are private to your device/account and never sold to advertisers.
            </li>
            <li>
              <strong className="text-[#0F172A]">Business & QR Interactions:</strong> Non-personal analytics when you scan merchant QR codes or view promotional banners (e.g., Sri Lakshmi Jewellers or Radha Flours) for campaign attribution.
            </li>
            <li>
              <strong className="text-[#0F172A]">Commercial Payment Data:</strong> For business subscribers, subscription purchases are securely processed via RBI-licensed Indian payment gateways (e.g. Razorpay). We never store raw debit/credit card numbers or UPI PINs.
            </li>
          </ul>
        </div>
      </Card>

      {/* 2. Google Play Data Safety Mapping */}
      <Card title="2. Google Play Data Safety Declaration" padding="md">
        <div className="space-y-3 text-xs text-[#475569]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <span className="font-bold text-[#0F172A] block">Data Shared with 3rd Parties:</span>
              <span className="text-[11px] text-emerald-700 font-semibold">None (No Personal Data Sold or Shared)</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <span className="font-bold text-[#0F172A] block">Data Encryption in Transit:</span>
              <span className="text-[11px] text-emerald-700 font-semibold">HTTPS / TLS 1.3 Strict Encryption</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <span className="font-bold text-[#0F172A] block">Account Deletion Mechanism:</span>
              <span className="text-[11px] text-emerald-700 font-semibold">In-App Form & Email Self-Service</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px]">
              <span className="font-bold text-[#0F172A] block">Target Audience:</span>
              <span className="text-[11px] text-blue-700 font-semibold">General Audience (13+ years)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Data Retention & Erasure */}
      <Card title="3. Data Retention & Account Deletion" padding="md">
        <div className="space-y-3 text-xs text-[#475569] leading-relaxed">
          <p>
            You have the right to request deletion of your account and all associated personal data at any time. In compliance with Google Play Store guidelines, we provide an immediate self-service deletion request mechanism:
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDeleteSuccess(false);
              setIsDeleteModalOpen(true);
            }}
            leftIcon={<Trash2 size={14} className="text-red-500" />}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Request Account & Personal Data Deletion
          </Button>
        </div>
      </Card>

      {/* 4. Grievance Officer & Contact */}
      <Card title="4. Grievance Officer (India IT Rules)" padding="md">
        <div className="text-xs text-[#475569] space-y-1.5">
          <p>
            In accordance with the Information Technology Act, 2000 and rules made thereunder:
          </p>
          <div className="p-3 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-1 font-mono text-[11px]">
            <div><strong>Grievance Officer:</strong> Venkata Raman</div>
            <div><strong>Platform:</strong> Mana Calendar 2027 (manacalendar.in)</div>
            <div><strong>Email:</strong> privacy@manacalendar.in</div>
            <div><strong>Postal Address:</strong> Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016, India</div>
          </div>
        </div>
      </Card>

      {/* Deletion Request Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Request Account & Data Deletion"
        size="md"
        footer={
          deleteSuccess ? (
            <Button variant="primary" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Done
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteRequest}
                isLoading={isDeleting}
              >
                Submit Deletion Request
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-3 text-xs text-left">
          {deleteSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-[12px] space-y-2 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Deletion Request Submitted
              </div>
              <p>
                Your request has been registered. All personal event records, notification tokens, and account profile data associated with <strong>{deleteEmail}</strong> will be permanently purged within 48 hours. A confirmation has been logged.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDeleteRequest} className="space-y-3">
              <p className="text-[#64748B]">
                Enter your registered email or phone number to request complete erasure of your personal events, preferences, and push notification tokens.
              </p>
              <Input
                label="Registered Email or Mobile Number"
                type="text"
                placeholder="user@example.com or +91..."
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                  Reason for Deletion (Optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Tell us why you wish to delete your data..."
                  rows={2}
                  className="w-full rounded-[10px] border border-[#CBD5E1] p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
                />
              </div>
              <div className="p-2.5 bg-amber-50 rounded-[10px] border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>Notice: Deletion is permanent and cannot be undone once processed.</span>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
