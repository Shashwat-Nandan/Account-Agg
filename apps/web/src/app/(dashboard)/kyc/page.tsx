'use client';

import { useEffect, useState } from 'react';
import { UserCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const providers = [
  {
    id: 'AADHAAR',
    name: 'Aadhaar eKYC',
    level: 3,
    description: 'Full KYC via Aadhaar OTP verification',
  },
  {
    id: 'DIGILOCKER',
    name: 'DigiLocker',
    level: 2,
    description: 'Document-based KYC via DigiLocker OAuth',
  },
  {
    id: 'PAN',
    name: 'PAN Verification',
    level: 1,
    description: 'Basic KYC via PAN card verification',
  },
  {
    id: 'CKYC',
    name: 'Central KYC',
    level: 4,
    description: 'Full KYC from Central KYC Registry',
  },
];

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<any>({
    overallStatus: 'NOT_STARTED',
    providers: [],
  });
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [panForm, setPanForm] = useState({ pan: '', name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = () => {
    api.get<any>('/ekyc/status').then(setKycStatus).catch(() => {});
  };

  const getProviderStatus = (providerId: string) => {
    return kycStatus.providers.find((p: any) => p.provider === providerId);
  };

  const initiateAadhaar = async () => {
    setLoading(true);
    try {
      await api.post('/ekyc/aadhaar/otp');
      setActiveStep('AADHAAR_OTP');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAadhaarOtp = async () => {
    setLoading(true);
    try {
      await api.post('/ekyc/aadhaar/verify', {
        transactionId: 'sandbox-txn',
        otp: otpInput,
      });
      setActiveStep(null);
      setOtpInput('');
      loadStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPan = async () => {
    setLoading(true);
    try {
      await api.post('/ekyc/pan/verify', panForm);
      setActiveStep(null);
      setPanForm({ pan: '', name: '' });
      loadStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string | undefined) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-500 mt-1">
          Verify your identity — only cryptographic hashes are stored, never raw documents
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-primary-700" />
          <div>
            <p className="font-medium text-gray-900">
              Overall Status: {kycStatus.overallStatus}
            </p>
            <p className="text-sm text-gray-500">
              Complete any provider to enable KYC attestation proofs
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {providers.map((p) => {
          const status = getProviderStatus(p.id);
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {statusIcon(status?.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {p.name}{' '}
                      <span className="text-xs text-gray-400 ml-1">
                        Level {p.level}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">{p.description}</p>
                    {status?.attestationHash && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        Attestation: {status.attestationHash.slice(0, 24)}...
                      </p>
                    )}
                  </div>
                </div>
                {status?.status !== 'VERIFIED' && (
                  <button
                    onClick={() => {
                      if (p.id === 'AADHAAR') initiateAadhaar();
                      else if (p.id === 'PAN') setActiveStep('PAN');
                      else if (p.id === 'DIGILOCKER') {
                        api.get<any>('/ekyc/digilocker/auth-url').then((r) => {
                          window.open(r.authorizationUrl, '_blank');
                        });
                      }
                    }}
                    disabled={loading}
                    className="text-sm bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50"
                  >
                    Verify
                  </button>
                )}
              </div>

              {/* Aadhaar OTP step */}
              {activeStep === 'AADHAAR_OTP' && p.id === 'AADHAAR' && (
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-40"
                  />
                  <button
                    onClick={verifyAadhaarOtp}
                    disabled={loading || otpInput.length !== 6}
                    className="bg-accent-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Submit OTP'}
                  </button>
                </div>
              )}

              {/* PAN step */}
              {activeStep === 'PAN' && p.id === 'PAN' && (
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={10}
                    value={panForm.pan}
                    onChange={(e) =>
                      setPanForm({ ...panForm, pan: e.target.value.toUpperCase() })
                    }
                    placeholder="PAN Number"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-36"
                  />
                  <input
                    type="text"
                    value={panForm.name}
                    onChange={(e) =>
                      setPanForm({ ...panForm, name: e.target.value })
                    }
                    placeholder="Name as on PAN"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-48"
                  />
                  <button
                    onClick={verifyPan}
                    disabled={loading || !panForm.pan || !panForm.name}
                    className="bg-accent-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify PAN'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
