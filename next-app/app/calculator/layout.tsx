'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import WorkspaceSidebar from '../../components/WorkspaceSidebar';

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="workspace-shell">
      <WorkspaceSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activeRoute={pathname || '/calculator'}
      />
      <main className="workspace-content">
        {children}
      </main>
    </div>
  );
}
