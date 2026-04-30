import { IoMenuOutline } from "react-icons/io5";
import { LuPanelLeftClose } from "react-icons/lu";
import { RiNotification4Line, RiSearch2Line } from "react-icons/ri";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <nav className="w-full h-16 flex justify-between items-center">
      {/* Left */}
      <div className="flex items-center gap-4">
        <LuPanelLeftClose
          onClick={onMenuClick}
          size={20}
          className="hidden md:flex cursor-pointer"
        />
        <IoMenuOutline size={22} className="md:hidden cursor-pointer" />
        <p className="text-[20px] leading-7 font-bold">Good Morning John</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-dashboard-hover">
          <RiSearch2Line />
        </div>
        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-dashboard-hover">
          <RiNotification4Line />
        </div>
      </div>
    </nav>
  );
}
