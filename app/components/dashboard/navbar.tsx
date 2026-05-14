"use client";

import { User, authService } from "@/app/lib/auth";
import { useState, useEffect } from "react";
import { IoMenuOutline } from "react-icons/io5";
import { LuPanelLeftClose } from "react-icons/lu";
import { RiNotification4Line, RiSearch2Line } from "react-icons/ri";

export function Navbar({
  onMenuClick,
  onSidebarToggle,
}: {
  onMenuClick: () => void;
  onSidebarToggle?: () => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const fetchUser = async () => {
    try {
      const { isAuthenticated, user, business, summary } =
        await authService.checkAuth();

      if (isAuthenticated && user) {
        setUser(user);
        setBusiness(business);
        setSummary(summary);
        // console.log("Business fetched:", business);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);
  return (
    <nav className="w-full h-16 flex justify-between items-center px-4 border-b bg-dashboard-background">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Desktop collapse button */}
        <LuPanelLeftClose
          onClick={onSidebarToggle}
          size={20}
          className="hidden md:flex cursor-pointer hover:text-primary"
        />

        {/* Mobile Hamburger - Opens Full Screen Drawer */}
        <IoMenuOutline
          size={24}
          className="md:hidden cursor-pointer"
          onClick={onMenuClick}
        />

        <p className="text-[20px] leading-7 font-bold truncate max-w-50 sm:max-w-none">
          Hello, <span className="capitalize">{business?.business_name}</span>
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-dashboard-hover cursor-pointer">
          <RiSearch2Line size={20} />
        </div>
        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-dashboard-hover cursor-pointer">
          <RiNotification4Line size={20} />
        </div>
      </div>
    </nav>
  );
}
