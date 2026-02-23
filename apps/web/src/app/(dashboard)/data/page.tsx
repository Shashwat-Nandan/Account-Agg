'use client';

import { useEffect, useState } from 'react';
import { Database, Download } from 'lucide-react';
import { api } from '@/lib/api';

export default function DataPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<any[]>('/fi-data/sessions').then(setSessions).catch(() => {});
  }, []);

  const viewData = async (sessionId: string) => {
    setLoading(true);
    try {
      const data = await api.get<any>(`/fi-data/sessions/${sessionId}`);
      setSelectedData(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Data</h1>
        <p className="text-gray-500 mt-1">
          Fetched financial data from your consents (encrypted at rest)
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
          <p className="text-gray-500">
            Financial data appears here after consent approval and data fetch
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => viewData(s.id)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-primary-300 transition-colors"
              >
                <p className="font-medium text-sm text-gray-900 truncate">
                  {s.consent?.purpose || 'Data Session'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {s.consent?.fiTypes?.join(', ')}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {s.status}
                  </span>
                  {s.fetchedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(s.fetchedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : selectedData ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Session Data
                  </h3>
                  <div className="text-xs text-gray-500 font-mono">
                    Hash: {selectedData.dataHash?.slice(0, 16)}...
                  </div>
                </div>
                <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-auto max-h-96">
                  {JSON.stringify(selectedData.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Select a session to view data</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
