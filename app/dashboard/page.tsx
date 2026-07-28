"use client";

import {
  RiBuilding2Line,
  RiShieldCheckLine,
  RiExchangeDollarLine,
  RiUserAddLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
  RiRefreshLine,
  RiAlertLine,
  RiFlagLine,
  RiQuestionLine,
  RiCloseLine,
} from "react-icons/ri";
import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Analytics {
  businesses: {
    total: number;
    verified: number;
    under_review: number;
    rejected: number;
    incomplete: number;
    suspended: number;
  };
  users: {
    total: number;
    this_month: number;
  };
  transactions: {
    total: number;
    this_month: number;
    volume: number;
    volume_month: number;
  };
  complaints: {
    pending: number;
    reviewing: number;
    total: number;
  };
}

interface KYCBusiness {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  contact_email: string;
  verification_status: string;
  submitted_at: string | null;
  owner: { name: string; email: string } | null;
}

interface ComplaintQueueItem {
  id: string;
  complainant_name: string;
  complainant_email: string;
  match_status: "matched" | "ambiguous" | "unmatched";
  candidate_count: number;
  status: string;
  transaction: {
    reference: string;
    amount: number;
    business: string | null;
  } | null;
  created_at: string;
}

interface AdminInfo {
  name: string;
  role: string;
  role_label: string;
  permissions: string[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000)
    return "₦" + (amount / 1_000_000_000).toFixed(1) + "B";
  if (amount >= 1_000_000) return "₦" + (amount / 1_000_000).toFixed(1) + "M";
  if (amount >= 1_000) return "₦" + (amount / 1_000).toFixed(1) + "K";
  return "₦" + amount.toLocaleString("en-NG");
}

function timeAgo(dateString: string | null): string {
  if (!dateString) return "—";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  business_name: "Business Name",
  limited_liability: "Limited Liability",
};

const MATCH_STYLES: Record<
  string,
  { cls: string; icon: React.ElementType; label: string }
