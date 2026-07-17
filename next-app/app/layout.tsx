import React from 'react';
import { Manrope, Source_Serif_4 } from 'next/font/google';
import Header from '../components/Header';
import { ThemeInit } from '../components/ThemeInit';
import '../app/globals.css';
import '../app/experience.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://home-loan-planner-neon.vercel.app';
const themeScript = `
  try {
    const stored = localStorage.getItem('khata-theme');
    const theme = stored === 'dark' || stored === 'light'
      ? stored
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Prepayment Ledger',
    template: '%s | The Prepayment Ledger',
  },
  description: 'Model Indian home-loan prepayments, compare payoff strategies, and build a debt-free plan.',
  applicationName: 'The Prepayment Ledger',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'The Prepayment Ledger',
    description: 'Model Indian home-loan prepayments and build a clear debt-free plan.',
    siteName: 'The Prepayment Ledger',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${manrope.variable} ${sourceSerif.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="h-full antialiased bg-background text-foreground">
        <ThemeInit />
        <div className="relative flex flex-col min-h-screen">
          <Header />
          <div className="flex-grow flex flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
