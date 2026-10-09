import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Badge, Modal } from '@mana/ui';
import { useAuth } from '@mana/services';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const BusinessLoginScreen: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('owner@srilakshmijewellers.dev');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('9848022338');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { signIn, switchDevRole } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/business/dashboard');
    } catch {
      setError('Invalid business credentials. Please verify your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456' && otp !== '202700') {
      setError('Invalid OTP code. For demo, use 123456 or 202700.');
      return;
    }
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      switchDevRole('business_user', 'SLJ001');
      navigate('/business/dashboard');
      setIsLoading(false);
    }, 600);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2000);
  };

  const handleQuickDemoTenant = (businessId: string, emailStr: string) => {
    switchDevRole('business_user', businessId);
    navigate('/business/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#1677F2] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md">
            మ
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Mana Calendar 2027</h1>
          <p className="text-xs text-[#64748B]">
            Commercial Business Partner & Merchant Portal
          </p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              loginMethod === 'password'
                ? 'bg-white text-[#1677F2] shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('otp');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              loginMethod === 'otp'
                ? 'bg-white text-[#1677F2] shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            OTP Login (Mobile)
          </button>
        </div>

        {/* Login Card */}
        <Card padding="lg">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {loginMethod === 'password' ? (
            /* PASSWORD LOGIN FORM */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <h3 className="font-semibold text-base text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Business Partner Sign In
              </h3>

              <Input
                label="Registered Business Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@business.com"
                leftIcon={<Mail size={16} />}
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                required
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-[#1677F2] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight size={16} />}
              >
                Sign In to Dashboard
              </Button>
            </form>
          ) : (
            /* OTP LOGIN FORM */
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <h3 className="font-semibold text-base text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Merchant OTP Sign In
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  10-Digit Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98480..."
                      className="w-full pl-11 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#1677F2]"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendOtp}
                  >
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </Button>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 pt-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>6-digit OTP sent to +91 {phone} (Demo OTP: 123456)</span>
                  </div>

                  <Input
                    label="Enter 6-Digit OTP"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    leftIcon={<KeyRound size={16} />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Verify & Enter Portal
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* Development Quick Test Switcher */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] space-y-2">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Quick Test Tenants (Dev Simulator)
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickDemoTenant('SLJ001', 'owner@srilakshmijewellers.dev')}
                className="p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#1677F2] bg-[#F8FAFC] text-left transition-colors"
              >
                <div className="text-xs font-bold text-[#0F172A]">SLJ001</div>
                <div className="text-[10px] text-[#64748B]">Sri Lakshmi Jewellery (Premium)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoTenant('RF002', 'admin@radhaflours.in')}
                className="p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#1677F2] bg-[#F8FAFC] text-left transition-colors"
              >
                <div className="text-xs font-bold text-[#0F172A]">RF002</div>
                <div className="text-[10px] text-[#64748B]">Radha Flours (Business)</div>
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsForgotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleForgotPassword}>
              Send Reset Link
            </Button>
          </div>
        }
      >
        <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
          {forgotSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Password recovery instructions sent to your registered email!</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Enter the registered email for your business account. We will send a secure password reset link.
          </p>

          <Input
            label="Business Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="owner@business.com"
            required
          />
        </form>
      </Modal>
    </div>
  );
};
