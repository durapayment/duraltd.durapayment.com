import {
  RiArrowDownSLine,
  RiArrowUpLongLine,
  RiCalendar2Line,
  RiRefreshLine,
  RiSearch2Line,
} from "react-icons/ri";
import SalesPerformance from "../components/chart";
import TrafficSource from "../components/dashboard/trafic-source";

export default function DashboardPage() {
  return (
    <div className="w-full flex h-full flex-col items-center">
      <div className="max-w-310 flex flex-col gap-4 flex-1 w-full">
        {/* Transaction Date */}
        <div className="flex w-full  items-center justify-end">
          <div className="flex mt-4 w-max items-center gap-3">
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-dashboard-hover">
              <RiRefreshLine />
            </div>
            <div className="h-9 px-4 gap-3 rounded-full flex items-center justify-center bg-dashboard-hover">
              <RiCalendar2Line className="" color="" />
              <p className="">Monthy</p>
              <RiArrowDownSLine className="" color="" />
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-1 gap-3 ">
          <div className="bg-field-background h-21 rounded-lg p-2 xl:p-3 leading-5 text-[14px] shadow-sm flex flex-col justify-between">
            <p className="opacity-75">Revenue</p>
            <div className="flex items-center justify-between">
              <p className="leading-8 text-[22px] lg:text-[22px] xl:text-[24px] font-semibold text-black">
                ₦229,441
              </p>
              <div className="flex items-center text-green-600 rounded-full px-2 py-0.5 gap-0 bg-green-50 ">
                <RiArrowUpLongLine size={12} />
                <p className="text-[13px]">3.3%</p>
              </div>
            </div>
          </div>
          <div className="bg-field-background h-21 rounded-lg p-2 xl:p-3 leading-5 text-[14px] shadow-sm flex flex-col justify-between">
            <p className="opacity-75">Expenses</p>
            <div className="flex items-center justify-between">
              <p className="leading-8 text-[22px] lg:text-[22px] xl:text-[24px] font-semibold text-black">
                ₦25,108
              </p>
              <div className="flex items-center text-red-600 rounded-full px-2 py-0.5 gap-0 bg-red-50 ">
                <RiArrowUpLongLine size={12} />
                <p className="text-[13px]">3.3%</p>
              </div>
            </div>
          </div>
          <div className="bg-field-background h-21 rounded-lg p-2 xl:p-3 leading-5 text-[14px] shadow-sm flex flex-col justify-between">
            <p className="opacity-75">Sales</p>
            <div className="flex items-center justify-between">
              <p className="leading-8 text-[22px] lg:text-[22px] xl:text-[24px] font-semibold text-black">
                458
              </p>
              <div className="flex items-center text-green-600 rounded-full px-2 py-0.5 gap-0 bg-green-50 ">
                <RiArrowUpLongLine size={12} />
                <p className="text-[13px]">3.3%</p>
              </div>
            </div>
          </div>
          <div className="bg-field-background h-21 rounded-lg p-2 xl:p-3 leading-5 text-[14px] shadow-sm flex flex-col justify-between">
            <p className="opacity-75">Profit</p>
            <div className="flex items-center justify-between">
              <p className="leading-8 text-[22px] lg:text-[22px] xl:text-[24px] font-semibold text-black">
                ₦203,133
              </p>
              <div className="flex items-center text-green-600 rounded-full px-2 py-0.5 gap-0 bg-green-50 ">
                <RiArrowUpLongLine size={12} />
                <p className="text-[13px]">3.3%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-field-background gap-4 rounded-lg p-2 xl:p-3 leading-5 text-[14px] shadow-sm flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-[16px]">Sales Performance</p>
              <div className=" py-1 px-4 gap-3 rounded-lg flex items-center justify-center bg-dashboard-hover">
                <p className="">Last 2 weeks</p>
                <RiArrowDownSLine className="" color="" />
              </div>
            </div>
            <SalesPerformance />
          </div>
          <div className="bg-field-background gap-4 rounded-lg p-2 xl:p-3 leading-5 text-[14px] shadow-sm flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-semibold text-base">
                Traffic Source
              </span>
              <div className="flex items-center gap-4">
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8] inline-block" />
                    Inflow
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" />
                    Outflow
                  </span>
                </div>
                {/* Menu */}
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
              </div>
            </div>
            <TrafficSource />
          </div>
        </div>
      </div>
    </div>
  );
}
