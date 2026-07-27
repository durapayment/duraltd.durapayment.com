"use client";

import {
  RiSearchLine,
  RiMoreFill,
  RiRefreshLine,
  RiFileCopyLine,
  RiCheckLine,
  RiBankLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiAlertLine,
} from "react-icons/ri";
import { Table } from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface BusinessAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  currency: string;
  tier: string;
  tier_label: string;
  status: string;
  daily_limit: number | null;
  max_transaction_limit: number | null;
  activated_at: string | null;
}

interface CustomerAccount {
  id: string;
  account_ref: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  currency: string;
  type: "static" | "dynamic";
  tier: string;
  status: string;
  is_expired: boolean;
  expires_at: string | null;
  provider: string;
  is_default: boolean;
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
// Helpers
// ─────────────────────────────────────────────────────────
function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (!amount) return "Unlimited";
  return "₦" + new Intl.NumberFormat("en-NG").format(amount);
}

// ─────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────
function StatusBadge({
  status,
  isExpired,
}: {
  status: string;
  isExpired?: boolean;
}) {
  if (isExpired) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Expired
      </span>
    );
  }
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-600",
    inactive: "bg-gray-100 text-gray-500",
    suspended: "bg-red-50 text-red-600",
    pending_activation: "bg-amber-50 text-amber-600",
    failed_creation: "bg-red-50 text-red-600",
    expired: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Type Badge
