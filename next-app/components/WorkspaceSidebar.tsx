'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeIndianRupee,
  Calculator,
  FileText,
  House,
  Info,
  Landmark,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  WalletCards,
} from 'lucide-react';
import { getCurrentTheme, subscribeToThemeChange, toggleTheme, type Theme } from '../services/theme';

interface WorkspaceSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeRoute: string;
}

const menuItems = [
  { name: 'Portfolio', path: '/planner', icon: WalletCards },
  { name: 'Quick calculator', path: '/calculator', icon: Calculator },
  { name: 'Optimizer', path: '/planner/optimizer', icon: Sparkles },
  { name: 'Report preview', path: '/sample-report', icon: FileText },
  { name: 'Pricing', path: '/pricing', icon: BadgeIndianRupee },
  { name: 'About', path: '/about', icon: Info },
];

export default function WorkspaceSidebar({ collapsed, onToggleCollapse, activeRoute }: WorkspaceSidebarProps) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getCurrentTheme());
    return subscribeToThemeChange(setTheme);
  }, []);

  return (
    <aside className={`workspace-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="workspace-brand-row">
        <Link href="/" className="workspace-brand" aria-label="Back to home">
          <span><Landmark size={18} /></span>
          {!collapsed && <strong>Loan Planner</strong>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="workspace-icon-button sidebar-collapse"
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="workspace-navigation" aria-label="Workspace navigation">
        <span className="workspace-nav-label">Workspace</span>
        {menuItems.map((item) => {
          const active = activeRoute === item.path || (item.path !== '/planner' && activeRoute.startsWith(`${item.path}/`));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={active ? 'active' : undefined}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.name : undefined}
            >
              <item.icon size={18} aria-hidden="true" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="workspace-sidebar-footer">
        <Link href="/" className="workspace-home-link" title={collapsed ? 'Home' : undefined}>
          <House size={17} />
          {!collapsed && <span>Back to home</span>}
        </Link>
        <button
          type="button"
          onClick={() => setTheme(toggleTheme())}
          className="workspace-theme-button"
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>}
        </button>
      </div>
    </aside>
  );
}
