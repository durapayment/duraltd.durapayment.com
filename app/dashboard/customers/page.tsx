"use client";

import {
  RiSearchLine,
  RiUserAddLine,
  RiMoreFill,
  RiUserLine,
  RiUserFollowLine,
  RiCloseLine,
  RiPhoneLine,
  RiMailLine,
  RiTimeLine,
  RiRefreshLine,
} from "react-icons/ri";
import { Avatar, Button, ProgressCircle, Table } from "@heroui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { BusinessVerificationStatus } from "@/app/components/business_verification_status";
import { authService, User } from "@/app/lib/auth";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  paymentsCount: number;
  lastSeen: string;
  status: "active" | "inactive";
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
  total_customers: number;
  active_customers: number;
  total_revenue: number;
}

/**
 * Safely extract the customers array from the API response.
 * Handles both shapes Laravel may return:
 *   Shape A: { data: [...], meta, stats }
 *   Shape B: { data: { data: [...], current_page, ... }, meta, stats }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCustomers(data: any): Customer[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
}

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PER_PAGE = 20;

function formatCurrency(amount: number): string {
  return (
    "₦" +
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount ?? 0)
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: Customer["status"] }) {
  const styles: Record<Customer["status"], string> = {
    active: "bg-green-50 text-green-600",
    inactive: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CustomerModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Customer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Profile Hero */}
        <div className="flex flex-col items-center py-6 px-5 bg-gray-50 border-b border-gray-100">
          <Avatar className="w-16 h-16 mb-3">
            <Avatar.Fallback className="text-lg">{initials}</Avatar.Fallback>
          </Avatar>
          <h3 className="font-semibold text-gray-900 text-lg">
            {customer.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{customer.id}</p>
          <StatusBadge status={customer.status} />
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          {[
            {
              icon: <RiMailLine size={15} />,
              label: "Email",
              value: customer.email,
            },
            {
              icon: <RiPhoneLine size={15} />,
              label: "Phone",
              value: customer.phone || "—",
            },
            {
              icon: <RiUserLine size={15} />,
              label: "Total Spent",
              value: formatCurrency(customer.totalSpent),
              green: true,
            },
            {
              icon: <RiUserLine size={15} />,
              label: "Total Payments",
              value: String(customer.paymentsCount),
            },
            {
              icon: <RiTimeLine size={15} />,
              label: "Last Seen",
              value: formatDate(customer.lastSeen),
            },
          ].map(({ icon, label, value, green }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 text-gray-500 shrink-0">
                {icon}
                <span className="text-sm">{label}</span>
              </div>
              <span
                className={`text-sm text-right ${
                  green ? "font-semibold text-green-600" : "text-gray-900"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {/* <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1">
            View Transactions
          </Button>
          <Button className="flex-1 bg-black text-white">Edit Customer</Button>
        </div> */}
        <div className="h-3"></div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(PER_PAGE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/customers?${params.toString()}`);

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load customers");
      }

      // Use `any` here intentionally — the response shape can vary
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      // console.log("API response:", JSON.stringify(json, null, 2));

      setCustomers(extractCustomers(json.data));
      setMeta(json.meta ?? null);
      setStats(json.stats ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchUser = async () => {
    try {
      const { isAuthenticated, user, business, summary } =
        await authService.checkAuth();

      if (isAuthenticated && user) {
        setUser(user);
        setBusiness(business);
        console.log(summary?.recent_customers);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
      setUserLoading(false); // ← add this
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const totalPages = meta?.last_page ?? 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center mt-10 flex flex-col items-center">
          <ProgressCircle isIndeterminate aria-label="Loading...">
            <ProgressCircle.Track>
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
          </ProgressCircle>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex h-full flex-col items-center pt-5 sm:pt-6 pb-5 sm:pb-8">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {!userLoading && business?.verification_status !== "verified" && (
          <BusinessVerificationStatus status={business?.verification_status} />
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center mt-4">
          <div className="">
            <h1 className="text-[26px] md:text-[30px] font-bold text-gray-900 tracking-tight">
              Customers
            </h1>
            <p className="text-[14px] text-gray-500 mt-1">
              Manage all your payment customers
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-black text-white">
            <RiUserAddLine size={18} />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <RiUserLine className="text-blue-600" size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? stats.total_customers.toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <RiUserFollowLine className="text-green-600" size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active (30 days)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? stats.active_customers.toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <RiUserLine className="text-purple-600" size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? formatCurrency(stats.total_revenue) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          <div className="relative w-full md:max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, email or phone..."
              className="px-10 py-2 rounded-full bg-white outline-none w-full border border-gray-200 focus:border-gray-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusFilter(s.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s.value
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={fetchCustomers}
              className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RiRefreshLine
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={fetchCustomers}
              className="underline text-red-600 ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Customers Table */}
        <Table variant="secondary" aria-label="Customers Table">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>CUSTOMER</Table.Column>
                <Table.Column className={"text-nowrap"}>
                  TOTAL SPENT
                </Table.Column>
                <Table.Column>PAYMENTS</Table.Column>
                <Table.Column>STATUS</Table.Column>
                <Table.Column className={"text-nowrap"}>LAST SEEN</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Table.Row key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <Table.Cell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[120px]" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                ) : customers.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={6}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No customers match your search
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  customers.map((customer) => (
                    <Table.Row
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <Avatar.Fallback>
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-nowrap">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="font-medium text-green-600 text-nowrap">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm font-medium">
                          {customer.paymentsCount}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <StatusBadge status={customer.status} />
                      </Table.Cell>

                      <Table.Cell className="text-sm text-nowrap text-gray-500">
                        {formatDate(customer.lastSeen)}
                      </Table.Cell>

                      <Table.Cell className="text-right">
                        <Button
                          variant="outline"
                          isIconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
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

        {/* Pagination */}
        {!loading && totalPages > 1 && meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <p className="text-sm text-gray-500">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} customers
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
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
