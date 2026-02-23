'use client';

import { useEffect, useState } from 'react';
import { FileCheck, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CONSENT_TEMPLATES } from '@account-agg/shared';

export default function ConsentsPage() {
  const [consents, setConsents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vua: '',
    templateId: '',
    dataRangeFrom: '',
    dataRangeTo: '',
  });

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = () => {
    api.get<any[]>('/consents').then(setConsents).catch(() => {});
  };

  const createConsent = async () => {
    const template = CONSENT_TEMPLATES.find((t) => t.id === form.templateId);
    if (!template) return;

    setLoading(true);
    try {
      await api.post('/consents', {
        vua: form.vua,
        fiTypes: template.fiTypes,
        purpose: template.purposeText,
        purposeCode: template.purposeCode,
        dataRangeFrom: form.dataRangeFrom,
        dataRangeTo: form.dataRangeTo,
        fetchType: template.fetchType,
        consentMode: template.consentMode,
      });
      setShowCreate(false);
      setForm({ vua: '', templateId: '', dataRangeFrom: '', dataRangeTo: '' });
      loadConsents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeConsent = async (id: string) => {
    if (!confirm('Revoke this consent?')) return;
    try {
      await api.del(`/consents/${id}`);
      loadConsents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-blue-100 text-blue-700',
    REVOKED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consent Management</h1>
          <p className="text-gray-500 mt-1">Manage your data sharing consents</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800"
        >
          <Plus className="w-4 h-4" />
          New Consent
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Consent</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Virtual User Address (VUA)
              </label>
              <input
                type="text"
                value={form.vua}
                onChange={(e) => setForm({ ...form, vua: e.target.value })}
                placeholder="user@aa-provider"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose Template
              </label>
              <select
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a template...</option>
                {CONSENT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data From
              </label>
              <input
                type="date"
                value={form.dataRangeFrom}
                onChange={(e) => setForm({ ...form, dataRangeFrom: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data To
              </label>
              <input
                type="date"
                value={form.dataRangeTo}
                onChange={(e) => setForm({ ...form, dataRangeTo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={createConsent}
              disabled={loading || !form.vua || !form.templateId}
              className="bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Consent'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {consents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No consents yet</h3>
          <p className="text-gray-500">Create your first consent to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consents.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[c.status] || ''}`}>
                      {c.status}
                    </span>
                    <span className="text-sm text-gray-500">{c.vua}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{c.purpose}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    FI Types: {c.fiTypes?.join(', ')} | Created: {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.approvalUrl && c.status === 'PENDING' && (
                    <a
                      href={c.approvalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {c.status !== 'REVOKED' && (
                    <button
                      onClick={() => revokeConsent(c.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
