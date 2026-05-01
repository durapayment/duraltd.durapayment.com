"use client";

import { useState } from "react";
import { AsideBar } from "../components/dashboard/aside";
import { Navbar } from "../components/dashboard/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop sidebar

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="h-svh flex flex-col bg-dashboard-background overflow-hidden">
      <div className="flex flex-1 relative overflow-hidden">
        {/* ====================== DESKTOP SIDEBAR ====================== */}
        <div
          className={`hidden md:block h-full border-r transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-60" : "w-0 overflow-hidden"
          }`}
        >
          <AsideBar />
        </div>

        {/* ====================== MOBILE DRAWER ====================== */}
        {/* Backdrop */}
        {isDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-950 border-r shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AsideBar onClose={() => setIsDrawerOpen(false)} />
        </div>

        {/* ====================== MAIN CONTENT ====================== */}
        <div
          className={`flex-1 flex flex-col h-full transition-all duration-300 `}
        >
          <Navbar
            onMenuClick={toggleDrawer} // Mobile: opens drawer
            onSidebarToggle={toggleSidebar} // Desktop: collapses sidebar
          />

          <main className="flex-1 overflow-y-auto scrollbar-hide p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
