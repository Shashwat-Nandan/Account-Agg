'use client';

import { useEffect, useState } from 'react';
import { FileCheck, Wallet, Shield, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  activeConsents: number;
  linkedAccounts: number;
  generatedProofs: number;
  kycStatus: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeConsents: 0,
    linkedAccounts: 0,
    generatedProofs: 0,
    kycStatus: 'NOT_STARTED',
  });

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/consents').catch(() => []),
      api.get<any[]>('/proofs').catch(() => []),
      api.get<any>('/ekyc/status').catch(() => ({ overallStatus: 'NOT_STARTED' })),
    ]).then(([consents, proofs, kyc]) => {
      setStats({
        activeConsents: consents.filter((c: any) => c.status === 'ACTIVE').length,
        linkedAccounts: consents.length,
        generatedProofs: proofs.length,
        kycStatus: kyc.overallStatus,
      });
    });
  }, []);

  const cards = [
    {
      label: 'Active Consents',
      value: stats.activeConsents,
      icon: FileCheck,
      color: 'bg-blue-500',
    },
    {
      label: 'Linked Accounts',
      value: stats.linkedAccounts,
      icon: Wallet,
      color: 'bg-purple-500',
    },
    {
      label: 'Generated Proofs',
      value: stats.generatedProofs,
      icon: Shield,
      color: 'bg-accent-500',
    },
    {
      label: 'KYC Status',
      value: stats.kycStatus,
      icon: UserCheck,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">
          Your privacy-preserving financial data dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-700 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900">Link Accounts</h4>
            <p className="text-sm text-gray-500 mt-1">
              Create consent to fetch your financial data via Account Aggregator
            </p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-accent-700 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900">Generate ZK Proofs</h4>
            <p className="text-sm text-gray-500 mt-1">
              Prove financial facts in your browser without exposing raw data
            </p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-700 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900">Share Securely</h4>
            <p className="text-sm text-gray-500 mt-1">
              Share cryptographic proofs with lenders, insurers, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
