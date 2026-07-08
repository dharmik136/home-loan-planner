'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import WorkspaceSidebar from '../../components/WorkspaceSidebar';

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar navigation */}
      <WorkspaceSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activeRoute={pathname || '/planner'}
      />
      {/* Page content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
