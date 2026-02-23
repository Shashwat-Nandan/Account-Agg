import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Account Aggregator — Privacy-First Financial Data',
  description:
    'Share financial proofs without revealing raw data using zero-knowledge proofs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