> = {
  matched: {
    cls: "bg-green-50 text-green-700",
    icon: RiCheckboxCircleLine,
    label: "Matched",
  },
  ambiguous: {
    cls: "bg-yellow-50 text-yellow-700",
    icon: RiQuestionLine,
    label: "Ambiguous",
  },
  unmatched: {
    cls: "bg-gray-100 text-gray-500",
    icon: RiCloseLine,
    label: "Unmatched",
  },
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 flex flex-col gap-4",
        accent
          ? "bg-accent border-accent text-white"
          : "bg-white border-gray-100",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={clsx(
            "text-[12px] uppercase tracking-widest font-medium",
            accent ? "text-white/60" : "text-gray-400",
          )}
        >
          {label}
        </p>
        <div
          className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            accent ? "bg-white/10" : "bg-gray-100",
          )}
        >
          <Icon size={16} className={accent ? "text-white" : "text-gray-500"} />
        </div>
      </div>

      {loading ? (
        <div
          className={clsx(
            "h-8 w-28 rounded animate-pulse",
            accent ? "bg-white/10" : "bg-gray-100",
          )}
        />
      ) : (
        <p
          className={clsx(
            "text-[28px] font-bold leading-none tracking-tight",
            accent ? "text-white" : "text-gray-900",
          )}
        >
          {value}
        </p>
      )}

      {sub && (
        <p
          className={clsx(
            "text-[13px]",
            accent ? "text-white/60" : "text-gray-400",
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// KYC Status Badge
// ─────────────────────────────────────────────────────────
function KYCBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    under_review: "bg-accent text-white",
    incomplete: "bg-gray-100 text-gray-600",
    rejected: "bg-gray-100 text-gray-600",
    verified: "bg-gray-100 text-gray-600",
    suspended: "bg-gray-100 text-gray-500",
  };

  const labels: Record<string, string> = {
    under_review: "Under Review",
    incomplete: "Incomplete",
    rejected: "Rejected",
    verified: "Verified",
    suspended: "Suspended",
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
// Verification Row
// ─────────────────────────────────────────────────────────
function VerificationRow({
  label,
  value,
  total,
  loading,
}: {
  label: string;
  value: number;
  total: number;
  loading: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <p className="text-[14px] text-gray-500 w-32 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        {!loading && (
          <div
            className="h-1.5 bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className="text-[14px] font-semibold text-gray-900 w-10 text-right shrink-0">
        {loading ? "—" : value.toLocaleString()}
      </p>
      <p className="text-[12px] text-gray-400 w-9 text-right shrink-0">
        {loading ? "" : `${pct}%`}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [kycQueue, setKycQueue] = useState<KYCBusiness[]>([]);
  const [complaintsQueue, setComplaintsQueue] = useState<ComplaintQueueItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [kycLoading, setKycLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Permission helper ──────────────────────────────────
  const can = (permission: string) =>
    admin?.permissions.includes(permission) ?? false;

  // ── Fetch admin info ───────────────────────────────────
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

  // ── Fetch analytics ────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load");
      setAnalytics(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch KYC queue ────────────────────────────────────
  const fetchKycQueue = useCallback(async () => {
    setKycLoading(true);
    try {
      const res = await fetch(
        "/api/admin/businesses?verification_status=under_review&per_page=8",
      );
      if (!res.ok) return;
      const json = await res.json();
      setKycQueue(json.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setKycLoading(false);
    }
  }, []);

  // ── Fetch Complaints queue ─────────────────────────────
  const fetchComplaintsQueue = useCallback(async () => {
    setComplaintsLoading(true);
    try {
      const res = await fetch(
        "/api/admin/complaints?status=pending&per_page=8",
      );
      if (!res.ok) return;
      const json = await res.json();
      setComplaintsQueue(json.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchKycQueue();
    fetchComplaintsQueue();
  }, [fetchAnalytics, fetchKycQueue, fetchComplaintsQueue]);

  const b = analytics?.businesses;
  const u = analytics?.users;
  const t = analytics?.transactions;
  const c = analytics?.complaints;

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
              {admin
                ? `${greeting()}, ${admin.name.split(" ")[0]}`
                : "Dashboard"}
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              {admin?.role_label ?? "Admin"} · DuraPayment Control Panel
            </p>
          </div>
          <button
            onClick={() => {
              fetchAnalytics();
              fetchKycQueue();
              fetchComplaintsQueue();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
          >
            <RiRefreshLine
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ── Error ───────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error}
            <button
              onClick={fetchAnalytics}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stat Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {can("approve_kyc") && (
            <StatCard
              label="KYC Pending"
              value={b?.under_review.toLocaleString() ?? "—"}
              sub={`${b?.rejected ?? 0} rejected · ${b?.incomplete ?? 0} incomplete`}
              icon={RiShieldCheckLine}
              loading={loading}
              accent
            />
          )}
          {can("handle_disputes") && (
            <StatCard
              label="Complaints Pending"
              value={c?.pending.toLocaleString() ?? "—"}
              sub={`${c?.reviewing ?? 0} in review · ${c?.total ?? 0} total`}
              icon={RiFlagLine}
              loading={loading}
              accent={!can("approve_kyc")}
            />
          )}
          {can("view_businesses") && (
            <StatCard
              label="Total Businesses"
              value={b?.total.toLocaleString() ?? "—"}
              sub={`${b?.verified ?? 0} verified`}
              icon={RiBuilding2Line}
              loading={loading}
            />
          )}
          {can("view_transactions") && (
            <StatCard
              label="Transaction Volume"
              value={t ? formatCurrency(t.volume) : "—"}
              sub={`${formatCurrency(t?.volume_month ?? 0)} this month`}
              icon={RiExchangeDollarLine}
              loading={loading}
            />
          )}
          {can("view_users") && (
            <StatCard
              label="New Users"
              value={u?.this_month.toLocaleString() ?? "—"}
              sub={`${u?.total.toLocaleString() ?? 0} total users`}
              icon={RiUserAddLine}
              loading={loading}
            />
          )}
        </div>

        {/* ── Two column layout ────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left column — queues (2/3 width) ─────── */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* KYC Review Queue */}
            {can("approve_kyc") && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <RiTimeLine size={17} className="text-gray-400" />
                    <h2 className="text-[16px] font-semibold text-gray-900">
                      KYC Review Queue
                    </h2>
                    {!kycLoading && kycQueue.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-accent text-white text-[11px] font-semibold">
                        {kycQueue.length}
                      </span>
                    )}
                  </div>
                  <a
                    href="/dashboard/businesses?status=under_review"
                    className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    View all <RiArrowRightLine size={13} />
                  </a>
                </div>

                {kycLoading ? (
                  <div className="divide-y divide-gray-50">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-36" />
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                        </div>
                        <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : kycQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <RiCheckboxCircleLine
                      size={28}
                      className="text-gray-300 mb-3"
                    />
                    <p className="text-[15px] font-semibold text-gray-700">
                      All caught up
                    </p>
                    <p className="text-[13px] text-gray-400 mt-1">
                      No businesses pending KYC review
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {kycQueue.map((business) => (
                      <a
                        key={business.id}
                        href={`/dashboard/businesses/${business.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-600 shrink-0">
                          {business.business_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-gray-900 truncate">
                            {business.business_name}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                            {BUSINESS_TYPE_LABELS[business.business_type] ??
                              business.business_type}
                            {business.owner?.email
                              ? ` · ${business.owner.email}`
                              : ""}
                          </p>
                        </div>

                        <p className="text-[12px] text-gray-400 shrink-0 hidden sm:block">
                          {timeAgo(business.submitted_at)}
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                          <KYCBadge status={business.verification_status} />
                          <RiArrowRightLine
                            size={14}
                            className="text-gray-300 group-hover:text-accent transition-colors"
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {!kycLoading && kycQueue.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <a
                      href="/dashboard/businesses?status=under_review"
                      className="text-[13px] font-medium text-gray-500 hover:text-accent flex items-center gap-1.5 transition-colors"
                    >
                      Review all pending submissions
                      <RiArrowRightLine size={13} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Complaints Queue */}
            {can("handle_disputes") && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <RiFlagLine size={17} className="text-gray-400" />
                    <h2 className="text-[16px] font-semibold text-gray-900">
                      Complaints Queue
                    </h2>
                    {!complaintsLoading && complaintsQueue.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-accent text-white text-[11px] font-semibold">
                        {complaintsQueue.length}
                      </span>
                    )}
                  </div>
                  <a
                    href="/dashboard/complaints"
                    className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    View all <RiArrowRightLine size={13} />
                  </a>
                </div>

                {complaintsLoading ? (
                  <div className="divide-y divide-gray-50">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-36" />
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                        </div>
                        <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : complaintsQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <RiCheckboxCircleLine
                      size={28}
                      className="text-gray-300 mb-3"
                    />
                    <p className="text-[15px] font-semibold text-gray-700">
                      No pending complaints
                    </p>
                    <p className="text-[13px] text-gray-400 mt-1">
                      Everything reported so far has been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {complaintsQueue.map((complaint) => {
                      const matchInfo = MATCH_STYLES[complaint.match_status];
                      const MatchIcon = matchInfo.icon;
                      return (
                        <a
                          key={complaint.id}
                          href={`/dashboard/complaints/${complaint.id}`}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-600 shrink-0">
                            {complaint.complainant_name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-gray-900 truncate">
                              {complaint.complainant_name}
                            </p>
                            <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                              {complaint.transaction
                                ? `${complaint.transaction.reference} · ${complaint.transaction.business ?? "—"}`
                                : complaint.complainant_email}
                            </p>
                          </div>

                          <p className="text-[12px] text-gray-400 shrink-0 hidden sm:block">
                            {timeAgo(complaint.created_at)}
                          </p>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium",
                                matchInfo.cls,
                              )}
                            >
                              <MatchIcon size={10} />
                              {matchInfo.label}
                            </span>
                            <RiArrowRightLine
                              size={14}
                              className="text-gray-300 group-hover:text-accent transition-colors"
                            />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}

                {!complaintsLoading && complaintsQueue.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <a
                      href="/dashboard/complaints"
                      className="text-[13px] font-medium text-gray-500 hover:text-accent flex items-center gap-1.5 transition-colors"
                    >
                      Review all pending complaints
                      <RiArrowRightLine size={13} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column (1/3 width) ─────────────── */}
          <div className="flex flex-col gap-5">
            {/* Verification Breakdown */}
            {can("view_businesses") && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-5">
                  Verification Breakdown
                </h3>
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Verified", value: b?.verified ?? 0 },
                    { label: "Under Review", value: b?.under_review ?? 0 },
                    { label: "Incomplete", value: b?.incomplete ?? 0 },
                    { label: "Rejected", value: b?.rejected ?? 0 },
                    { label: "Suspended", value: b?.suspended ?? 0 },
                  ].map(({ label, value }) => (
                    <VerificationRow
                      key={label}
                      label={label}
                      value={value}
                      total={b?.total ?? 0}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-col gap-1">
                {[
                  {
                    label: "Review KYC Submissions",
                    href: "/dashboard/businesses?status=under_review",
                    icon: RiShieldCheckLine,
                    show: can("approve_kyc"),
                  },
                  {
                    label: "Review Complaints",
                    href: "/dashboard/complaints",
                    icon: RiFlagLine,
                    show: can("handle_disputes"),
                  },
                  {
                    label: "All Businesses",
                    href: "/dashboard/businesses",
                    icon: RiBuilding2Line,
                    show: can("view_businesses"),
                  },
                  {
                    label: "All Transactions",
                    href: "/dashboard/transactions",
                    icon: RiExchangeDollarLine,
                    show: can("view_transactions"),
                  },
                  {
                    label: "Manage Admins",
                    href: "/dashboard/admins",
                    icon: RiUserAddLine,
                    show: can("manage_admins"),
                  },
                ]
                  .filter((a) => a.show)
                  .map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <Icon
                        size={16}
                        className="text-gray-400 shrink-0 group-hover:text-accent transition-colors"
                      />
                      <span className="text-[14px] text-gray-700 flex-1">
                        {label}
                      </span>
                      <RiArrowRightLine
                        size={13}
                        className="text-gray-300 group-hover:text-accent transition-colors"
                      />
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
