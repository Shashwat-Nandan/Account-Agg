'use client';

import { useEffect, useState } from 'react';
import { Wallet, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export default function AccountsPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/fi-data/sessions').then(setSessions).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Linked Accounts</h1>
        <p className="text-gray-500 mt-1">
          Accounts linked via Account Aggregator consents
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No accounts linked yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create a consent to link your financial accounts
          </p>
          <a
            href="/consents"
            className="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800"
          >
            Create Consent <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Session: {s.id.slice(0, 12)}...
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.consent?.fiTypes?.join(', ') || 'N/A'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
