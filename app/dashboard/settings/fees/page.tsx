"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RiExchangeDollarLine,
  RiRefreshLine,
  RiAlertLine,
  RiArrowRightLine,
} from "react-icons/ri";

interface FeeType {
  type: string;
  label: string;
  description: string;
  current_fee: number;
  has_been_set: boolean;
  last_updated: string | null;
}

interface AdminInfo {
  permissions: string[];
}

function fmt(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

export default function FeesListPage() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [fees, setFees] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fees");
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load fees");
      setFees(json.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load fees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const canManage = admin?.permissions.includes("manage_fees") ?? false;

  if (admin && !canManage) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col items-center justify-center py-20 text-center px-4">
          <RiAlertLine size={28} className="text-gray-300 mb-3" />
          <p className="text-[15px] font-semibold text-gray-700">
            Not authorized
          </p>
          <p className="text-[13px] text-gray-400 mt-1">
            You don't have permission to manage fees.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
              Fees
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              Manage the fees charged across the platform
            </p>
          </div>
          <button
            onClick={fetchFees}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
          >
            <RiRefreshLine
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error}
            <button
              onClick={fetchFees}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-5 h-36 animate-pulse"
                />
              ))
            : fees.map((f) => (
                <a
                  key={f.type}
                  href={`/dashboard/settings/fees/${f.type}`}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 hover:border-accent/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <RiExchangeDollarLine
                        size={16}
                        className="text-gray-500"
                      />
                    </div>
                    <RiArrowRightLine
                      size={14}
                      className="text-gray-300 group-hover:text-accent transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">
                      {f.label}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {f.description}
                    </p>
                  </div>
                  <p className="text-[22px] font-bold text-gray-900 mt-1">
                    {fmt(f.current_fee)}
                    {!f.has_been_set && (
                      <span className="text-[11px] font-normal text-gray-400 ml-2">
                        default
                      </span>
                    )}
                  </p>
                </a>
              ))}
        </div>
      </div>
    </div>
  );
}
