'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function SharePage() {
  const [shares, setShares] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    proofId: '',
    recipientId: '',
    purpose: '',
    expiresInHours: '72',
    maxAccess: '10',
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    loadShares();
    api.get<any[]>('/proofs').then(setProofs).catch(() => {});
  }, []);

  const loadShares = () => {
    api.get<any[]>('/share').then(setShares).catch(() => {});
  };

  const createShare = async () => {
    setLoading(true);
    try {
      await api.post('/share', {
        proofId: form.proofId,
        recipientId: form.recipientId,
        purpose: form.purpose,
        expiresInHours: parseInt(form.expiresInHours, 10),
        maxAccess: parseInt(form.maxAccess, 10),
      });
      setShowCreate(false);
      setForm({ proofId: '', recipientId: '', purpose: '', expiresInHours: '72', maxAccess: '10' });
      loadShares();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (id: string) => {
    if (!confirm('Revoke this share?')) return;
    try {
      await api.del(`/share/${id}`);
      loadShares();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToken = (token: string) => {
    const url = `${window.location.origin}/api/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proof Sharing</h1>
          <p className="text-gray-500 mt-1">
            Share verified ZK proofs with third parties — they see proof metadata, never raw data
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800"
        >
          <Share2 className="w-4 h-4" />
          New Share
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Share</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proof</label>
              <select
                value={form.proofId}
                onChange={(e) => setForm({ ...form, proofId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select a proof...</option>
                {proofs.filter((p) => p.verified).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.circuitType.replace(/_/g, ' ')} — {p.proofHash?.slice(0, 12)}...
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient ID</label>
              <input
                type="text"
                value={form.recipientId}
                onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
                placeholder="e.g., lender-xyz, insurer-abc"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <input
                type="text"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g., Loan application"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires (hours)
                </label>
                <input
                  type="number"
                  value={form.expiresInHours}
                  onChange={(e) => setForm({ ...form, expiresInHours: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Access
                </label>
                <input
                  type="number"
                  value={form.maxAccess}
                  onChange={(e) => setForm({ ...form, maxAccess: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={createShare}
              disabled={loading || !form.proofId || !form.recipientId || !form.purpose}
              className="bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Share'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {shares.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shares yet</h3>
          <p className="text-gray-500">Share a verified proof with a third party</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((s) => {
            const isExpired = new Date(s.expiresAt) < new Date();
            const isRevoked = !!s.revokedAt;
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isRevoked ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : isExpired ? (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {s.proof?.circuitType?.replace(/_/g, ' ')} → {s.recipientId}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.purpose} | Access: {s.accessCount}/{s.maxAccess} |
                        Expires: {new Date(s.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToken(s.shareToken)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy share URL"
                    >
                      <Copy className={`w-4 h-4 ${copied === s.shareToken ? 'text-green-500' : ''}`} />
                    </button>
                    {!isRevoked && (
                      <button
                        onClick={() => revokeShare(s.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
