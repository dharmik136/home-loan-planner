import React from 'react';
import Header from '../components/Header';
import '../app/globals.css'; // Mock importing global styles

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
    <html lang="en" className="h-full">
      <body className="h-full font-sans antialiased bg-background text-foreground">
        <div className="relative flex flex-col min-h-screen">
          {/* Header is included globally but page content can choose to hide/show details */}
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
