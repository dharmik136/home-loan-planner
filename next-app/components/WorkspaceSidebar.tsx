'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentTheme, subscribeToThemeChange, toggleTheme, type Theme } from '../services/theme';

interface WorkspaceSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeRoute: string;
}

export default function WorkspaceSidebar({
  collapsed,
  onToggleCollapse,
  activeRoute,
}: WorkspaceSidebarProps) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getCurrentTheme());
    return subscribeToThemeChange(setTheme);
  }, []);
  const menuItems = [
    { name: 'Calculator', path: '/calculator', icon: '🧮' },
    { name: 'Portfolio Planner', path: '/planner', icon: '📋' },
    { name: 'Windfall Optimizer', path: '/planner/optimizer', icon: '⚡' },
    { name: 'Pricing', path: '/pricing', icon: '💰' },
    { name: 'About', path: '/about', icon: 'ℹ️' },
  ];

  return (
    <aside
      className={`flex flex-col border-r bg-muted/30 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } h-screen sticky top-0`}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b">
        {!collapsed && (
          <span className="font-bold text-sm tracking-tight text-foreground truncate">
            Workspace
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-muted-foreground/15 text-muted-foreground hover:text-foreground ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const isActive = activeRoute === item.path || activeRoute.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground'
              }`}
            >
              <span className="text-base" role="img" aria-label={item.name}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t flex flex-col gap-2">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center truncate">
            The Prepayment Ledger v1.0
          </div>
        )}
        <button
          onClick={() => setTheme(toggleTheme())}
          className="flex items-center justify-center w-full py-1.5 text-xs border rounded hover:bg-accent text-accent-foreground font-medium"
          title={theme === 'dark' ? 'Switch to Day' : 'Switch to Lamplight'}
        >
          {theme === 'dark' ? (collapsed ? '☀️' : '☀️ Day Mode') : (collapsed ? '🌙' : '🌙 Lamplight')}
        </button>
      </div>
    </aside>
  );
}
