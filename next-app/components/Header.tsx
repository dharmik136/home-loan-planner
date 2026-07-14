'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentTheme, subscribeToThemeChange, toggleTheme, type Theme } from '../services/theme';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock user session state
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getCurrentTheme());
    return subscribeToThemeChange(setTheme);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-double border-primary bg-background">
      <div className="container flex h-14 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
            <span className="text-primary font-display">The Prepayment Ledger</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/calculator" className="transition-colors hover:text-foreground text-muted-foreground">
            Single Simulator
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground text-muted-foreground">
            Pricing
          </Link>
          <Link href="/sample-report" className="transition-colors hover:text-foreground text-muted-foreground">
            Sample Report
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground text-muted-foreground">
            About
          </Link>
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setIsLoggedIn(!isLoggedIn)} 
              className="text-xs text-muted-foreground mr-2 hover:underline"
              title="Click to toggle mock auth state"
            >
              [Mock Auth: {isLoggedIn ? 'LoggedIn' : 'LoggedOut'}]
            </button>
            {isLoggedIn ? (
              <Link 
                href="/planner" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-9 px-4 py-2"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button 
                onClick={() => setIsLoggedIn(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Sign In
              </button>
            )}
          </div>

          <button
            onClick={() => setTheme(toggleTheme())}
            className="inline-flex items-center justify-center rounded-md p-2 text-sm border border-border hover:bg-accent"
            title={theme === 'dark' ? 'Switch to Day' : 'Switch to Lamplight'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
            aria-label="Toggle Menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-3">
          <Link href="/calculator" onClick={toggleMobileMenu} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
            Single Simulator
          </Link>
          <Link href="/pricing" onClick={toggleMobileMenu} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/sample-report" onClick={toggleMobileMenu} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
            Sample Report
          </Link>
          <Link href="/about" onClick={toggleMobileMenu} className="block text-sm font-medium text-muted-foreground hover:text-foreground">
            About
          </Link>
          <hr />
          <div className="flex flex-col gap-2 pt-1">
            {isLoggedIn ? (
              <Link 
                href="/planner" 
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground h-9 px-4 py-2"
              >
                Go to Dashboard
              </Link>
            ) : (
              <button 
                onClick={() => { setIsLoggedIn(true); toggleMobileMenu(); }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