// ─────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={clsx(
        "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
        type === "static"
          ? "bg-blue-50 text-blue-600"
          : "bg-purple-50 text-purple-600",
      )}
    >
      {type === "static" ? "Static" : "Dynamic"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Copy Button
// ─────────────────────────────────────────────────────────
function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
      title={`Copy ${label ?? value}`}
    >
      {copied ? (
        <RiCheckLine size={14} className="text-green-500" />
      ) : (
        <RiFileCopyLine size={14} />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Business Account Card
// ─────────────────────────────────────────────────────────
function BusinessAccountCard({
  account,
  verificationStatus,
}: {
  account: BusinessAccount | null;
  verificationStatus: string;
}) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(
      `Bank: ${account.bank_name}\nAccount Name: ${account.account_name}\nAccount Number: ${account.account_number}`,
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const isVerified = verificationStatus === "verified";

  // ── Not verified ───────────────────────────────────────
  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-gray-200 rounded-3xl text-center bg-gray-50">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
          <RiShieldCheckLine size={24} className="text-amber-600" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">
          Account Not Assigned Yet
        </h3>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-4">
          Your dedicated bank account will be automatically assigned once your
          business KYC verification is approved.
        </p>
        <div
          className={clsx(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border",
            verificationStatus === "under_review"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : verificationStatus === "rejected"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-amber-50 border-amber-200 text-amber-700",
          )}
        >
          {verificationStatus === "under_review" ? (
            <RiTimeLine size={14} />
          ) : (
            <RiAlertLine size={14} />
          )}
          {verificationStatus === "under_review"
            ? "KYC Under Review"
            : verificationStatus === "rejected"
              ? "KYC Rejected — Please Resubmit"
              : "KYC Verification Required"}
        </div>
        {verificationStatus !== "under_review" && (
          <a
            href="/dashboard/settings?completeVerification=true"
            className="mt-3 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Complete Verification
          </a>
        )}
      </div>
    );
  }

  // ── Verified but no account yet ────────────────────────
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-gray-200 rounded-3xl text-center bg-gray-50">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
          <RiTimeLine size={24} className="text-blue-600" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Account Being Set Up</h3>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          Your business is verified. Your dedicated bank account is being set up
          and will appear here shortly.
        </p>
      </div>
    );
  }

  // ── Account card ───────────────────────────────────────
  return (
    <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="px-6 py-4 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <RiBankLine size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {account.bank_name}
            </p>
            <p className="text-white/60 text-[11px]">Your Business Account</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
            Tier {account.tier}
          </span>
          <span
            className={clsx(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full",
              account.status === "active"
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300",
            )}
          >
            {account.status === "active" ? "Active" : account.status}
          </span>
        </div>
      </div>

      {/* Account details */}
      <div className="divide-y divide-gray-100">
        {/* Account number */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
              Account Number
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-widest font-mono">
              {account.account_number}
            </p>
          </div>
          <CopyButton value={account.account_number} label="account number" />
        </div>

        {/* Account name */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
              Account Name
            </p>
            <p className="text-base font-semibold text-gray-900">
              {account.account_name}
            </p>
          </div>
          <CopyButton value={account.account_name} label="account name" />
        </div>

        {/* Bank name */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
              Bank Name
            </p>
            <p className="text-base font-semibold text-gray-900">
              {account.bank_name}
            </p>
          </div>
          <CopyButton value={account.bank_name} label="bank name" />
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="px-6 py-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
              Daily Limit
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(account.daily_limit)}
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
              Max Per Transaction
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(account.max_transaction_limit)}
            </p>
          </div>
        </div>
      </div>

      {/* Copy all */}
      <div className="px-6 py-4 border-t border-gray-100">
        <button
          onClick={handleCopyAll}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {copiedAll ? (
            <>
              <RiCheckLine size={15} className="text-green-500" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <RiFileCopyLine size={15} />
              Copy All Account Details
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AccountsPage() {
  // ── Business account state ─────────────────────────────
  const [businessAccount, setBusinessAccount] =
    useState<BusinessAccount | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<string>("unverified");
  const [businessLoading, setBusinessLoading] = useState(true);

  // ── Customer accounts state ────────────────────────────
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "static" | "dynamic">(
    "all",
  );

  // ── Active tab ─────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"business" | "customers">(
    "business",
  );

  // ── Fetch business account ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/accounts/business");
        if (res.status === 401) {
          window.location.href = "/";
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setBusinessAccount(json.data?.business_account ?? null);
        setVerificationStatus(json.data?.verification_status ?? "unverified");
      } catch (e) {
        console.error(e);
      } finally {
        setBusinessLoading(false);
      }
    })();
  }, []);

  // ── Debounce search ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Fetch customer accounts ────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "20",
        type: typeFilter,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/accounts/customers?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setCustomers(json.data?.accounts?.data ?? []);
      setMeta(json.data?.meta ?? null);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [currentPage, debouncedSearch, typeFilter]);

  useEffect(() => {
    if (activeTab === "customers") fetchCustomers();
  }, [fetchCustomers, activeTab]);

  const totalPages = meta?.last_page ?? 1;

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center pt-5 sm:pt-8 pb-10">
      <div className="max-w-310 w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Accounts
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your business account and customer virtual accounts
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(
            [
              { id: "business", label: "My Business Account" },
              { id: "customers", label: "Customer Accounts" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Business Account Tab ─────────────────────── */}
        {activeTab === "business" && (
          <div className="max-w-lg">
            {businessLoading ? (
              <div className="flex items-center justify-center py-16">
                <RiRefreshLine
                  className="animate-spin text-gray-400"
                  size={28}
                />
              </div>
            ) : (
              <BusinessAccountCard
                account={businessAccount}
                verificationStatus={verificationStatus}
              />
            )}
          </div>
        )}

        {/* ── Customer Accounts Tab ────────────────────── */}
        {activeTab === "customers" && (
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <RiSearchLine
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name, email, account number..."
                  className="pl-9 pr-4 py-2 rounded-full bg-white border border-gray-200 focus:border-gray-400 outline-none text-sm w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                {(["all", "static", "dynamic"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setCurrentPage(1);
                    }}
                    className={clsx(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                      typeFilter === t
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {t === "all"
                      ? "All"
                      : t === "static"
                        ? "Static"
                        : "Dynamic"}
                  </button>
                ))}
                <button
                  onClick={fetchCustomers}
                  className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RiRefreshLine
                    size={16}
                    className={customersLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {/* Table */}
            <Table variant="secondary" aria-label="Customer Accounts">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>CUSTOMER</Table.Column>
                    <Table.Column>ACCOUNT NUMBER</Table.Column>
                    <Table.Column>BANK</Table.Column>
                    <Table.Column>TYPE</Table.Column>
                    <Table.Column>TIER</Table.Column>
                    <Table.Column>STATUS</Table.Column>
                    <Table.Column>EXPIRES</Table.Column>
                    <Table.Column>CREATED</Table.Column>
                    <Table.Column className="text-right">ACTIONS</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {customersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Table.Row key={i}>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <Table.Cell key={j}>
                              <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[100px]" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    ) : customers.length === 0 ? (
                      <Table.Row>
                        <Table.Cell
                          colSpan={9}
                          className="text-center py-12 text-gray-400 text-sm"
                        >
                          No customer accounts found
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      customers.map((account) => (
                        <Table.Row key={account.id}>
                          <Table.Cell>
                            <div>
                              <p className="font-medium text-sm text-nowrap">
                                {account.customer_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {account.customer_email}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-nowrap">
                                {account.account_number}
                              </span>
                              <CopyButton
                                value={account.account_number}
                                label="account number"
                              />
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <p className="text-sm text-nowrap">
                              {account.bank_name}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            <TypeBadge type={account.type} />
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-sm font-medium">
                              Tier {account.tier}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <StatusBadge
                              status={account.status}
                              isExpired={account.is_expired}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <p className="text-sm text-gray-500 text-nowrap">
                              {account.expires_at
                                ? formatDate(account.expires_at)
                                : "Never"}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            <p className="text-sm text-gray-500 text-nowrap">
                              {formatDate(account.created_at)}
                            </p>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                              <RiMoreFill size={16} />
                            </button>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>

            {/* Pagination */}
            {!customersLoading && totalPages > 1 && meta && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}{" "}
                  accounts
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
                      if (i > 0 && p - (arr[i - 1] as number) > 1)
                        acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "..." ? (
                        <span key={`e-${i}`} className="px-2 text-gray-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item as number)}
                          className={clsx(
                            "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                            item === currentPage
                              ? "bg-gray-900 text-white border-gray-900"
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
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
