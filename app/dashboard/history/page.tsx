"use client";

import {
  RiArrowDownSLine,
  RiArrowUpLine,
  RiSearchLine,
  RiMoreFill,
  RiCloseLine,
  RiCheckLine,
  RiTimeLine,
  RiAlertLine,
  RiErrorWarningLine,
  RiBankCardLine,
  RiExchangeDollarLine,
} from "react-icons/ri";
import { Button, Dropdown, Label, ProgressCircle, Table } from "@heroui/react";
import { useEffect, useState, useCallback } from "react";
import { BusinessVerificationStatus } from "@/app/components/business_verification_status";
import { authService, User } from "@/app/lib/auth";

// ---------------------------------------------------------------------------
// Types — mirroring the API response from TransactionController
// ---------------------------------------------------------------------------

export type TransactionType =
  | "payment"
  | "refund"
  | "chargeback"
  | "dispute"
  | "transfer"
  | "payout"
  | "adjustment"
  | "settlement"
  | "fee";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed"
  | "disputed"
  | "chargeback";

export type PaymentMethod =
  | "card"
  | "bank_transfer"
  | "wallet"
  | "cash"
  | "mobile_money"
  | "other";

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  direction: "credit" | "debit";
  status: TransactionStatus;
  amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  title: string | null;
  description: string | null;
  customer: string | null;
  customer_email: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payee_name: string | null;
  payee_email: string | null;
  payment_method: PaymentMethod | null;
  is_flagged: boolean;
  risk_score: "low" | "medium" | "high" | null;
  is_settled: boolean;
  date: string;
  time: string;
  created_at: string;
  completed_at: string | null;
  // detail-only
  fees?: { fee_type: string; amount: number; currency: string }[];
  failure_reason?: string | null;
  flag_reason?: string | null;
  compliance_approved?: boolean;
  compliance_approved_by?: string | null;
  external_transaction_id?: string | null;
  external_gateway?: string | null;
  settled_at?: string | null;
  processed_at?: string | null;
  cancelled_at?: string | null;
}

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

interface Stats {
  total_in: number;
  total_out: number;
  processing_count: number;
  failed_count: number;
}

// ---------------------------------------------------------------------------
// Filter constants — aligned with DB enums
// ---------------------------------------------------------------------------

const TRANSACTION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "payment", label: "Payments" },
  { value: "payout", label: "Payouts" },
  { value: "transfer", label: "Transfers" },
  { value: "refund", label: "Refunds" },
  { value: "settlement", label: "Settlements" },
  { value: "fee", label: "Fees" },
  { value: "adjustment", label: "Adjustments" },
  { value: "chargeback", label: "Chargebacks" },
  { value: "dispute", label: "Disputes" },
];

const STATUS_TYPES = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "reversed", label: "Reversed" },
  { value: "disputed", label: "Disputed" },
];

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

const DIRECTION_FILTERS = [
  { value: "all", label: "All" },
  { value: "credit", label: "Money In" },
  { value: "debit", label: "Money Out" },
];

