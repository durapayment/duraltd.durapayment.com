"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  RiAddLine,
  RiCloseLine,
  RiBankLine,
  RiUserLine,
  RiRefreshLine,
  RiCheckLine,
  RiTimeLine,
  RiAlertLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCalendarLine,
  RiWallet3Line,
  RiMoreFill,
  RiSearchLine,
  RiExchangeDollarLine,
  RiErrorWarningLine,
  RiInformationLine,
} from "react-icons/ri";
import { Button, ProgressCircle, Table } from "@heroui/react";
import { authService, User } from "@/app/lib/auth";
import { BusinessVerificationStatus } from "@/app/components/business_verification_status";
import { HiOutlineHashtag } from "react-icons/hi";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export type SettlementStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "on_hold";

export interface Settlement {
  id: string;
  reference: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  status: SettlementStatus;
  bank_name: string;
  account_number: string;
  account_name: string;
  description: string | null;
  initiated_at: string;
  completed_at: string | null;
  expected_at: string | null;
}

export interface NextSettlement {
  amount: number;
  currency: string;
  expected_date: string; // ISO date string
  transactions_count: number;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface TransferForm {
  bank_code: string;
  account_number: string;
  account_name: string;
  amount: string;
  narration: string;
}

interface TransferFormErrors {
  bank_code: string;
  account_number: string;
  account_name: string;
  amount: string;
  narration: string;
}

interface Bank {
  code: string;
  name: string;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function fmt(amount: number, currency = "NGN") {
  if (currency === "NGN")
    return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(
    amount,
  );
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

// ─────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────
function SettlementBadge({ status }: { status: SettlementStatus }) {
  const map: Record<SettlementStatus, { cls: string; icon: React.ReactNode }> =
    {
      completed: {
        cls: "bg-green-50 text-green-700",
        icon: <RiCheckLine size={11} />,
      },
      processing: {
        cls: "bg-yellow-50 text-yellow-700",
        icon: <RiTimeLine size={11} />,
      },
      pending: {
        cls: "bg-blue-50 text-blue-700",
        icon: <RiTimeLine size={11} />,
      },
      failed: {
        cls: "bg-red-50 text-red-700",
        icon: <RiAlertLine size={11} />,
      },
      on_hold: {
        cls: "bg-orange-50 text-orange-700",
        icon: <RiErrorWarningLine size={11} />,
      },
    };
  const { cls, icon } = map[status] ?? {
    cls: "bg-gray-100 text-gray-600",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
    >
      {icon}
      {status === "on_hold"
        ? "On Hold"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Transfer Modal
// ─────────────────────────────────────────────────────────
function TransferModal({
  balance,
  onClose,
  onSuccess,
}: {
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [form, setForm] = useState<TransferForm>({
    bank_code: "",
    account_number: "",
    account_name: "",
    amount: "",
    narration: "",
  });
  const [errors, setErrors] = useState<TransferFormErrors>({
    bank_code: "",
    account_number: "",
    account_name: "",
    amount: "",
    narration: "",
  });

  const resolveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load banks
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payments/banks");
        if (res.ok) {
          const data = await res.json();
          setBanks(data.data ?? []);
        }
      } catch {
        /* non-critical */
      } finally {
        setBanksLoading(false);
      }
    })();
  }, []);

  // Auto-resolve account name when bank + 10-digit number are set
  useEffect(() => {
    if (form.account_number.length !== 10 || !form.bank_code) return;
    if (resolveDebounce.current) clearTimeout(resolveDebounce.current);
    resolveDebounce.current = setTimeout(async () => {
      setResolving(true);
      setErrors((e) => ({ ...e, account_name: "" }));
      try {
        const res = await fetch(
          `/api/payments/resolve?account_number=${form.account_number}&bank_code=${form.bank_code}`,
        );
        const data = await res.json();
        if (res.ok && data.data?.account_name) {
          setForm((f) => ({ ...f, account_name: data.data.account_name }));
        } else {
          setForm((f) => ({ ...f, account_name: "" }));
          setErrors((e) => ({
            ...e,
            account_name: "Could not resolve account. Check the number.",
          }));
        }
      } catch {
        setForm((f) => ({ ...f, account_name: "" }));
      } finally {
        setResolving(false);
      }
    }, 600);
  }, [form.account_number, form.bank_code]);

  const validate = (): boolean => {
    const e: TransferFormErrors = {
      bank_code: form.bank_code ? "" : "Select a bank",
      account_number:
        form.account_number.length === 10
          ? ""
          : "Account number must be 10 digits",
      account_name: form.account_name ? "" : "Account name is required",
      amount: (() => {
        const n = parseFloat(form.amount);
        if (!form.amount || isNaN(n)) return "Enter a valid amount";
        if (n < 100) return "Minimum transfer is ₦100";
        if (n > balance) return "Amount exceeds available balance";
        return "";
      })(),
      narration: "",
    };
    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  const handleConfirm = () => {
    if (validate()) setStep("confirm");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/payments/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_code: form.bank_code,
          account_number: form.account_number,
          account_name: form.account_name,
          amount: parseFloat(form.amount),
          narration: form.narration || "Transfer",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Transfer failed");
      setStep("success");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = banks.find((b) => b.code === form.bank_code);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
              <RiArrowUpLine size={14} className="text-white" />
            </div>
            <h2 className="font-semibold text-gray-900">
              {step === "success" ? "Transfer Sent" : "Bank Transfer"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* ── FORM step ── */}
        {step === "form" && (
          <>
            <div className="px-5 py-5 space-y-4">
              {/* Balance pill */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <span className="text-xs text-gray-500">Available balance</span>
                <span className="text-sm font-semibold text-gray-900">
                  {fmt(balance)}
                </span>
              </div>

              {/* Bank select */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <RiBankLine size={12} /> Bank
                </label>
                <div
                  className={`relative rounded-xl border ${errors.bank_code ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-gray-400"}`}
                >
                  <select
                    value={form.bank_code}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        bank_code: e.target.value,
                        account_name: "",
                      }));
                      setErrors((er) => ({ ...er, bank_code: "" }));
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="">
                      {banksLoading ? "Loading banks…" : "Select bank"}
                    </option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <RiArrowDownLine
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {errors.bank_code && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.bank_code}
                  </p>
                )}
              </div>

              {/* Account number */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <HiOutlineHashtag size={12} /> Account Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.account_number}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((f) => ({
                      ...f,
                      account_number: val,
                      account_name: "",
                    }));
                    setErrors((er) => ({ ...er, account_number: "" }));
                  }}
                  placeholder="10-digit account number"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none font-mono tracking-widest transition-all ${
                    errors.account_number
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                {errors.account_number && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.account_number}
                  </p>
                )}
              </div>

