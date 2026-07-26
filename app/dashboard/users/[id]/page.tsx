"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  RiUserLine,
  RiRefreshLine,
  RiAlertLine,
  RiArrowLeftLine,
  RiLockLine,
  RiLockUnlockLine,
  RiMailLine,
  RiPhoneLine,
  RiShieldCheckLine,
  RiBuilding2Line,
  RiCheckLine,
  RiCloseLine,
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
  balance: number;
  created_at: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  phone_country_code: string | null;
  country: string;
  status: UserStatus;
  suspended_at: string | null;
  suspension_reason: string | null;
  email_verified_at: string | null;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  referal_code: string | null;
  referred_by: string | null;
  businesses: UserBusiness[];
  created_at: string;
}

interface CurrentAdmin {
  permissions: string[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(amount: number) {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

const STATUS_STYLES: Record<UserStatus, { cls: string; label: string }> = {
  active: { cls: "bg-green-50 text-green-700", label: "Active" },
  suspended: { cls: "bg-red-50 text-red-700", label: "Suspended" },
  deactivated: { cls: "bg-gray-100 text-gray-500", label: "Deactivated" },
  pending_verification: {
    cls: "bg-yellow-50 text-yellow-700",
    label: "Pending Verification",
  },
};

// ─────────────────────────────────────────────────────────
// Detail row
// ─────────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Suspend Modal (same as list page)
// ─────────────────────────────────────────────────────────
function SuspendModal({
  userName,
  onClose,
  onConfirm,
}: {
  userName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuspend = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason);
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
            <span className="font-semibold text-gray-900">{userName}</span> will
            revoke their active sessions and block them from logging in.
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
// Page
// ─────────────────────────────────────────────────────────
export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load user");
      setUser(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSuspendConfirm = async (reason: string) => {
    const res = await fetch(`/api/admin/users/${id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Failed to suspend user");
    showSuccess("User suspended");
    fetchUser();
  };

  const handleActivate = async () => {
    setActioning(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/activate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to reactivate user");
      showSuccess("User reactivated");
      fetchUser();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reactivate user");
    } finally {
      setActioning(false);
    }
  };

  const canView = currentAdmin?.permissions.includes("view_users") ?? false;
  const canSuspend =
    currentAdmin?.permissions.includes("suspend_user") ?? false;

  if (currentAdmin && !canView) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col items-center justify-center py-20 text-center px-4">
          <RiAlertLine size={28} className="text-gray-300 mb-3" />
          <p className="text-[15px] font-semibold text-gray-700">
            Not authorized
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col gap-6 px-4 sm:px-0">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col gap-6 px-4 sm:px-0">
          <a
            href="/dashboard/users"
            className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1"
          >
            <RiArrowLeftLine size={13} /> All users
          </a>
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error ?? "User not found"}
            <button
              onClick={fetchUser}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_STYLES[user.status];

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        {/* ── Header ── */}
        <div>
          <a
            href="/dashboard/users"
            className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1 mb-3 transition-colors"
          >
            <RiArrowLeftLine size={13} /> All users
          </a>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-[20px] font-bold text-accent shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-gray-900 tracking-tight leading-tight">
                  {user.name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.cls}`}
                  >
                    {statusInfo.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    Joined {fmtDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {canSuspend && (
              <div>
                {user.status === "active" && (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    <RiLockLine size={15} />
                    Suspend
                  </button>
                )}
                {user.status === "suspended" && (
                  <button
                    onClick={handleActivate}
                    disabled={actioning}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors disabled:opacity-40"
                  >
                    <RiLockUnlockLine size={15} />
                    {actioning ? "Reactivating…" : "Reactivate"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            <RiCheckLine size={15} />
            {successMsg}
          </div>
        )}

        {user.status === "suspended" && user.suspension_reason && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <RiAlertLine size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                Suspended {fmtDate(user.suspended_at)}
              </p>
              <p className="mt-0.5">{user.suspension_reason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: account details ── */}
          <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <RiUserLine size={16} className="text-gray-400" />
              Account Details
            </h3>
            <div className="divide-y divide-gray-50">
              <DetailRow
                label="Email"
                value={
                  <span className="flex items-center gap-1.5 justify-end">
                    {user.email}
                    {user.email_verified_at && (
                      <RiShieldCheckLine size={13} className="text-green-500" />
                    )}
                  </span>
                }
              />
              <DetailRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1.5 justify-end">
                    {user.phone_country_code
                      ? `${user.phone_country_code} `
                      : ""}
                    {user.phone_number}
                    {user.phone_verified && (
                      <RiShieldCheckLine size={13} className="text-green-500" />
                    )}
                  </span>
                }
              />
              <DetailRow label="Country" value={user.country} />
              <DetailRow
                label="2FA Enabled"
                value={user.two_factor_enabled ? "Yes" : "No"}
              />
              <DetailRow
                label="Last Login"
                value={fmtDate(user.last_login_at)}
              />
              <DetailRow
                label="Last Login IP"
                value={user.last_login_ip ?? "—"}
              />
              {user.referal_code && (
                <DetailRow
                  label="Referral Code"
                  value={
                    <span className="font-mono text-xs">
                      {user.referal_code}
                    </span>
                  }
                />
              )}
              {user.referred_by && (
                <DetailRow label="Referred By" value={user.referred_by} />
              )}
            </div>
          </div>

          {/* ── Right: businesses ── */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <RiBuilding2Line size={17} className="text-gray-400" />
              <h2 className="text-[16px] font-semibold text-gray-900">
                Businesses
              </h2>
            </div>

            {user.businesses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <RiBuilding2Line size={28} className="text-gray-300 mb-3" />
                <p className="text-[15px] font-semibold text-gray-700">
                  No businesses
                </p>
                <p className="text-[13px] text-gray-400 mt-1">
                  This user hasn't registered a business yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {user.businesses.map((b) => (
                  <a
                    key={b.id}
                    href={`/dashboard/businesses/${b.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-600 shrink-0">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">
                        {b.name}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {fmtCurrency(b.balance)} balance · Created{" "}
                        {fmtDate(b.created_at)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 capitalize shrink-0">
                      {b.verification_status.replace("_", " ")}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSuspendModal && (
        <SuspendModal
          userName={user.name}
          onClose={() => setShowSuspendModal(false)}
          onConfirm={handleSuspendConfirm}
        />
      )}
    </div>
  );
}
