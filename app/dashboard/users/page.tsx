"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RiUserLine,
  RiRefreshLine,
  RiAlertLine,
  RiSearchLine,
  RiCheckLine,
  RiCloseLine,
  RiLockLine,
  RiLockUnlockLine,
} from "react-icons/ri";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type UserStatus =
  | "active"
  | "suspended"
  | "deactivated"
  | "pending_verification";

interface UserBusiness {
  id: string;
  name: string;
  verification_status: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  status: UserStatus;
  suspended_at: string | null;
  suspension_reason: string | null;
  businesses: UserBusiness[];
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

interface CurrentAdmin {
  permissions: string[];
}

// ─────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────
function StatusBadge({
  status,
  reason,
}: {
  status: UserStatus;
  reason: string | null;
}) {
  const map: Record<UserStatus, { cls: string; label: string }> = {
    active: { cls: "bg-green-50 text-green-700", label: "Active" },
    suspended: { cls: "bg-red-50 text-red-700", label: "Suspended" },
    deactivated: { cls: "bg-gray-100 text-gray-500", label: "Deactivated" },
    pending_verification: {
      cls: "bg-yellow-50 text-yellow-700",
      label: "Pending Verification",
    },
  };
  const { cls, label } = map[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
      title={status === "suspended" ? (reason ?? undefined) : undefined}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Suspend Modal
// ─────────────────────────────────────────────────────────
function SuspendModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: (name: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuspend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to suspend user");
      onSuccess(user.name);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to suspend user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[16px] text-gray-900">
            Suspend User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            Suspending{" "}
            <span className="font-semibold text-gray-900">{user.name}</span>{" "}
            will revoke their active sessions and block them from logging in.
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Reason{" "}
              <span className="text-gray-400 normal-case font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for suspension"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSuspend}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RiRefreshLine size={14} className="animate-spin" />
                Suspending…
              </>
            ) : (
              "Suspend"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [suspendTarget, setSuspendTarget] = useState<UserRow | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "15",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load users");
      setUsers(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleActivate = async (user: UserRow) => {
    setActioningId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/activate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to reactivate user");
      showSuccess(`${user.name} reactivated`);
      fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reactivate user");
    } finally {
      setActioningId(null);
    }
  };

  const canView = currentAdmin?.permissions.includes("view_users") ?? false;
  const canSuspend =
    currentAdmin?.permissions.includes("suspend_user") ?? false;
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
            You don't have permission to view users.
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
              Users
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              All registered business owners
              {meta ? ` · ${meta.total} total` : ""}
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
          >
            <RiRefreshLine
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <RiCheckLine size={15} />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error}
            <button
              onClick={fetchUsers}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <RiSearchLine
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search name, email, phone…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-400 bg-white w-64"
            />
          </div>
          <div className="px-3 py-2 border border-gray-200 rounded-full bg-white">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm outline-none cursor-pointer bg-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
              <option value="pending_verification">Pending Verification</option>
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[100px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-14 text-gray-400 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RiUserLine size={32} className="opacity-30" />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() =>
                      (window.location.href = `/dashboard/users/${u.id}`)
                    }
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[12px] font-bold text-gray-600 shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[160px]">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700 truncate max-w-[180px]">
                        {u.email}
                      </p>
                      <p className="text-xs text-gray-400">{u.phone_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      {u.businesses.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        u.businesses.map((b) => (
                          <p
                            key={b.id}
                            className="truncate max-w-[160px] text-gray-700"
                          >
                            {b.name}
                          </p>
                        ))
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={u.status}
                        reason={u.suspension_reason}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-nowrap">
                      {new Date(u.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canSuspend && u.status === "active" && (
                        <button
                          onClick={() => setSuspendTarget(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          <RiLockLine size={13} />
                          Suspend
                        </button>
                      )}
                      {canSuspend && u.status === "suspended" && (
                        <button
                          onClick={() => handleActivate(u)}
                          disabled={actioningId === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors disabled:opacity-40"
                        >
                          <RiLockUnlockLine size={13} />
                          {actioningId === u.id
                            ? "Reactivating…"
                            : "Reactivate"}
                        </button>
                      )}
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
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} users
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

      {suspendTarget && (
        <SuspendModal
          user={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onSuccess={showSuccess}
        />
      )}
    </div>
  );
}
