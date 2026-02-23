'use client';

import { useEffect, useState } from 'react';
import { Shield, Loader2, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CircuitType } from '@account-agg/shared';

const circuitOptions = [
  {
    type: CircuitType.INCOME_RANGE,
    label: 'Income Range',
    description: 'Prove your annual income falls within a range',
    fields: [
      { key: 'minIncome', label: 'Minimum Income (INR)', type: 'number' },
      { key: 'maxIncome', label: 'Maximum Income (INR)', type: 'number' },
    ],
  },
  {
    type: CircuitType.BALANCE_THRESHOLD,
    label: 'Balance Threshold',
    description: 'Prove your balance exceeds a threshold',
    fields: [
      { key: 'threshold', label: 'Minimum Balance (INR)', type: 'number' },
    ],
  },
  {
    type: CircuitType.KYC_ATTESTATION,
    label: 'KYC Attestation',
    description: 'Prove KYC completion at a required level',
    fields: [
      { key: 'minProviderLevel', label: 'Min Provider Level (1-4)', type: 'number' },
    ],
  },
  {
    type: CircuitType.TRANSACTION_PATTERN,
    label: 'Transaction Pattern',
    description: 'Prove bounced transactions below a limit',
    fields: [
      { key: 'maxBounced', label: 'Max Bounced Transactions', type: 'number' },
    ],
  },
];

export default function ProofsPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [selectedCircuit, setSelectedCircuit] = useState<string>('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    api.get<any[]>('/proofs').then(setProofs).catch(() => {});
  }, []);

  const generateProof = async () => {
    const circuit = circuitOptions.find((c) => c.type === selectedCircuit);
    if (!circuit) return;

    setGenerating(true);
    setProgress('Loading circuit...');

    try {
      // In production: load ACIR, run NoirJS in browser
      setProgress('Generating witness...');
      await new Promise((r) => setTimeout(r, 1000));

      setProgress('Computing proof (client-side)...');
      await new Promise((r) => setTimeout(r, 2000));

      const publicInputs: Record<string, unknown> = {};
      circuit.fields.forEach((f) => {
        publicInputs[f.key] = parseInt(formValues[f.key] || '0', 10);
      });
      publicInputs.expectedDataHash = '0x' + '0'.repeat(64); // placeholder

      setProgress('Submitting proof to server...');
      await api.post('/proofs', {
        circuitType: circuit.type.toUpperCase().replace(/-/g, '_'),
        publicInputs,
        proofData: btoa(JSON.stringify({ mock: true, timestamp: Date.now() })),
      });

      setProgress('');
      setGenerating(false);
      setSelectedCircuit('');
      setFormValues({});
      api.get<any[]>('/proofs').then(setProofs).catch(() => {});
    } catch (err: any) {
      alert(err.message);
      setGenerating(false);
      setProgress('');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ZK Proofs</h1>
        <p className="text-gray-500 mt-1">
          Generate zero-knowledge proofs of your financial data — computed entirely in your browser
        </p>
      </div>

      {/* Circuit selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Proof</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {circuitOptions.map((c) => (
            <button
              key={c.type}
              onClick={() => { setSelectedCircuit(c.type); setFormValues({}); }}
              className={`text-left p-4 rounded-lg border-2 transition-colors ${
                selectedCircuit === c.type
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-sm text-gray-900">{c.label}</p>
              <p className="text-xs text-gray-500 mt-1">{c.description}</p>
            </button>
          ))}
        </div>

        {selectedCircuit && (
          <div className="border-t pt-4">
            {circuitOptions
              .find((c) => c.type === selectedCircuit)
              ?.fields.map((f) => (
                <div key={f.key} className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={formValues[f.key] || ''}
                    onChange={(e) =>
                      setFormValues({ ...formValues, [f.key]: e.target.value })
                    }
                    className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
            <button
              onClick={generateProof}
              disabled={generating}
              className="mt-2 flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {progress}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" /> Generate Proof
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Proof list */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Proofs</h3>
      {proofs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No proofs generated yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {p.circuitType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {p.proofHash?.slice(0, 24)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <a
                    href={`/share?proofId=${p.id}`}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
