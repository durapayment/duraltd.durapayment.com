"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  RiAddLine,
  RiMoreFill,
  RiEyeLine,
  RiEyeOffLine,
  RiSearchLine,
  RiRefreshLine,
  RiCloseLine,
  RiUserLine,
  RiMailLine,
  RiPhoneLine,
  RiBankCardLine,
  RiBuilding2Line,
} from "react-icons/ri";
import { Avatar, Button, ProgressCircle, Table } from "@heroui/react";
import { authService, User } from "@/app/lib/auth";
import { BusinessVerificationStatus } from "@/app/components/business_verification_status";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface StaticAccount {
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
  status: string;
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

interface GenerateForm {
  customer_firstname: string;
  customer_lastname: string;
  customer_email: string;
  customer_phone: string;
}

interface GenerateResult {
  account_number: string;
  bank_name: string;
  account_name: string;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAccounts(data: any): StaticAccount[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────
// Generate Modal
// ─────────────────────────────────────────────────────────
function GenerateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (result: GenerateResult) => void;
}) {
  const [form, setForm] = useState<GenerateForm>({
    customer_firstname: "",
    customer_lastname: "",
    customer_email: "",
    customer_phone: "",
  });
  const [errors, setErrors] = useState<Partial<GenerateForm>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Partial<GenerateForm> = {};
    if (!form.customer_firstname.trim()) e.customer_firstname = "Required";
    if (!form.customer_lastname.trim()) e.customer_lastname = "Required";
    if (
      !form.customer_email.trim() ||
      !/\S+@\S+\.\S+/.test(form.customer_email)
    )
      e.customer_email = "Valid email required";
    if (!form.customer_phone.trim()) e.customer_phone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/accounts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.status === 500) {
        throw new Error(data.message || "Failed to generate account");
      }

      const bankAccount = data.data?.details?.bank_account ?? {};
      onSuccess({
        account_number: bankAccount.account_number ?? "—",
        bank_name: bankAccount.bank_name ?? "—",
        account_name: bankAccount.account_name ?? "—",
      });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof GenerateForm,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    type = "text",
  ) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: undefined }));
        }}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
          errors[key]
            ? "border-red-300 bg-red-50"
            : "border-gray-200 focus:border-gray-400 bg-gray-50 focus:bg-white"
        }`}
      />
      {errors[key] && (
        <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Generate Static Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field(
              "customer_firstname",
              "First Name",
              "John",
              <RiUserLine size={12} />,
            )}
            {field(
              "customer_lastname",
              "Last Name",
              "Doe",
              <RiUserLine size={12} />,
            )}
          </div>
          {field(
            "customer_email",
            "Email",
            "john@example.com",
            <RiMailLine size={12} />,
            "email",
          )}
          {field(
            "customer_phone",
            "Phone",
            "+234 800 000 0000",
            <RiPhoneLine size={12} />,
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {apiError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RiRefreshLine size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RiAddLine size={14} />
                Generate Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Success Modal — shown after generation
// ─────────────────────────────────────────────────────────
function SuccessModal({
  result,
  onClose,
}: {
  result: GenerateResult;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Account Generated</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
            <p className="text-green-700 text-sm font-medium">
              Static account created successfully
            </p>
          </div>

          {[
            {
              icon: <RiBankCardLine size={14} />,
              label: "Account Number",
              value: result.account_number,
              mono: true,
            },
            {
              icon: <RiBuilding2Line size={14} />,
              label: "Bank Name",
              value: result.bank_name,
            },
            {
              icon: <RiUserLine size={14} />,
              label: "Account Name",
              value: result.account_name,
            },
          ].map(({ icon, label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 text-gray-500 shrink-0">
                {icon}
                <span className="text-sm">{label}</span>
              </div>
              <span
                className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [business, setBusiness] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Accounts list state
  const [accounts, setAccounts] = useState<StaticAccount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(
    null,
  );

  // ── Load user/business ────────────────────────
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
        console.error("Auth error:", e);
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // ── Fetch static accounts ─────────────────────
  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/accounts/static?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load accounts");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      setAccounts(extractAccounts(json.data));
      setMeta(json.meta ?? null);
    } catch (err: unknown) {
      setAccountsError(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    if (!pageLoading) fetchAccounts();
  }, [fetchAccounts, pageLoading]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const handleGenerateSuccess = (result: GenerateResult) => {
    setShowGenerateModal(false);
    setGenerateResult(result);
    fetchAccounts(); // refresh list
  };

  const totalPages = meta?.last_page ?? 1;

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
        {/* Header */}
        <div className="flex gap-3 md:gap-0 flex-col md:flex-row items-start md:items-center justify-between mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">
              Main corporate account and customer sub accounts
            </p>
          </div>
          <Button
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl"
            onClick={() => setShowGenerateModal(true)}
          >
            <RiAddLine size={20} />
            Generate New Sub Account
          </Button>
        </div>

        {/* Balance Card */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-120">
          <div className="bg-accent px-5 py-6 gap-2 flex flex-col rounded-lg shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/75">
                  Bank name
                </p>
                <p className="font-semibold text-white text-[18px]">
                  DuraPayment MFB
                </p>
              </div>
              <Button
                variant="ghost"
                className="p-2 text-white hover:bg-white/10"
                isIconOnly
                aria-label={showBalance ? "Hide balance" : "Show balance"}
                onClick={() => setShowBalance((prev) => !prev)}
              >
                {showBalance ? (
                  <RiEyeLine size={18} />
                ) : (
                  <RiEyeOffLine size={18} />
                )}
              </Button>
            </div>
            <p className="font-medium text-white text-[15px]">
              Account No. {business?.account_number ?? "—"}
            </p>
            <p className="text-[30px] text-white font-semibold">
              {showBalance
                ? `₦${Number(business?.account_balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                : "****,***.**"}
            </p>
          </div>
        </div>

        {/* Sub Accounts Header + Search */}
        <div className="flex flex-col lg:flex-row gap-3 justify-start md:justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Customer Sub Accounts</h2>
            <p className="text-sm text-gray-500">
              Static accounts generated for customers
              {meta ? ` · ${meta.total} total` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <RiSearchLine
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search customer or account..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-400 bg-white w-56"
              />
            </div>
            <button
              onClick={fetchAccounts}
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RiRefreshLine
                size={15}
                className={accountsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {accountsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{accountsError}</span>
            <button onClick={fetchAccounts} className="underline ml-4">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Customer Sub Accounts">
              <Table.Header>
                <Table.Column isRowHeader>CUSTOMER</Table.Column>
                <Table.Column className={"text-nowrap"}>
                  ACCOUNT NUMBER
                </Table.Column>
                <Table.Column>BANK</Table.Column>
                <Table.Column>CURRENCY</Table.Column>
                <Table.Column>STATUS</Table.Column>
                <Table.Column>CREATED</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {accountsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Table.Row key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <Table.Cell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[120px]" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                ) : accounts.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={7}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No sub accounts yet. Generate one to get started.
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  accounts.map((account) => (
                    <Table.Row
                      key={account.id}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <Avatar.Fallback>
                              {account.customer_name
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="flex flex-col leading-4">
                            <p className="font-medium text-nowrap">
                              {account.customer_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {account.customer_email}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="font-mono text-sm text-gray-700">
                          {account.account_number}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm text-nowrap">
                          {account.bank_name}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {account.currency}
                        </span>
                      </Table.Cell>

                      <Table.Cell>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            account.status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {account.status.charAt(0).toUpperCase() +
                            account.status.slice(1)}
                        </span>
                      </Table.Cell>

                      <Table.Cell className="text-sm text-nowrap text-gray-500">
                        {formatDate(account.created_at)}
                      </Table.Cell>

                      <Table.Cell className="text-right">
                        <Button
                          variant="outline"
                          isIconOnly
                          aria-label="More options"
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

        {/* Pagination */}
        {!accountsLoading && meta && meta.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <p className="text-sm text-gray-500">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} accounts
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
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
                    <span key={`e-${i}`} className="px-2 text-gray-400">
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
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}

      {/* Success Modal */}
      {generateResult && (
        <SuccessModal
          result={generateResult}
          onClose={() => setGenerateResult(null)}
        />
      )}
    </div>
  );
}
