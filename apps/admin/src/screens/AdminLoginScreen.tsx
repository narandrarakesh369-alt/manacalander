import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Badge, Modal } from '@mana/ui';
import { useAuth, AdminService } from '@mana/services';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import type { AdminRoleType } from '@mana/types';

export const AdminLoginScreen: React.FC = () => {
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState('owner@manacalendar2027.com');
  const [password, setPassword] = useState('admin123');
  const [mfaCode, setMfaCode] = useState('');
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [currentRole, setCurrentRole] = useState<AdminRoleType>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const { switchDevRole } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await AdminService.login(email, password);
      setCurrentAdminId(res.admin.id);
      setCurrentRole(res.role);
      setStep('mfa');
    } catch (err: any) {
      setError(err.message || 'Invalid Super Admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const verified = AdminService.verifyMfaCode(currentAdminId, mfaCode);
      if (!verified) {
        setError('Invalid MFA Authenticator Code. Demo code: 202700 or 123456');
        return;
      }

      switchDevRole('super_admin');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError('MFA verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setRecoverySuccess(false);
      setRecoveryEmail('');
    }, 2200);
  };

  const handleQuickDemoAdmin = (adminRole: AdminRoleType, emailStr: string) => {
    switchDevRole('super_admin');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#1677F2] mx-auto flex items-center justify-center font-bold text-2xl shadow-lg">
            <ShieldCheck size={32} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Console</h1>
          <p className="text-xs text-slate-400">
            Mana Calendar 2027 • Central Platform Governance & Operations
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            /* STEP 1: EMAIL & PASSWORD */
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Step 1: Admin Credentials
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Super Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Admin Master Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full bg-[#1677F2] hover:bg-blue-600 focus:ring-blue-500 font-semibold text-xs"
                isLoading={isLoading}
                rightIcon={<ArrowRight size={16} />}
              >
                Proceed to MFA Verification
              </Button>
            </form>
          ) : (
            /* STEP 2: MULTI-FACTOR AUTHENTICATION */
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Step 2: Multi-Factor Authentication (MFA)
                </span>
                <Badge variant="primary" size="sm">
                  Role: {currentRole.toUpperCase()}
                </Badge>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <KeyRound size={13} className="text-blue-400" /> Enter 6-digit Authenticator Code:
                </div>
                <p className="text-slate-400">
                  Enter the code from your Google Authenticator or SMS token (Demo Code: <strong>202700</strong> or <strong>123456</strong>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  6-Digit MFA Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="202700"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center font-mono text-base tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[#1677F2]"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setStep('credentials')}
                  className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs"
                  isLoading={isLoading}
                  rightIcon={<ShieldCheck size={16} />}
                >
                  Verify & Enter
                </Button>
              </div>
            </form>
          )}

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Test Roles (Development Simulator)
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickDemoAdmin('owner', 'owner@manacalendar2027.com')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
              >
                <div className="text-xs font-bold text-white">Owner Role</div>
                <div className="text-[10px] text-slate-400">Full System Access</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoAdmin('content_admin', 'content@manacalendar2027.com')}
                className="p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
              >
                <div className="text-xs font-bold text-white">Content Admin</div>
                <div className="text-[10px] text-slate-400">Panchangam & Festivals</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Return to Customer App
          </button>
        </div>
      </div>

      {/* RECOVERY MODAL */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Super Admin Credential Recovery"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsForgotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handlePasswordRecovery}>
              Send Recovery Key
            </Button>
          </div>
        }
      >
        <form onSubmit={handlePasswordRecovery} className="space-y-4 text-left p-1">
          {recoverySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>Emergency recovery credentials dispatched to your hardware token and email.</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Enter your authorized Super Admin email. An encrypted single-use recovery code will be dispatched to your registered recovery contact.
          </p>

          <Input
            label="Super Admin Email"
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="owner@manacalendar2027.com"
            required
          />
        </form>
      </Modal>
    </div>
  );
};
