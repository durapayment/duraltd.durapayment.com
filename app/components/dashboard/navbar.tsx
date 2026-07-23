"use client";

import { useState, useEffect } from "react";
import { RiNotification4Line, RiSearch2Line } from "react-icons/ri";

interface AdminInfo {
  name: string;
  role_label: string;
}

export function Navbar() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) return;
        const json = await res.json();
        setAdmin(json.data);
      } catch (e) {
        console.error("Failed to fetch admin:", e);
      }
    })();
  }, []);

  // ── Current page title from URL ────────────────────────
  const getPageTitle = (): string => {
    if (typeof window === "undefined") return "Dashboard";
    const path = window.location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path.includes("/businesses")) return "Businesses";
    if (path.includes("/transactions")) return "Transactions";
    if (path.includes("/users")) return "Users";
    if (path.includes("/admins")) return "Manage Admins";
    if (path.includes("/activity-logs")) return "Activity Logs";
    return "Dashboard";
  };

  return (
    <nav className="w-full h-16 flex justify-between items-center px-4 sm:px-6 border-b bg-dashboard-background shrink-0">
      {/* ── Left — page title ─────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <p className="text-[18px] font-bold text-gray-900 truncate">
          {getPageTitle()}
        </p>
      </div>

      {/* ── Right — actions + admin info ──────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search */}
        <button
          type="button"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Search"
        >
          <RiSearch2Line size={18} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors relative"
          title="Notifications"
        >
          <RiNotification4Line size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Admin info */}
        {admin && (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-[12px] font-bold text-accent shrink-0">
              {admin.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-gray-900 leading-none">
                {admin.name}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {admin.role_label}
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
