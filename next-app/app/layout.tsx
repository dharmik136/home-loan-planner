import React from 'react';
import { Prata, Lora, Kalam } from 'next/font/google';
import Header from '../components/Header';
import '../app/globals.css'; // Mock importing global styles

const prata = Prata({ subsets: ['latin'], weight: '400', variable: '--font-prata' });
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-lora' });
const kalam = Kalam({ subsets: ['latin'], weight: '700', variable: '--font-kalam' });

export const metadata = {
  title: 'The Prepayment Ledger',
  description: 'Track, optimize, and roll over your loans to become debt-free faster.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${prata.variable} ${lora.variable} ${kalam.variable}`}>
      <body className="h-full font-body antialiased bg-background text-foreground">
        <div className="relative flex flex-col min-h-screen">
          {/* Header is included globally but page content can choose to hide/show details */}
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
