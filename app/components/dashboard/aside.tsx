"use client";

import { Avatar } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoClose } from "react-icons/io5"; // ← Add this
import {
  RiCustomerServiceLine,
  RiFileHistoryLine,
  RiHome6Line,
  RiNotificationBadgeLine,
  RiRecordCircleLine,
  RiSettings3Line,
  RiShieldKeyholeLine,
  RiShoppingBag3Line,
  RiWallet3Line,
} from "react-icons/ri";

export const AsideBar = ({ onClose }: { onClose?: () => void }) => {
  const pathName = usePathname();
  const listObject = {
    Dashboard: [
      {
        title: "Dashboard",
        icon: <RiHome6Line size={20} />,
        path: "/dashboard",
      },
      {
        title: "Accounts",
        icon: <RiWallet3Line size={20} />,
        path: "/dashboard/accounts",
      },
      {
        title: "History",
        icon: <RiFileHistoryLine size={20} />,
        path: "/dashboard/history",
      },
      {
        title: "Customers",
        icon: <RiShoppingBag3Line size={20} />,
        path: "/dashboard/customers",
      },
    ],
    Integration: [
      {
        title: "Webhooks",
        icon: <RiNotificationBadgeLine size={20} />,
        path: "/dashboard/webhooks",
      },
      {
        title: "Credentials",
        icon: <RiShieldKeyholeLine size={20} />,
        path: "/dashboard/credentials",
      },
    ],
    General: [
      {
        title: "Logs",
        icon: <RiRecordCircleLine size={20} />,
        path: "/dashboard/logs",
      },
      {
        title: "Settings",
        icon: <RiSettings3Line size={20} />,
        path: "/dashboard/settings",
      },
      {
        title: "Help",
        icon: <RiCustomerServiceLine size={20} />,
        path: "/dashboard/help",
      },
    ],
  };

  return (
    <aside className="h-full flex flex-col w-full px-5 py-5">
      {/* Close button - visible only on mobile */}

      {/* Profile Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <Avatar.Image
              alt="John Doe"
              src="https://img.heroui.chat/image/avatar?w=400&h=400&u=8"
            />
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col leading-4">
            <p className="text-[14px] font-semibold">John Doe</p>
            <p className="text-[12px] opacity-75">JS839MS1</p>
          </div>
        </div>
        {onClose && (
          <div className="flex justify-end md:hidden mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-dashboard-hover"
            >
              <IoClose size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="mt-8 overflow-y-auto scrollbar-hide flex-1 flex flex-col gap-6">
        {Object.entries(listObject).map(([section, items]) => (
          <div key={section}>
            <p className="text-xs text-gray-500 uppercase mb-2">{section}</p>
            <ul className="flex flex-col gap-1">
              {items?.map((item) => (
                <Link
                  href={item.path}
                  key={item.title}
                  onClick={onClose} // Close drawer when link is clicked on mobile
                  className={`flex px-4 py-2 rounded-full hover:bg-dashboard-hover items-center gap-3 text-[15px] cursor-pointer ${
                    pathName === item.path ? "bg-dashboard-hover" : ""
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};
