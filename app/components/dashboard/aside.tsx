"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  RiDashboardLine,
  RiBuilding2Line,
  RiShieldCheckLine,
  RiExchangeDollarLine,
  RiUserLine,
  RiUserSettingsLine,
  RiFileListLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiSettings3Line,
  RiCloseLine,
} from "react-icons/ri";
import { GoChevronDown } from "react-icons/go";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AdminInfo {
  name: string;
  email: string;
  role: string;
  role_label: string;
  permissions: string[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  badge?: number | null;
  children?: { label: string; href: string; permission?: string }[];
}

// ─────────────────────────────────────────────────────────
// Nav Config
// ─────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: RiDashboardLine,
  },
  {
    label: "Businesses",
    href: "/dashboard/businesses",
    icon: RiBuilding2Line,
    permission: "view_businesses",
    children: [
      {
        label: "All Businesses",
        href: "/dashboard/businesses",
        permission: "view_businesses",
      },
      {
        label: "KYC Review",
        href: "/dashboard/businesses?status=under_review",
        permission: "approve_kyc",
      },
      {
        label: "Suspended",
        href: "/dashboard/businesses?status=suspended",
        permission: "suspend_business",
      },
    ],
  },
  // {
  //   label: "Transactions",
  //   href: "/dashboard/transactions",
  //   icon: RiExchangeDollarLine,
  //   permission: "view_transactions",
  // },
  // {
  //   label: "Users",
  //   href: "/dashboard/users",
  //   icon: RiUserLine,
  //   permission: "view_users",
  // },
  // {
  //   label: "Activity Logs",
  //   href: "/dashboard/activity-logs",
  //   icon: RiFileListLine,
  //   permission: "manage_admins",
  // },
  {
    label: "Manage Admins",
    href: "/dashboard/admins",
    icon: RiUserSettingsLine,
    permission: "manage_admins",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: RiSettings3Line,
    children: [
      {
        label: "Fees",
        href: "/dashboard/settings/fees",
        permission: "manage_fees",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────
export default function AdminSidebar() {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Fetch admin info ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        const json = await res.json();
        setAdmin(json.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // ── Auto-expand active parent ──────────────────────────
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const hasActive = item.children.some((c) =>
          pathname.startsWith(c.href.split("?")[0]),
        );
        if (hasActive) setExpanded(item.label);
      }
    });
  }, [pathname]);

  // ── Close mobile on route change ──────────────────────
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Permission helper ──────────────────────────────────
  const can = (permission?: string) => {
    if (!permission) return true;
    return admin?.permissions.includes(permission) ?? false;
  };

  // ── Logout ────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  // ── Is active ─────────────────────────────────────────
  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(base);
  };

  // ── Initials ──────────────────────────────────────────
  const initials = admin
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";

  // ─────────────────────────────────────────────────────
  // Nav Items renderer
  // ─────────────────────────────────────────────────────
  const renderNav = () =>
    NAV_ITEMS.filter((item) => can(item.permission)).map((item) => {
      const active = isActive(item.href);
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expanded === item.label;
      const visibleChildren =
        item.children?.filter((c) => can(c.permission)) ?? [];

      if (hasChildren && visibleChildren.length > 0) {
        return (
          <div key={item.label}>
            {/* Parent */}
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : item.label)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                active
                  ? "bg-accent text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="text-[14px] font-medium flex-1">
                {item.label}
              </span>
              <GoChevronDown
                size={14}
                className={clsx(
                  "shrink-0 transition-transform",
                  isExpanded ? "rotate-180" : "",
                )}
              />
            </button>

            {/* Children */}
            {isExpanded && (
              <div className="mt-1 ml-6 flex flex-col gap-0.5 border-l border-gray-200 pl-3">
                {visibleChildren.map((child) => (
                  <a
                    key={child.href}
                    href={child.href}
                    className={clsx(
                      "text-[13px] px-3 py-2 rounded-lg transition-colors",
                      isActive(child.href)
                        ? "text-accent font-semibold"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <a
          key={item.href}
          href={item.href}
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
            active
              ? "bg-accent text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <item.icon size={18} className="shrink-0" />
          <span className="text-[14px] font-medium flex-1">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span
              className={clsx(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                active ? "bg-white/20 text-white" : "bg-accent text-white",
              )}
            >
              {item.badge}
            </span>
          )}
        </a>
      );
    });

  // ─────────────────────────────────────────────────────
  // Sidebar content (shared between mobile + desktop)
  // ─────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <RiShieldCheckLine size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-900 leading-none">
              DuraPayment
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {admin
          ? renderNav()
          : // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 rounded-xl animate-pulse"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
      </nav>

      {/* Admin profile + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        {/* Profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-[12px] font-bold text-accent shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-gray-900 truncate">
              {admin?.name ?? "—"}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {admin?.role_label ?? "—"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <RiLogoutBoxLine size={17} className="shrink-0" />
          <span className="text-[14px] font-medium">
            {loggingOut ? "Signing out..." : "Sign out"}
          </span>
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-100">
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <RiShieldCheckLine size={14} className="text-white" />
          </div>
          <p className="text-[14px] font-bold text-gray-900">
            DuraPayment Admin
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <RiMenuLine size={20} />
        </button>
      </div>

      {/* ── Mobile Drawer ────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <RiCloseLine size={20} />
            </button>
            <SidebarContent />
          </div>
        </>
      )}

      {/* ── Mobile spacer (pushes content below top bar) ── */}
      <div className="lg:hidden h-14 shrink-0" />
    </>
  );
}
