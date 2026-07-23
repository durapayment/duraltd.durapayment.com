"use client";

import {
  RiSearchLine,
  RiRefreshLine,
  RiArrowRightLine,
  RiBuilding2Line,
  RiMoreFill,
} from "react-icons/ri";
import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Business {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  business_industry: string | null;
  contact_email: string;
  verification_status: string;
  compliance_step: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  risk_level: string;
  owner: { id: string; name: string; email: string; phone: string } | null;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "incomplete", label: "Incomplete" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  business_name: "Business Name",
  limited_liability: "Limited Liability",
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-gray-900 text-white",
    under_review: "bg-accent text-white",
    incomplete: "bg-gray-100 text-gray-600",
    rejected: "bg-gray-100 text-gray-600",
    suspended: "bg-gray-100 text-gray-500",
    unverified: "bg-gray-100 text-gray-500",
  };

  const labels: Record<string, string> = {
    verified: "Verified",
    under_review: "Under Review",
    incomplete: "Incomplete",
    rejected: "Rejected",
    suspended: "Suspended",
    unverified: "Unverified",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium",
        map[status] ?? "bg-gray-100 text-gray-500",
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  // ── Debounce search ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch ──────────────────────────────────────────────
  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "20",
      });
      if (activeTab) params.set("verification_status", activeTab);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/businesses?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load");

      setBusinesses(json.data?.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load businesses");
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, debouncedSearch]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const totalPages = meta?.last_page ?? 1;

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center pt-2 pb-10">
      <div className="max-w-310 w-full flex flex-col gap-5">
        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
              Businesses
            </h1>
            <p className="text-[14px] text-gray-400 mt-0.5">
              {meta
                ? `${meta.total.toLocaleString()} total businesses`
                : "Loading..."}
            </p>
          </div>
          <button
            onClick={fetchBusinesses}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
          >
            <RiRefreshLine
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ── Status Tabs ───────────────────────────── */}
        <div className="flex gap-1 border-b border-gray-100 overflow-x-auto pb-0 [&::-webkit-scrollbar]:hidden">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={clsx(
                "px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.value
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search ────────────────────────────────── */}
        <div className="relative max-w-sm">
          <RiSearchLine
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, ID..."
            className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-gray-200 rounded-xl focus:border-accent focus:outline-none bg-white"
          />
        </div>

        {/* ── Error ─────────────────────────────────── */}
        {error && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-600 flex items-center justify-between">
            {error}
            <button
              onClick={fetchBusinesses}
              className="text-accent underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Table ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
            {["Business", "Type", "Owner", "Status", "Submitted", ""].map(
              (h) => (
                <p
                  key={h}
                  className="text-[11px] uppercase tracking-wider font-medium text-gray-400"
                >
                  {h}
                </p>
              ),
            )}
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-4 border-b border-gray-50"
              >
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-100 rounded animate-pulse"
                  />
                ))}
                <div />
              </div>
            ))
          ) : businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RiBuilding2Line size={28} className="text-gray-300 mb-3" />
              <p className="text-[15px] font-semibold text-gray-600">
                No businesses found
              </p>
              <p className="text-[13px] text-gray-400 mt-1">
                {activeTab
                  ? "Try a different status filter"
                  : "No businesses yet"}
              </p>
            </div>
          ) : (
            businesses.map((business, i) => (
              <a
                key={business.id}
                href={`/dashboard/businesses/${business.id}`}
                className={clsx(
                  "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors group",
                  i < businesses.length - 1 && "border-b border-gray-50",
                )}
              >
                {/* Business name */}
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 truncate">
                    {business.business_name}
                  </p>
                  <p className="text-[12px] text-gray-400 truncate mt-0.5">
                    {business.business_id}
                  </p>
                </div>

                {/* Type */}
                <p className="text-[13px] text-gray-500 truncate">
                  {BUSINESS_TYPE_LABELS[business.business_type] ??
                    business.business_type}
                </p>

                {/* Owner */}
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-700 truncate">
                    {business.owner?.name ?? "—"}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {business.owner?.email ?? ""}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={business.verification_status} />

                {/* Submitted */}
                <p className="text-[13px] text-gray-400">
                  {formatDate(business.submitted_at)}
                </p>

                {/* Arrow */}
                <RiArrowRightLine
                  size={15}
                  className="text-gray-300 group-hover:text-accent transition-colors"
                />
              </a>
            ))
          )}
        </div>

        {/* ── Pagination ────────────────────────────── */}
        {!loading && totalPages > 1 && meta && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-400">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-[13px] rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "..." ? (
                    <span
                      key={`e-${i}`}
                      className="px-2 text-gray-400 text-[13px]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={clsx(
                        "px-3 py-1.5 text-[13px] rounded-lg border transition-colors",
                        item === currentPage
                          ? "bg-accent text-white border-accent"
                          : "border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-[13px] rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
