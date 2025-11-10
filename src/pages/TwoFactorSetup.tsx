import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Check, AlertCircle, Download, Key, Lock } from 'lucide-react';
import { generateSecret, generateOTPAuthURL, generateQRCodeURL, verifyTOTP } from '../lib/security/totpUtils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';

interface Step1Props {
  onNext: () => void;
  onCancel: () => void;
}

interface Step2Props {
  secret: string;
  qrCodeUrl: string;
  email: string;
  onBack: () => void;
  onNext: () => void;
}

interface Step3Props {
  secret: string;
  onBack: () => void;
  onComplete: (recoveryCodes: string[]) => void;
}

interface Step4Props {
  recoveryCodes: string[];
  onComplete: () => void;
}

// Step 1: Introduction
const Step1: React.FC<Step1Props> = ({ onNext, onCancel }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-center mb-6">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <Shield className="w-8 h-8 text-slate-900" />
      </div>
    </div>

    <h3 className="text-2xl font-bold text-gray-900 text-center">
      Enable Two-Factor Authentication
    </h3>

    <div className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-slate-900 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-slate-900">
          <p className="font-semibold mb-1">Recommended for administrators</p>
          <p>2FA adds an extra layer of security to your account by requiring a time-based code in addition to your password.</p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-start">
        <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
        <p className="text-gray-700">Protect against unauthorized access</p>
      </div>
      <div className="flex items-start">
        <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
        <p className="text-gray-700">Works with Google Authenticator, Authy, or similar apps</p>
      </div>
      <div className="flex items-start">
        <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
        <p className="text-gray-700">Backup codes provided for account recovery</p>
      </div>
    </div>

    <div className="flex gap-3 pt-4">
      <button
        onClick={onCancel}
        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
      >
        Cancel
      </button>
      <button
        onClick={onNext}
        className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition"
      >
        Get Started
      </button>
    </div>
  </div>
);

// Step 2: Scan QR Code
const Step2: React.FC<Step2Props> = ({ secret, qrCodeUrl, email, onBack, onNext }) => {
  const [copied, setCopied] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 text-center">
        Scan QR Code
      </h3>

      <p className="text-gray-600 text-center">
        Scan this QR code with your authenticator app
      </p>

      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700 mb-2 font-medium">Can't scan? Enter this key manually:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
            {secret}
          </code>
          <button
            onClick={copySecret}
            className="p-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p>Keep this secret key safe. You'll need it if you want to add this account to another device.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition"
        >
          I've Scanned It
        </button>
      </div>
    </div>
  );
};

// Step 3: Verify Code
const Step3: React.FC<Step3Props> = ({ secret, onBack, onComplete }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify TOTP code
      const isValid = await verifyTOTP(code, secret);

      if (!isValid) {
        setError('Invalid code. Please try again.');
        setLoading(false);
        return;
      }

      // Generate recovery codes
      const recoveryCodes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        recoveryCodes.push(`${part1}-${part2}`);
      }

      // Hash recovery codes
      const encoder = new TextEncoder();
      const hashedCodes = await Promise.all(
        recoveryCodes.map(async (code) => {
          const data = encoder.encode(code);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          return hash;
        })
      );

      // Store in database
      const { error: insertError } = await supabase
        .from('recovery_codes')
        .insert(
          hashedCodes.map(hash => ({
            user_id: user?.id,
            code_hash: hash,
            used: false
          }))
        );

      if (insertError) throw insertError;

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          totp_enabled: true,
          totp_secret: secret,
          totp_verified_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      onComplete(recoveryCodes);
    } catch (err: any) {
      console.error('Error enabling 2FA:', err);
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Key className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 text-center">
        Verify Code
      </h3>

      <p className="text-gray-600 text-center">
        Enter the 6-digit code from your authenticator app
      </p>

      <div>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);
            setError('');
          }}
          maxLength={6}
          placeholder="000000"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:border-slate-500 focus:ring-2 focus:ring-blue-200 transition"
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </div>
    </div>
  );
};

// Step 4: Save Recovery Codes
const Step4: React.FC<Step4Props> = ({ recoveryCodes, onComplete }) => {
  const [downloaded, setDownloaded] = useState(false);

  const downloadCodes = () => {
    const text = `COM.RICH Recovery Codes\n\nKeep these codes safe. Each can only be used once.\n\n${recoveryCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comrich-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 text-center">
        Save Recovery Codes
      </h3>

      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-semibold mb-1">Important!</p>
            <p>Save these recovery codes in a safe place. Each code can only be used once to access your account if you lose your authenticator device.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {recoveryCodes.map((code, index) => (
            <div key={index} className="bg-white px-3 py-2 rounded border border-gray-300">
              {code}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={copyCodes}
          className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={downloadCodes}
          className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      <button
        onClick={onComplete}
        disabled={!downloaded}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloaded ? 'Complete Setup' : 'Download Codes First'}
      </button>

      {!downloaded && (
        <p className="text-sm text-center text-gray-600">
          Please download your recovery codes before completing setup
        </p>
      )}
    </div>
  );
};

// Main Component
export default function TwoFactorSetup() {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && !secret) {
      initializeSetup();
    }
  }, [step]);

  const initializeSetup = () => {
    // Generate secret
    const newSecret = generateSecret();
    setSecret(newSecret);

    // Generate QR code
    const otpauth = generateOTPAuthURL(
      user?.email || 'user',
      'COM.RICH',
      newSecret
    );

    const qrUrl = generateQRCodeURL(otpauth);
    setQrCodeUrl(qrUrl);
  };

  const handleComplete = () => {
    navigate('/account-settings');
  };

  const handleCancel = () => {
    navigate('/account-settings');
  };

  return (
    <PageLayout
      title="Two-Factor Authentication"
      subtitle="Secure your account with an extra layer of protection"
    >
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                      step >= num
                        ? 'bg-slate-700 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {num}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">
                    {num === 1 && 'Intro'}
                    {num === 2 && 'Scan'}
                    {num === 3 && 'Verify'}
                    {num === 4 && 'Save'}
                  </span>
                </div>
                {num < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition ${
                      step > num ? 'bg-slate-700' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200"
        >
          {step === 1 && (
            <Step1
              onNext={() => setStep(2)}
              onCancel={handleCancel}
            />
          )}
          {step === 2 && (
            <Step2
              secret={secret}
              qrCodeUrl={qrCodeUrl}
              email={user?.email || ''}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              secret={secret}
              onBack={() => setStep(2)}
              onComplete={(codes) => {
                setRecoveryCodes(codes);
                setStep(4);
              }}
            />
          )}
          {step === 4 && (
            <Step4
              recoveryCodes={recoveryCodes}
              onComplete={handleComplete}
            />
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
