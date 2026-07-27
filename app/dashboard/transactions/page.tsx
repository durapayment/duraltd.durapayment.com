"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RiExchangeDollarLine,
  RiRefreshLine,
  RiAlertLine,
  RiSearchLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiFlagLine,
} from "react-icons/ri";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface TxnBusiness {
  id: string | null;
  name: string | null;
}

interface Txn {
  id: string;
  reference: string;
  business: TxnBusiness;
  type: string;
  direction: "credit" | "debit";
  status: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  customer: string | null;
  customer_email: string | null;
  payment_method: string | null;
  is_flagged: boolean;
  date: string;
  time: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface Stats {
  total_in: number;
  total_out: number;
  processing_count: number;
  failed_count: number;
  flagged_count: number;
}

interface CurrentAdmin {
  permissions: string[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function fmt(amount: number, currency = "NGN"): string {
  if (currency === "NGN")
    return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(
    amount,
  );
}

function fmtCompact(amount: number): string {
  if (amount >= 1_000_000_000)
    return "₦" + (amount / 1_000_000_000).toFixed(1) + "B";
  if (amount >= 1_000_000) return "₦" + (amount / 1_000_000).toFixed(1) + "M";
  if (amount >= 1_000) return "₦" + (amount / 1_000).toFixed(1) + "K";
  return "₦" + amount.toLocaleString("en-NG");
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  processing: "bg-yellow-50 text-yellow-700",
  pending: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  reversed: "bg-gray-100 text-gray-500",
  disputed: "bg-orange-50 text-orange-700",
  chargeback: "bg-orange-50 text-orange-700",
};

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "payment", label: "Payment" },
  { value: "refund", label: "Refund" },
  { value: "transfer", label: "Transfer" },
  { value: "payout", label: "Payout" },
  { value: "fee", label: "Fee" },
  { value: "settlement", label: "Settlement" },
  { value: "adjustment", label: "Adjustment" },
  { value: "chargeback", label: "Chargeback" },
  { value: "dispute", label: "Dispute" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "reversed", label: "Reversed" },
  { value: "disputed", label: "Disputed" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "All Methods" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wallet", label: "Wallet" },
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "other", label: "Other" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

// ─────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${
        accent
          ? "bg-accent border-accent text-white"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-[12px] uppercase tracking-widest font-medium ${accent ? "text-white/60" : "text-gray-400"}`}
        >
          {label}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-white/10" : "bg-gray-100"}`}
        >
          <Icon size={16} className={accent ? "text-white" : "text-gray-500"} />
        </div>
      </div>
      {loading ? (
        <div
          className={`h-7 w-24 rounded animate-pulse ${accent ? "bg-white/10" : "bg-gray-100"}`}
        />
      ) : (
        <p
          className={`text-[24px] font-bold leading-none tracking-tight ${accent ? "text-white" : "text-gray-900"}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AdminTransactionsPage() {
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [businessTerm, setBusinessTerm] = useState("");
  const [debouncedBusiness, setDebouncedBusiness] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const businessDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        const json = await res.json();
        setCurrentAdmin(json.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const handleBusinessSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusinessTerm(val);
    setCurrentPage(1);
    if (businessDebounce.current) clearTimeout(businessDebounce.current);
    businessDebounce.current = setTimeout(() => setDebouncedBusiness(val), 400);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "15",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedBusiness) params.set("business", debouncedBusiness);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (methodFilter !== "all") params.set("payment_method", methodFilter);
      if (dateRange !== "all") params.set("date_range", dateRange);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Failed to load transactions");
      setTransactions(json.data ?? []);
      setMeta(json.meta ?? null);
      setStats(json.stats ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearch,
    debouncedBusiness,
    typeFilter,
    statusFilter,
    methodFilter,
    dateRange,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const canView =
    currentAdmin?.permissions.includes("view_transactions") ?? false;
  const totalPages = meta?.last_page ?? 1;

  if (currentAdmin && !canView) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col items-center justify-center py-20 text-center px-4">
          <RiAlertLine size={28} className="text-gray-300 mb-3" />
          <p className="text-[15px] font-semibold text-gray-700">
            Not authorized
          </p>
          <p className="text-[13px] text-gray-400 mt-1">
            You don't have permission to view transactions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
              Transactions
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              All transactions across every business
              {meta ? ` · ${meta.total} total` : ""}
            </p>
          </div>
          <button
            onClick={fetchTransactions}
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
              onClick={fetchTransactions}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total In"
            value={stats ? fmtCompact(stats.total_in) : "—"}
            icon={RiArrowDownLine}
            loading={loading}
            accent
          />
          <StatCard
            label="Total Out"
            value={stats ? fmtCompact(stats.total_out) : "—"}
            icon={RiArrowUpLine}
            loading={loading}
          />
          <StatCard
            label="Processing"
            value={stats ? String(stats.processing_count) : "—"}
            icon={RiRefreshLine}
            loading={loading}
          />
          <StatCard
            label="Flagged"
            value={stats ? String(stats.flagged_count) : "—"}
            icon={RiFlagLine}
            loading={loading}
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <RiSearchLine
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search reference, customer…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-400 bg-white w-56"
            />
          </div>

          <input
            value={businessTerm}
            onChange={handleBusinessSearch}
            placeholder="Filter by business…"
            className="px-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-400 bg-white w-48"
          />

          {[
            { value: typeFilter, set: setTypeFilter, options: TYPE_OPTIONS },
            {
              value: statusFilter,
              set: setStatusFilter,
              options: STATUS_OPTIONS,
            },
            {
              value: methodFilter,
              set: setMethodFilter,
              options: PAYMENT_METHOD_OPTIONS,
            },
            {
              value: dateRange,
              set: setDateRange,
              options: DATE_RANGE_OPTIONS,
            },
          ].map((f, i) => (
            <div
              key={i}
              className="px-3 py-2 border border-gray-200 rounded-full bg-white"
            >
              <select
                value={f.value}
                onChange={(e) => {
                  f.set(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm outline-none cursor-pointer bg-transparent"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3 font-medium">Reference</th>
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-25" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-14 text-gray-400 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RiExchangeDollarLine size={32} className="opacity-30" />
                      <p>No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-700 flex items-center gap-1.5">
                        {t.reference}
                        {t.is_flagged && (
                          <RiFlagLine size={12} className="text-red-500" />
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 truncate max-w-[160px]">
                        {t.business.name ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 truncate max-w-40">
                        {t.customer ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {t.customer_email ?? ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 capitalize">
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className={`font-semibold text-nowrap ${t.direction === "credit" ? "text-green-700" : "text-gray-900"}`}
                      >
                        {t.direction === "credit" ? "+" : "-"}
                        {fmt(t.amount, t.currency)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_STYLES[t.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-nowrap">
                      {t.date} · {t.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && meta && meta.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <p className="text-sm text-gray-500">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}{" "}
              transactions
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
