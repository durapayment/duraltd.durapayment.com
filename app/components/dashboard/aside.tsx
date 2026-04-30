import { Avatar } from "@heroui/react";
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

export const AsideBar = () => {
  const listObject = {
    Dashboard: [
      {
        title: "Dashboard",
        icon: <RiHome6Line size={20} />,
      },
      {
        title: "Accounts",
        icon: <RiWallet3Line size={20} />,
      },
      {
        title: "History",
        icon: <RiFileHistoryLine size={20} />,
      },
      {
        title: "Customers",
        icon: <RiShoppingBag3Line size={20} />,
      },
    ],
    Integration: [
      {
        title: "Webhooks",
        icon: <RiNotificationBadgeLine size={20} />,
      },
      {
        title: "Credentials",
        icon: <RiShieldKeyholeLine size={20} />,
      },
    ],
    General: [
      {
        title: "Logs",
        icon: <RiRecordCircleLine size={20} />,
      },
      {
        title: "Settings",
        icon: <RiSettings3Line size={20} />,
      },
      {
        title: "Help",
        icon: <RiCustomerServiceLine size={20} />,
      },
    ],
  };

  return (
    <aside className="h-full flex flex-col flex-1 px-5 py-5 w-60 border-r ">
      {/* Profile Details */}
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

      {/* Lists of items */}
      <div className="mt-8 overflow-y-auto scrollbar-hide flex-1 flex flex-col gap-6">
        {Object.entries(listObject).map(([section, items]) => (
          <div key={section}>
            <p className="text-xs text-gray-500 uppercase mb-2">{section}</p>
            <ul className="flex flex-col gap-0">
              {items.map((item) => (
                <li
                  key={item.title}
                  className="flex px-4 py-2 rounded-full hover:bg-dashboard-hover items-center gap-3 text-[15px] cursor-pointer"
                >
                  {item.icon}
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};