const PER_PAGE = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency = "NGN") {
  if (currency === "NGN") return "₦" + amount.toLocaleString("en-NG");
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

function buildQueryString(params: Record<string, string | number>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== "all") q.set(k, String(v));
  });
  return q.toString();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RiskDot({ score }: { score: Transaction["risk_score"] }) {
  if (!score) return null;
  const color = {
    low: "bg-green-400",
    medium: "bg-yellow-400",
    high: "bg-red-500",
  }[score];
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
      title={`Risk: ${score}`}
    />
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const map: Record<TransactionStatus, { cls: string; icon: React.ReactNode }> =
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
      cancelled: {
        cls: "bg-gray-100 text-gray-600",
        icon: <RiCloseLine size={11} />,
      },
      reversed: {
        cls: "bg-purple-50 text-purple-700",
        icon: <RiExchangeDollarLine size={11} />,
      },
      disputed: {
        cls: "bg-orange-50 text-orange-700",
        icon: <RiErrorWarningLine size={11} />,
      },
      chargeback: {
        cls: "bg-red-100 text-red-800",
        icon: <RiAlertLine size={11} />,
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TransactionModal({
  transaction: t,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Amount hero */}
        <div className="text-center py-6 px-5 bg-gray-50 shrink-0">
          <p className="text-xs text-gray-500 mb-1">
            {t.direction === "credit" ? "Amount Received" : "Amount Sent"}
          </p>
          <p
            className={`text-4xl font-semibold ${t.direction === "credit" ? "text-green-600" : "text-red-600"}`}
          >
            {t.direction === "credit" ? "+" : "−"}
            {fmt(t.amount, t.currency)}
          </p>
          {t.fee_amount > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Fee: {fmt(t.fee_amount, t.currency)} · Net:{" "}
              {fmt(t.net_amount, t.currency)}
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-2">
            <StatusBadge status={t.status} />
            {t.is_flagged && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                <RiAlertLine size={11} /> Flagged
              </span>
            )}
          </div>
        </div>

        {/* Scrollable details */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          {[
            { label: "Reference", value: t.reference, mono: true },
            { label: "Type", value: t.type.replace(/_/g, " "), cap: true },
            {
              label: "Payment Method",
              value: t.payment_method?.replace(/_/g, " ") ?? "—",
              cap: true,
            },
            {
              label: t.direction === "credit" ? "From (Payer)" : "To (Payee)",
              value: t.customer ?? "—",
            },
            { label: "Email", value: t.customer_email ?? "—" },
            { label: "Date", value: `${fmtDate(t.date)} · ${t.time}` },
            ...(t.completed_at
              ? [
                  {
                    label: "Completed",
                    value: fmtDate(t.completed_at.slice(0, 10)),
                  },
                ]
              : []),
            ...(t.settled_at
              ? [
                  {
                    label: "Settled",
                    value: fmtDate(t.settled_at.slice(0, 10)),
                  },
                ]
              : []),
            ...(t.failure_reason
              ? [{ label: "Failure Reason", value: t.failure_reason }]
              : []),
            ...(t.is_flagged && t.flag_reason
              ? [{ label: "Flag Reason", value: t.flag_reason }]
              : []),
            ...(t.risk_score
              ? [{ label: "Risk Score", value: t.risk_score, cap: true }]
              : []),
            ...(t.external_gateway
              ? [{ label: "Gateway", value: t.external_gateway }]
              : []),
            ...(t.external_transaction_id
              ? [
                  {
                    label: "External ID",
                    value: t.external_transaction_id,
                    mono: true,
                  },
                ]
              : []),
            ...(t.compliance_approved_by
              ? [{ label: "Approved By", value: t.compliance_approved_by }]
              : []),
          ].map(({ label, value, mono, cap }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-sm text-gray-500 shrink-0">{label}</span>
              <span
                className={`text-sm text-gray-900 text-right ${mono ? "font-mono" : ""} ${cap ? "capitalize" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}

          {/* Fee breakdown */}
          {t.fees && t.fees.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Fee Breakdown
              </p>
              {t.fees.map((fee) => (
                <div
                  key={fee.fee_type}
                  className="flex justify-between text-sm py-0.5"
                >
                  <span className="text-gray-500 capitalize">
                    {fee.fee_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-gray-900">
                    {fmt(fee.amount, fee.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {t.description && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-start gap-4 pt-1">
                <span className="text-sm text-gray-500 shrink-0">
                  Description
                </span>
                <span className="text-sm text-gray-900 text-right">
                  {t.description}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [user, setUser] = useState<User | null>(null);
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
        console.log(summary?.recent_customers);
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

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to page 1 on any filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, statusFilter, dateFilter, directionFilter]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const qs = buildQueryString({
        search: debouncedSearch,
        type: typeFilter,
        status: statusFilter,
        date_range: dateFilter,
        direction: directionFilter,
        page: currentPage,
        per_page: PER_PAGE,
      });
      const res = await fetch(`/api/transactions?${qs}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      console.log(json);
      setTransactions(json.data);
      setMeta(json.meta);
      setStats(json.stats);
    } catch (err: any) {
      setFetchError(err.message ?? "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    typeFilter,
    statusFilter,
    dateFilter,
    directionFilter,
    currentPage,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Open modal — fetch full detail record
  const openDetail = async (txn: Transaction) => {
    setSelectedTransaction(txn); // show list data immediately
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedTransaction(json.data);
      }
    } catch {
      /* keep list data visible */
    }
  };

  const totalPages = meta?.last_page ?? 1;

  // Ellipsis pagination pages
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
    )
    .reduce<(number | "…")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="w-full flex h-full flex-col items-center pt-5 sm:pt-14 pb-5 sm:pb-8">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {/* {business?.verification_status !== "verified" && (
          <BusinessVerificationStatus status={business?.verification_status} />
        )} */}
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Transaction History
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              All transactions across main and sub accounts
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Transactions",
              value: meta?.total?.toLocaleString() ?? "—",
              color: "text-gray-900",
            },
            {
              label: "Money In",
              value: stats ? fmt(stats.total_in) : "—",
              color: "text-green-600",
            },
            {
              label: "Money Out",
              value: stats ? fmt(stats.total_out) : "—",
              color: "text-red-600",
            },
            {
              label: "Processing / Failed",
              value: stats
                ? `${stats.processing_count} / ${stats.failed_count}`
                : "—",
              color: "text-gray-900",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white flex flex-col gap-1 rounded-xl p-4 border border-gray-100"
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col w-full gap-3 lg:gap-0 lg:flex-row lg:justify-between lg:items-center">
          <div className="w-full max-w-md bg-white px-5 gap-3 py-2 rounded-full flex items-center border border-gray-200">
            <RiSearchLine className="text-gray-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference, name, description…"
              className="w-full outline-none text-sm"
            />
          </div>

          <div className="flex flex-row items-center flex-wrap gap-2">
            {/* Direction */}
            <Dropdown>
              <Button variant="secondary">
                {DIRECTION_FILTERS.find((d) => d.value === directionFilter)
                  ?.label ?? "All"}
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  selectionMode="single"
                  selectedKeys={new Set([directionFilter])}
                  onSelectionChange={(keys) =>
                    setDirectionFilter(Array.from(keys)[0] as string)
                  }
                >
                  {DIRECTION_FILTERS.map((d) => (
                    <Dropdown.Item
                      key={d.value}
                      id={d.value}
                      textValue={d.label}
                    >
                      <Label>{d.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            {/* Type */}
            <Dropdown>
              <Button variant="secondary">
                {TRANSACTION_TYPES.find((t) => t.value === typeFilter)?.label ??
                  "All Types"}
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  selectionMode="single"
                  selectedKeys={new Set([typeFilter])}
                  onSelectionChange={(keys) =>
                    setTypeFilter(Array.from(keys)[0] as string)
                  }
                >
                  {TRANSACTION_TYPES.map((t) => (
                    <Dropdown.Item
                      key={t.value}
                      id={t.value}
                      textValue={t.label}
                    >
                      <Label>{t.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            {/* Status */}
            <Dropdown>
              <Button variant="secondary">
                {STATUS_TYPES.find((s) => s.value === statusFilter)?.label ??
                  "All Statuses"}
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  selectionMode="single"
                  selectedKeys={new Set([statusFilter])}
                  onSelectionChange={(keys) =>
                    setStatusFilter(Array.from(keys)[0] as string)
                  }
                >
                  {STATUS_TYPES.map((s) => (
                    <Dropdown.Item
                      key={s.value}
                      id={s.value}
                      textValue={s.label}
                    >
                      <Label>{s.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            {/* Date */}
            <Dropdown>
              <Button variant="secondary">
                {DATE_RANGES.find((d) => d.value === dateFilter)?.label ??
                  "All Time"}
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  selectionMode="single"
                  selectedKeys={new Set([dateFilter])}
                  onSelectionChange={(keys) =>
                    setDateFilter(Array.from(keys)[0] as string)
                  }
                >
                  {DATE_RANGES.map((d) => (
                    <Dropdown.Item
                      key={d.value}
                      id={d.value}
                      textValue={d.label}
                    >
                      <Label>{d.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl">
          {fetchError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-600 mb-3">{fetchError}</p>
              <Button variant="outline" onClick={fetchTransactions}>
                Retry
              </Button>
            </div>
          ) : (
            <Table variant="secondary">
              <Table.ScrollContainer>
                <Table.Content aria-label="Transaction History">
                  <Table.Header>
                    <Table.Column isRowHeader>TRANSACTION</Table.Column>
                    <Table.Column>CUSTOMER</Table.Column>
                    <Table.Column>AMOUNT</Table.Column>
                    <Table.Column className={"text-nowrap"}>
                      DATE & TIME
                    </Table.Column>
                    <Table.Column>STATUS</Table.Column>
                    <Table.Column className="text-right">ACTIONS</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {loading ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} className="py-12">
                          <div className="flex justify-center">
                            <ProgressCircle
                              isIndeterminate
                              aria-label="Loading..."
                            >
                              <ProgressCircle.Track>
                                <ProgressCircle.TrackCircle />
                                <ProgressCircle.FillCircle />
                              </ProgressCircle.Track>
                            </ProgressCircle>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ) : transactions.length === 0 ? (
                      <Table.Row>
                        <Table.Cell
                          colSpan={6}
                          className="text-center py-12 text-gray-400 text-sm"
                        >
                          No transactions match your filters
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      transactions.map((txn) => (
                        <Table.Row
                          key={txn.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => openDetail(txn)}
                        >
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                  txn.direction === "credit"
                                    ? "bg-green-50 text-green-600"
                                    : "bg-red-50 text-red-500"
                                }`}
                              >
                                {txn.direction === "credit" ? (
                                  <RiArrowDownSLine size={20} />
                                ) : (
                                  <RiArrowUpLine size={20} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium text-sm text-gray-900 truncate max-w-[220px]">
                                    {txn.title ??
                                      txn.description ??
                                      txn.reference}
                                  </p>
                                  <RiskDot score={txn.risk_score} />
                                  {txn.is_flagged && (
                                    <RiAlertLine
                                      size={13}
                                      className="text-red-500 shrink-0"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-400 font-mono">
                                    {txn.reference}
                                  </p>
                                  {txn.payment_method && (
                                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                      <RiBankCardLine size={11} />
                                      {txn.payment_method.replace(/_/g, " ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Table.Cell>

                          <Table.Cell className="text-sm text-nowrap text-gray-600">
                            <p>{txn.customer ?? "—"}</p>
                            {txn.customer_email && (
                              <p className="text-xs text-gray-400">
                                {txn.customer_email}
                              </p>
                            )}
                          </Table.Cell>

                          <Table.Cell>
                            <p
                              className={`font-medium text-sm whitespace-nowrap ${
                                txn.direction === "credit"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {txn.direction === "credit" ? "+" : "−"}
                              {fmt(txn.amount, txn.currency)}
                            </p>
                            {txn.fee_amount > 0 && (
                              <p className="text-xs text-gray-400">
                                Fee: {fmt(txn.fee_amount, txn.currency)}
                              </p>
                            )}
                          </Table.Cell>

                          <Table.Cell className="text-sm text-nowrap text-gray-500">
                            <div>{fmtDate(txn.date)}</div>
                            <div className="text-xs">{txn.time}</div>
                          </Table.Cell>

                          <Table.Cell>
                            <StatusBadge status={txn.status} />
                          </Table.Cell>

                          <Table.Cell className="text-right">
                            <Button
                              variant="outline"
                              isIconOnly
                              aria-label={`Details for ${txn.reference}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(txn);
                              }}
                            >
                              <RiMoreFill size={20} />
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          {/* Pagination */}
          {!loading && meta && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {meta.from && meta.to
                  ? `Showing ${meta.from}–${meta.to} of ${meta.total}`
                  : `${meta.total} transactions`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-gray-400 text-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        p === currentPage
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {p}
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
        </div>

        <div className="h-10" />
      </div>

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
