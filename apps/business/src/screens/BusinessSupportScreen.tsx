import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '@mana/ui';
import { useAuth } from '@mana/services';
import {
  HelpCircle,
  Send,
  MessageSquare,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FaqItem {
  q: string;
  q_te: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How many campaigns are included in my annual subscription?',
    q_te: 'వార్షిక సభ్యత్వంలో ఎన్ని ప్రచారాలు (Campaigns) ఉంటాయి?',
    a: 'Both Business (₹1,999/yr) and Premium (₹3,999/yr) plans include 10 promotional campaigns per calendar year. Additional campaign credits can be unlocked anytime for ₹299 each.',
  },
  {
    q: 'What happens if I delete an active campaign?',
    q_te: 'రద్దయిన ప్రచారాన్ని డిలీట్ చేస్తే క్రెడిట్ తిరిగి వస్తుందా?',
    a: 'In accordance with multi-tenant platform rules, deleting a campaign consumes the quota and does NOT restore the credit. This ensures auditable fair placement on festival calendar days.',
  },
  {
    q: 'How do customers discover my business?',
    q_te: 'వినియోగదారులు నా దుకాణాన్ని ఎలా కనుగొంటారు?',
    a: 'Customers find you through: 1) Scanning your store QR code at your retail counter, 2) Contextual calendar festival banners, 3) The "My Businesses" directory inside the Mana Calendar 2027 Android app.',
  },
  {
    q: 'Who can send promotional push notifications?',
    q_te: 'పుష్ నోటిఫికేషన్లు ఎవరు పంపగలరు?',
    a: 'Promotional push notifications are an exclusive feature of the Premium Plan (₹3,999/year). Standard plan partners can upgrade anytime under Subscription settings.',
  },
];

export const BusinessSupportScreen: React.FC = () => {
  const { businessId } = useAuth();
  const tenantId = (businessId || 'SLJ001').toUpperCase();

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Campaign Placement');
  const [description, setDescription] = useState('');
  const [submittedTickets, setSubmittedTickets] = useState([
    {
      id: 'MC-TKT-8841',
      subject: 'Festival Banner Schedule for Ugadi 2027',
      category: 'Campaign',
      status: 'resolved',
      date: '2026-09-25',
    },
  ]);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTkt = {
      id: `MC-TKT-${Math.floor(Math.random() * 9000 + 1000)}`,
      subject,
      category,
      status: 'open',
      date: new Date().toISOString().split('T')[0],
    };
    setSubmittedTickets([newTkt, ...submittedTickets]);
    setSuccessMessage(true);
    setSubject('');
    setDescription('');
    setTimeout(() => setSuccessMessage(false), 4000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Partner Support & Helpdesk</h2>
        <p className="text-xs text-[#64748B]">
          Dedicated assistance and FAQs for Mana Calendar 2027 merchant partners (Tenant: {tenantId})
        </p>
      </div>

      {/* Quick Contact Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-600" />
            <h4 className="font-bold text-xs text-slate-900">WhatsApp Merchant Desk</h4>
          </div>
          <p className="text-xs font-mono font-semibold text-slate-800 mt-1">+91 891 299 4400</p>
          <span className="text-[10px] text-slate-500">Mon-Sat, 9 AM - 8 PM IST</span>
        </Card>

        <Card padding="md" className="border-l-4 border-l-blue-600">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-[#1677F2]" />
            <h4 className="font-bold text-xs text-slate-900">Partner Helpline</h4>
          </div>
          <p className="text-xs font-mono font-semibold text-slate-800 mt-1">1800-425-2027</p>
          <span className="text-[10px] text-slate-500">Toll Free across AP & Telangana</span>
        </Card>

        <Card padding="md" className="border-l-4 border-l-purple-600">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-purple-600" />
            <h4 className="font-bold text-xs text-slate-900">Official Partner Email</h4>
          </div>
          <p className="text-xs font-semibold text-slate-800 mt-1">business@manacalendar.in</p>
          <span className="text-[10px] text-slate-500">Response within 24 hours</span>
        </Card>
      </div>

      {/* FAQs Accordion */}
      <Card title="Merchant Frequently Asked Questions (తెలుగు + English)" padding="md">
        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="py-3">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left gap-2 text-xs font-bold text-slate-900 hover:text-[#1677F2] transition-colors"
              >
                <div>
                  <span>{faq.q}</span>
                  <span className="block text-[11px] font-normal text-slate-500 mt-0.5">{faq.q_te}</span>
                </div>
                {expandedFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedFaq === idx && (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Submit Support Ticket */}
      <Card title="Submit a Support Request" subtitle="Our partner support team will respond quickly" padding="md">
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Support ticket created successfully! We will get in touch shortly.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-[#1677F2]"
              >
                <option value="Campaign Placement">Campaign Placement & Scheduling</option>
                <option value="QR Code & Posters">QR Code & Store Posters</option>
                <option value="Billing & Invoices">Billing & GST Invoices</option>
                <option value="Push Notifications">Premium Push Notifications</option>
                <option value="Profile Updates">Store Profile Updates</option>
              </select>
            </div>

            <Input
              label="Subject / Topic"
              placeholder="Brief summary of your question"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain the issue or question in detail..."
              required
              className="w-full rounded-lg border border-[#E2E8F0] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" leftIcon={<Send size={14} />}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Card>

      {/* Ticket History */}
      <Card title="Ticket History" subtitle="Recent support inquiries for your tenant account" padding="md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <th className="py-2 px-3">Ticket ID</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submittedTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.id}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">{t.subject}</td>
                  <td className="py-2.5 px-3 text-slate-500">{t.category}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">{t.date}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant={t.status === 'resolved' ? 'success' : 'warning'} size="sm">
                      {t.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
