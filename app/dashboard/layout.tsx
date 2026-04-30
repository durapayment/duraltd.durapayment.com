"use client";

import { useState } from "react";
import { AsideBar } from "../components/dashboard/aside";
import { Navbar } from "../components/dashboard/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-svh flex flex-col bg-dashboard-background text-dashboard-foreground overflow-hidden">
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <div
          className={`absolute inset-y-0 left-0 z-20 h-full  transition-transform duration-300 ease-in-out ${
            isOpen ? "md:translate-x-0 -translate-x-full" : "-translate-x-full"
          }`}
        >
          <AsideBar />
        </div>

        {/* Main content */}
        <div
          className={`flex-1 ${isOpen ? "md:ml-64" : "ml-0"} px-4 flex flex-col h-full transition-all duration-300 ease-in-out`}
        >
          <Navbar onMenuClick={() => setIsOpen((prev) => !prev)} />
          <main className="flex-1 scrollbar-hide overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
