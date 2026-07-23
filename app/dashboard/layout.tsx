"use client";

import AdminSidebar from "../components/dashboard/aside";
import { Navbar } from "../components/dashboard/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-svh flex bg-dashboard-background overflow-hidden">
      {/* ── Sidebar (handles mobile + desktop internally) ── */}
      <AdminSidebar />

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