              {/* Account name (auto-resolved) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <RiUserLine size={12} /> Account Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.account_name}
                    readOnly
                    placeholder={
                      resolving ? "Resolving…" : "Auto-filled after lookup"
                    }
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      errors.account_name
                        ? "border-red-300 bg-red-50"
                        : form.account_name
                          ? "border-green-200 bg-green-50 text-green-800 font-medium"
                          : "border-gray-200 bg-gray-100 text-gray-400"
                    }`}
                  />
                  {resolving && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RiRefreshLine
                        size={14}
                        className="animate-spin text-gray-400"
                      />
                    </div>
                  )}
                  {form.account_name && !resolving && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RiCheckLine size={14} className="text-green-500" />
                    </div>
                  )}
                </div>
                {errors.account_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.account_name}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <RiWallet3Line size={12} /> Amount (₦)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setForm((f) => ({ ...f, amount: val }));
                    setErrors((er) => ({ ...er, amount: "" }));
                  }}
                  placeholder="0.00"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    errors.amount
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white"
                  }`}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                )}
                {/* Quick amount buttons */}
                <div className="flex gap-2 mt-2">
                  {[1000, 5000, 10000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, amount: String(amt) }))
                      }
                      className="flex-1 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Narration */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Narration{" "}
                  <span className="text-gray-400 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.narration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, narration: e.target.value }))
                  }
                  placeholder="e.g., Payment for services"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!form.account_name || resolving}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Review Transfer
              </button>
            </div>
          </>
        )}

        {/* ── CONFIRM step ── */}
        {step === "confirm" && (
          <>
            <div className="px-5 py-6 space-y-4">
              {/* Amount hero */}
              <div className="text-center py-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">You are sending</p>
                <p className="text-4xl font-bold text-gray-900">
                  {fmt(parseFloat(form.amount || "0"))}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                {[
                  {
                    label: "Bank",
                    value: selectedBank?.name ?? form.bank_code,
                  },
                  {
                    label: "Account Number",
                    value: form.account_number,
                    mono: true,
                  },
                  { label: "Account Name", value: form.account_name },
                  { label: "Narration", value: form.narration || "Transfer" },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center gap-4"
                  >
                    <span className="text-sm text-gray-500">{label}</span>
                    <span
                      className={`text-sm font-medium text-gray-900 text-right ${mono ? "font-mono" : ""}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {apiError}
                </div>
              )}

              <p className="text-xs text-gray-400 flex items-start gap-1.5">
                <RiInformationLine size={14} className="shrink-0 mt-0.5" />
                Transfers are processed within 30 minutes during banking hours.
                This action cannot be undone.
              </p>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setStep("form")}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RiRefreshLine size={14} className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </button>
            </div>
          </>
        )}

        {/* ── SUCCESS step ── */}
        {step === "success" && (
          <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
              <RiCheckLine size={30} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Transfer initiated
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {fmt(parseFloat(form.amount))} to{" "}
                <span className="font-medium">{form.account_name}</span> is
                being processed.
              </p>
            </div>
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Settlement Detail Modal
// ─────────────────────────────────────────────────────────
function SettlementDetailModal({
  settlement: s,
  onClose,
}: {
  settlement: Settlement;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Settlement Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Amount */}
          <div className="text-center py-4 bg-gray-50 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Net Amount Settled</p>
            <p className="text-3xl font-bold text-gray-900">
              {fmt(s.net_amount, s.currency)}
            </p>
            {s.fee_amount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Gross {fmt(s.amount, s.currency)} · Fee{" "}
                {fmt(s.fee_amount, s.currency)}
              </p>
            )}
            <div className="mt-2 flex justify-center">
              <SettlementBadge status={s.status} />
            </div>
          </div>

          {[
            { label: "Reference", value: s.reference, mono: true },
            { label: "Bank", value: s.bank_name },
            {
              label: "Account",
              value: `${s.account_number} · ${s.account_name}`,
            },
            { label: "Initiated", value: fmtDate(s.initiated_at) },
            ...(s.completed_at
              ? [{ label: "Completed", value: fmtDate(s.completed_at) }]
              : []),
            ...(s.expected_at
              ? [{ label: "Expected", value: fmtDate(s.expected_at) }]
              : []),
            ...(s.description
              ? [{ label: "Description", value: s.description }]
              : []),
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-sm text-gray-500 shrink-0">{label}</span>
              <span
                className={`text-sm text-gray-900 text-right ${mono ? "font-mono text-xs" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [business, setBusiness] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Settlements
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [nextSettlement, setNextSettlement] = useState<NextSettlement | null>(
    null,
  );
  const [settlementsLoading, setSettlementsLoading] = useState(true);
  const [settlementsError, setSettlementsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedSettlement, setSelectedSettlement] =
    useState<Settlement | null>(null);

  // ── Load user ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { isAuthenticated, user, business } =
          await authService.checkAuth();
        if (isAuthenticated && user) {
          setUser(user);
          setBusiness(business);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // ── Debounce search ───────────────────────────
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  // ── Fetch settlements ─────────────────────────
  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true);
    setSettlementsError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "15",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [settleRes, nextRes] = await Promise.all([
        fetch(`/api/payments/settlements?${params}`),
        fetch("/api/payments/settlements/next"),
      ]);

      if (settleRes.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!settleRes.ok) throw new Error("Failed to load settlements");

      const settleJson = await settleRes.json();
      setSettlements(settleJson.data ?? []);
      setMeta(settleJson.meta ?? null);

      if (nextRes.ok) {
        const nextJson = await nextRes.json();
        setNextSettlement(nextJson.data ?? null);
      }
    } catch (err: unknown) {
      setSettlementsError(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setSettlements([]);
    } finally {
      setSettlementsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!pageLoading) fetchSettlements();
  }, [fetchSettlements, pageLoading]);

  const balance = Number(business?.account_balance ?? 0);
  const totalPages = meta?.last_page ?? 1;

  const days = nextSettlement ? daysUntil(nextSettlement.expected_date) : null;
  const daysLabel =
    days === null
      ? ""
      : days === 0
        ? "Today"
        : days === 1
          ? "Tomorrow"
          : `In ${days} days`;

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <ProgressCircle isIndeterminate aria-label="Loading...">
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      </div>
    );
  }

  return (
    <div className="w-full flex h-full flex-col items-center">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {business?.verification_status !== "verified" && (
          <BusinessVerificationStatus status={business?.verification_status} />
        )}

        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center justify-between mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Transfer</h1>
            <p className="text-gray-500 text-sm mt-1">
              Bank transfers and settlement history
            </p>
          </div>
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <RiAddLine size={18} />
            New Transfer
          </button>
        </div>

        {/* ── Top cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Current balance */}
          <div className="bg-accent px-5 py-6 flex flex-col gap-3 rounded-2xl shadow-sm col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.2em] text-white">
                Available Balance
              </p>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <RiWallet3Line size={25} className="text-white" />
              </div>
            </div>
            <p className="text-[30px] font-bold text-white">{fmt(balance)}</p>
            <p className="text-sm text-white">
              {business?.bank_name ?? "DuraPayment MFB"} ·{" "}
              {business?.account_number ?? "—"}
            </p>
          </div>

          {/* Next settlement */}
          {nextSettlement ? (
            <div className="bg-white border border-gray-100 px-5 py-6 flex flex-col gap-3 rounded-2xl shadow-sm col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Next Settlement
                </p>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <RiCalendarLine size={16} className="text-emerald-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {fmt(nextSettlement.amount, nextSettlement.currency)}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {nextSettlement.transactions_count} transaction
                  {nextSettlement.transactions_count !== 1 ? "s" : ""}
                </p>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    days === 0
                      ? "bg-green-50 text-green-600"
                      : days === 1
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {daysLabel} · {fmtDate(nextSettlement.expected_date)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 px-5 py-6 flex flex-col items-center justify-center gap-2 rounded-2xl col-span-1">
              <RiExchangeDollarLine size={24} className="text-gray-300" />
              <p className="text-sm text-gray-400">No pending settlement</p>
            </div>
          )}

          {/* Settlements summary */}
          <div className="bg-white border border-gray-100 px-5 py-6 flex flex-col gap-3 rounded-2xl shadow-sm col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Settlements
              </p>
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <RiArrowDownLine size={16} className="text-gray-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {meta?.total?.toLocaleString() ?? "—"}
            </p>
            <p className="text-xs text-gray-400">Total processed to date</p>
          </div>
        </div>

        {/* ── Settlement history section ── */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Settlement History
            </h2>
            <p className="text-sm text-gray-500">
              Bank settlements from your collected payments
              {meta ? ` · ${meta.total} total` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <RiSearchLine
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search reference, bank…"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-400 bg-white w-52"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm outline-none bg-white focus:border-gray-400 cursor-pointer"
            >
              {[
                { value: "all", label: "All Statuses" },
                { value: "completed", label: "Completed" },
                { value: "pending", label: "Pending" },
                { value: "processing", label: "Processing" },
                { value: "failed", label: "Failed" },
                { value: "on_hold", label: "On Hold" },
              ].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={fetchSettlements}
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RiRefreshLine
                size={15}
                className={settlementsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {settlementsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{settlementsError}</span>
            <button onClick={fetchSettlements} className="underline ml-4">
              Retry
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Settlement History">
              <Table.Header>
                <Table.Column isRowHeader>REFERENCE</Table.Column>
                <Table.Column>DESTINATION</Table.Column>
                <Table.Column>GROSS</Table.Column>
                <Table.Column>FEE</Table.Column>
                <Table.Column>NET</Table.Column>
                <Table.Column>STATUS</Table.Column>
                <Table.Column className="text-nowrap">INITIATED</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {settlementsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Table.Row key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <Table.Cell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[110px]" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                ) : settlements.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={8}
                      className="text-center py-14 text-gray-400 text-sm"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <RiExchangeDollarLine
                          size={32}
                          className="opacity-30"
                        />
                        <p>No settlements yet</p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  settlements.map((s) => (
                    <Table.Row
                      key={s.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedSettlement(s)}
                    >
                      <Table.Cell>
                        <p className="font-mono text-xs text-gray-700">
                          {s.reference}
                        </p>
                        {s.description && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">
                            {s.description}
                          </p>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm font-medium text-gray-800 text-nowrap">
                          {s.bank_name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {s.account_number}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm text-gray-700 text-nowrap">
                          {fmt(s.amount, s.currency)}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm text-gray-500 text-nowrap">
                          {s.fee_amount > 0
                            ? fmt(s.fee_amount, s.currency)
                            : "—"}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm font-semibold text-gray-900 text-nowrap">
                          {fmt(s.net_amount, s.currency)}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <SettlementBadge status={s.status} />
                      </Table.Cell>

                      <Table.Cell className="text-sm text-nowrap text-gray-500">
                        {fmtDate(s.initiated_at)}
                      </Table.Cell>

                      <Table.Cell className="text-right">
                        <Button
                          variant="outline"
                          isIconOnly
                          aria-label="View settlement"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSettlement(s);
                          }}
                        >
                          <RiMoreFill size={18} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* ── Pagination ── */}
        {!settlementsLoading && meta && meta.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <p className="text-sm text-gray-500">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}{" "}
              settlements
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                    <span key={`e-${i}`} className="px-2 text-gray-400 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        item === currentPage
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
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

        <div className="h-10" />
      </div>

      {/* ── Transfer Modal ── */}
      {showTransfer && (
        <TransferModal
          balance={balance}
          onClose={() => setShowTransfer(false)}
          onSuccess={fetchSettlements}
        />
      )}

      {/* ── Settlement Detail Modal ── */}
      {selectedSettlement && (
        <SettlementDetailModal
          settlement={selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
        />
      )}
    </div>
  );
}
