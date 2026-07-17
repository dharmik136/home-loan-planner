'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Landmark, Menu, Moon, Sun, X } from 'lucide-react';
import { getCurrentTheme, subscribeToThemeChange, toggleTheme, type Theme } from '../services/theme';

const navigation = [
  { href: '/planner', label: 'Portfolio planner' },
  { href: '/calculator', label: 'Quick calculator' },
  { href: '/sample-report', label: 'Report preview' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const pathname = usePathname();

  useEffect(() => {
    setTheme(getCurrentTheme());
    return subscribeToThemeChange(setTheme);
  }, []);

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  if (pathname?.startsWith('/planner') || pathname?.startsWith('/calculator')) {
    return null;
  }

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link href="/" className="public-brand" aria-label="The Prepayment Ledger home">
          <span className="public-brand-mark" aria-hidden="true"><Landmark size={19} /></span>
          <span className="public-brand-copy">
            <strong>The Prepayment Ledger</strong>
            <small>Independent payoff planning</small>
          </span>
        </Link>

        <nav className="public-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'active' : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="public-actions">
          <button
            type="button"
            onClick={() => setTheme(toggleTheme())}
            className="icon-button"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/planner" className="header-cta">
            Open planner <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="icon-button mobile-menu-button"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          <Link href="/privacy">Privacy</Link>
        </nav>
      )}
    </header>
  );
}
