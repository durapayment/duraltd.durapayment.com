"use client";

import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiExternalLinkLine,
  RiLoader4Line,
  RiAlertLine,
  RiFileTextLine,
  RiUserLine,
  RiBuilding2Line,
  RiShieldCheckLine,
  RiBankLine,
} from "react-icons/ri";
import { useState, useEffect } from "react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface DocumentInfo {
  type: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  status: string | null;
  url: string | null;
  file_name: string | null;
  rejection_reason: string | null;
  uploaded_at: string | null;
}

interface Director {
  id: string;
  full_name: string;
  role: string;
  bvn: string | null;
  nin: string | null;
  ownership_percentage: number | null;
  is_pep: boolean;
  verification_status: string;
  documents: {
    government_id: {
      uploaded: boolean;
      url: string | null;
      status: string | null;
    };
    proof_of_address: {
      uploaded: boolean;
      url: string | null;
      status: string | null;
    };
  };
}

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

interface BusinessDetail {
  id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  business_industry: string | null;
  contact_email: string;
  contact_phone: string | null;
  verification_status: string;
  compliance_step: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  risk_level: string;
  bvn: string | null;
  nin: string | null;
  date_of_birth: string | null;
  registration_number: string | null;
  registration_number_type: "RC" | "BN" | null;
  incorporation_date: string | null;
  website: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  owner: { id: string; name: string; email: string; phone: string } | null;
  created_at: string;
  documents: Record<string, DocumentInfo>;
  directors: Director[];
  business_account: BusinessAccount | null;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number | null): string {
  if (!amount) return "Unlimited";
  return "₦" + amount.toLocaleString("en-NG");
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  business_name: "Business Name",
  limited_liability: "Limited Liability",
};

// ─────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-gray-900 text-white",
    under_review: "bg-accent text-white",
    approved: "bg-gray-900 text-white",
    incomplete: "bg-gray-100 text-gray-600",
    rejected: "bg-gray-100 text-gray-600",
    suspended: "bg-gray-100 text-gray-500",
    pending: "bg-gray-100 text-gray-500",
    submitted: "bg-accent/10 text-accent",
    active: "bg-gray-900 text-white",
  };
  const labels: Record<string, string> = {
    verified: "Verified",
    under_review: "Under Review",
    approved: "Approved",
    incomplete: "Incomplete",
    rejected: "Rejected",
    suspended: "Suspended",
    pending: "Pending",
    submitted: "Submitted",
    active: "Active",
  };
  return (
    <span
      className={clsx(
        "inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium",
        map[status] ?? "bg-gray-100 text-gray-500",
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-gray-400" />
          <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Info Row
// ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-[13px] text-gray-400 sm:w-40 shrink-0">{label}</p>
      <div className="text-[14px] font-medium text-gray-900 min-w-0">
        {value ?? <span className="text-gray-300 font-normal">—</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Action Modal (approve / reject / suspend / activate)
// ─────────────────────────────────────────────────────────
type ModalAction = "approve" | "reject" | "suspend" | "activate" | null;

function ActionModal({
  action,
  businessName,
  onConfirm,
  onClose,
}: {
  action: ModalAction;
  businessName: string;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsReason = action === "reject" || action === "suspend";

  const config = {
    approve: {
      title: "Approve KYC",
      desc: `This will mark "${businessName}" as verified and grant full platform access.`,
      btn: "Approve",
      btnCls: "bg-gray-900 text-white hover:bg-gray-800",
    },
    reject: {
      title: "Reject KYC",
      desc: `This will reject "${businessName}"'s KYC submission. They will be notified with your reason.`,
      btn: "Reject",
      btnCls: "bg-red-600 text-white hover:bg-red-700",
    },
    suspend: {
      title: "Suspend Business",
      desc: `This will suspend "${businessName}" and block all transactions immediately.`,
      btn: "Suspend",
      btnCls: "bg-red-600 text-white hover:bg-red-700",
    },
    activate: {
      title: "Activate Business",
      desc: `This will reactivate "${businessName}" and restore full access.`,
      btn: "Activate",
      btnCls: "bg-gray-900 text-white hover:bg-gray-800",
    },
  };

  const cfg = action ? config[action] : null;
  if (!cfg || !action) return null;

  const handleConfirm = async () => {
    if (needsReason && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(needsReason ? reason : undefined);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-[16px] font-bold text-gray-900">{cfg.title}</h3>
          <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">
            {cfg.desc}
          </p>
        </div>

        <div className="px-6 py-5">
          {needsReason && (
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Reason *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(null);
                }}
                placeholder={
                  action === "reject"
                    ? "e.g. Documents are blurry or incomplete..."
                    : "e.g. Suspicious activity detected..."
                }
                className="w-full px-4 py-3 text-[14px] border border-gray-200 rounded-xl focus:border-accent focus:outline-none resize-none"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 text-[13px] text-red-600">
              <RiAlertLine size={14} /> {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={clsx(
              "px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-60",
              cfg.btnCls,
            )}
          >
            {loading && <RiLoader4Line size={14} className="animate-spin" />}
            {cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Create Account Modal
// ─────────────────────────────────────────────────────────
function CreateAccountModal({
  business,
  onSuccess,
  onClose,
  isUpgrade = false, // ← new prop
  currentTier = "1", // ← new prop
}: {
  business: BusinessDetail;
  onSuccess: (account: BusinessAccount) => void;
  onClose: () => void;
  isUpgrade?: boolean;
  currentTier?: string;
}) {
  // ── Start from next tier if upgrading ──────────────────
  const defaultTier = isUpgrade
    ? (String(Number(currentTier) + 1) as "1" | "2" | "3")
    : "1";

  const [tier, setTier] = useState<"1" | "2" | "3">(
    defaultTier as "1" | "2" | "3",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLLC = business.business_type === "limited_liability";

  // ── Only show tiers higher than current when upgrading ─
  const TIERS = [
    {
      value: "1" as const,
      label: "Tier 1",
      sub: isLLC
        ? "Corporate account — Director BVN + NIN required"
        : "BVN + Date of Birth · ₦50,000 daily limit",
      available: !isUpgrade && !isLLC,
    },
    {
      value: "2" as const,
      label: "Tier 2",
      sub: "BVN + DOB + NIN · ₦200,000 daily limit",
      available: !isLLC && (!isUpgrade || Number(currentTier) < 2),
    },
    {
      value: "3" as const,
      label: "Tier 3",
      sub: "BVN + DOB + NIN + Address · Unlimited",
      available: !isLLC && (!isUpgrade || Number(currentTier) < 3),
    },
  ].filter((t) => t.available || (!isUpgrade && t.value === "1"));

  const checks = [
    { label: "BVN", ok: !!business.bvn, show: true },
    { label: "Date of Birth", ok: !!business.date_of_birth, show: true },
    {
      label: "NIN",
      ok: !!business.nin,
      show: (tier === "2" || tier === "3") && !isLLC,
    },
    { label: "Address", ok: !!business.business_address, show: tier === "3" },
    { label: "RC Number", ok: !!business.registration_number, show: isLLC },
    {
      label: "Director with BVN & NIN",
      ok: business.directors?.some((d) => !!d.bvn && !!d.nin) ?? false,
      show: isLLC,
    },
  ].filter((c) => c.show);

  const allChecksPass = checks.every((c) => c.ok);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      // ── Use upgrade endpoint if upgrading ──────────────
      const endpoint = isUpgrade
        ? `/api/admin/businesses/${business.id}/upgrade-account`
        : `/api/admin/businesses/${business.id}/create-account`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed");
      onSuccess(json.data);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-[16px] font-bold text-gray-900">
            {isUpgrade ? "Upgrade Account" : "Create Account"}
          </h3>
          <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">
            {isUpgrade
              ? `Upgrade from Tier ${currentTier} to a higher tier for increased transaction limits.`
              : isLLC
                ? "A corporate account will be created for this Limited Liability Company."
                : "Select the account tier. Higher tiers have higher transaction limits."}
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Tier selection */}
          <div className="flex flex-col gap-2">
            {TIERS.map((t) => (
              <label
                key={t.value}
                className={clsx(
                  "flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors",
                  tier === t.value
                    ? "border-accent bg-accent/5"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                <input
                  type="radio"
                  name="tier"
                  value={t.value}
                  checked={tier === t.value}
                  onChange={() => setTier(t.value)}
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">
                    {t.label}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{t.sub}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Required fields check */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Required fields
            </p>
            <div className="flex flex-col gap-2">
              {checks.map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div
                    className={clsx(
                      "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                      ok ? "bg-gray-900" : "bg-gray-200",
                    )}
                  >
                    {ok ? "✓" : "✗"}
                  </div>
                  <p
                    className={clsx(
                      "text-[13px]",
                      ok ? "text-gray-700" : "text-gray-400",
                    )}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
            {!allChecksPass && (
              <p className="text-[12px] text-amber-600 mt-3 flex items-center gap-1.5">
                <RiAlertLine size={13} />
                Some required fields are missing. Update business info first.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              <RiAlertLine size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || !allChecksPass}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <RiLoader4Line size={14} className="animate-spin" />}
            {isUpgrade ? "Upgrade Account" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    msg: string;
  } | null>(null);

  // ── Resolve params ─────────────────────────────────────
  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  // ── Fetch business ─────────────────────────────────────
  const fetchBusiness = async (businessId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load");
      setBusiness(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load business");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBusiness(id);
  }, [id]);

  // ── Show feedback ──────────────────────────────────────
  const showFeedback = (type: "ok" | "err", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Handle KYC / status action ─────────────────────────
  const handleAction = async (reason?: string) => {
    if (!id || !modalAction) return;

    const res = await fetch(`/api/admin/businesses/${id}/${modalAction}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reason ? { reason } : {}),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Action failed");

    showFeedback("ok", json.message);
    await fetchBusiness(id);
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RiLoader4Line size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (error || !business) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center">
          <p className="text-[14px] text-gray-600 mb-3">
            {error ?? "Business not found"}
          </p>
          <button
            onClick={() => id && fetchBusiness(id)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const status = business.verification_status;
  const docs = Object.values(business.documents ?? {});

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center pt-2 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-5">
        {/* ── Back ────────────────────────────────────── */}
        <div>
          <a
            href="/dashboard/businesses"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-accent transition-colors mb-4"
          >
            <RiArrowLeftLine size={14} />
            Back to businesses
          </a>

          {/* ── Header ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight capitalize">
                  {business.business_name}
                </h1>
                <StatusBadge status={status} />
              </div>
              <p className="text-[14px] text-gray-400 mt-1">
                {business.business_id} ·{" "}
                {BUSINESS_TYPE_LABELS[business.business_type] ??
                  business.business_type}
              </p>
            </div>

            {/* ── Action Buttons ───────────────────── */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {status === "under_review" && (
                <>
                  <button
                    onClick={() => setModalAction("approve")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <RiCheckboxCircleLine size={15} />
                    Approve KYC
                  </button>
                  <button
                    onClick={() => setModalAction("reject")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <RiCloseCircleLine size={15} />
                    Reject
                  </button>
                </>
              )}
              {(status === "verified" || status === "under_review") && (
                <button
                  onClick={() => setModalAction("suspend")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RiPauseCircleLine size={15} />
                  Suspend
                </button>
              )}
              {status === "suspended" && (
                <button
                  onClick={() => setModalAction("activate")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
                >
                  <RiPlayCircleLine size={15} />
                  Activate
                </button>
              )}
              {status === "rejected" && (
                <button
                  onClick={() => setModalAction("approve")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors"
                >
                  <RiCheckboxCircleLine size={15} />
                  Approve Anyway
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Feedback toast ───────────────────────────── */}
        {feedback && (
          <div
            className={clsx(
              "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-[14px] font-medium text-white shadow-xl transition-all",
              feedback.type === "ok" ? "bg-gray-900" : "bg-red-600",
            )}
          >
            {feedback.msg}
          </div>
        )}

        {/* ── Rejection reason banner ──────────────────── */}
        {status === "rejected" && business.rejection_reason && (
          <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <RiAlertLine size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-gray-700">
                Rejection Reason
              </p>
              <p className="text-[14px] text-gray-600 mt-0.5">
                {business.rejection_reason}
              </p>
              {business.reviewed_by && (
                <p className="text-[12px] text-gray-400 mt-1">
                  By {business.reviewed_by} · {formatDate(business.reviewed_at)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Two column layout ────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── Left (2/3) ───────────────────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            {/* Business Info */}
            <SectionCard title="Business Information" icon={RiBuilding2Line}>
              <InfoRow
                label="Business Name"
                value={
                  <span className="capitalize">{business.business_name}</span>
                }
              />
              <InfoRow
                label="Business ID"
                value={
                  <span className="font-mono text-[13px]">
                    {business.business_id}
                  </span>
                }
              />
              <InfoRow
                label="Type"
                value={
                  BUSINESS_TYPE_LABELS[business.business_type] ??
                  business.business_type
                }
              />
              <InfoRow label="Industry" value={business.business_industry} />
              <InfoRow
                label="Registration No."
                value={business.registration_number}
              />
              <InfoRow
                label="BVN"
                value={
                  business.bvn ? "••••••••" + business.bvn.slice(-3) : null
                }
              />
              <InfoRow
                label="NIN"
                value={
                  business.nin ? "••••••••" + business.nin.slice(-3) : null
                }
              />
              <InfoRow
                label="Date of Birth"
                value={
                  business.date_of_birth
                    ? new Date(business.date_of_birth).toLocaleDateString(
                        "en-NG",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : null
                }
              />
              <InfoRow
                label="Website"
                value={
                  business.website ? (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent flex items-center gap-1 hover:underline"
                    >
                      {business.website}
                      <RiExternalLinkLine size={12} />
                    </a>
                  ) : null
                }
              />
              <InfoRow
                label="Address"
                value={
                  [
                    business.business_address,
                    business.business_city,
                    business.business_state,
                  ]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
              <InfoRow label="Email" value={business.contact_email} />
              <InfoRow label="Phone" value={business.contact_phone} />
              <InfoRow
                label="Risk Level"
                value={
                  <span className="capitalize">{business.risk_level}</span>
                }
              />
              <InfoRow
                label="Registered"
                value={formatDate(business.created_at)}
              />
              <InfoRow
                label="Submitted"
                value={formatDate(business.submitted_at)}
              />
            </SectionCard>

            {/* Owner Info */}
            {business.owner && (
              <SectionCard title="Business Owner" icon={RiUserLine}>
                <InfoRow label="Full Name" value={business.owner.name} />
                <InfoRow label="Email" value={business.owner.email} />
                <InfoRow label="Phone" value={business.owner.phone} />
              </SectionCard>
            )}

            {/* Directors */}
            {business.directors.length > 0 && (
              <SectionCard
                title={`Directors (${business.directors.length})`}
                icon={RiUserLine}
              >
                <div className="flex flex-col gap-4">
                  {business.directors.map((director) => (
                    <div
                      key={director.id}
                      className="p-4 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-semibold text-gray-900">
                              {director.full_name}
                            </p>
                            {director.is_pep && (
                              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                PEP
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-400 mt-0.5 capitalize">
                            {director.role.replace(/_/g, " ")}
                            {director.ownership_percentage != null
                              ? ` · ${director.ownership_percentage}% ownership`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge status={director.verification_status} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                            BVN
                          </p>
                          <p className="text-[14px] font-mono text-gray-700">
                            {director.bvn
                              ? "••••••••" + director.bvn.slice(-3)
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                            NIN
                          </p>
                          <p className="text-[14px] font-mono text-gray-700">
                            {director.nin
                              ? "••••••••" + director.nin.slice(-3)
                              : "—"}
                          </p>
                        </div>
                        {(["government_id", "proof_of_address"] as const).map(
                          (docType) => {
                            const doc = director.documents[docType];
                            return (
                              <div key={docType}>
                                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                                  {docType === "government_id"
                                    ? "Gov. ID"
                                    : "Proof of Address"}
                                </p>
                                {doc.uploaded && doc.url ? (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-accent text-[13px] flex items-center gap-1 hover:underline"
                                  >
                                    View document
                                    <RiExternalLinkLine size={11} />
                                  </a>
                                ) : (
                                  <span className="text-[13px] text-gray-300">
                                    Not uploaded
                                  </span>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── Right (1/3) ──────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* KYC Status */}
            <SectionCard title="KYC Status" icon={RiShieldCheckLine}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-gray-400">Status</p>
                  <StatusBadge status={status} />
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <p className="text-[13px] text-gray-400">Compliance Step</p>
                  <p className="text-[14px] font-semibold text-gray-900">
                    {business.compliance_step} / 4
                  </p>
                </div>
                {business.reviewed_by && (
                  <>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <p className="text-[13px] text-gray-400">Reviewed by</p>
                      <p className="text-[14px] font-semibold text-gray-900">
                        {business.reviewed_by}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <p className="text-[13px] text-gray-400">Reviewed at</p>
                      <p className="text-[13px] text-gray-600">
                        {formatDate(business.reviewed_at)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>

            {/* Business Account */}
            <SectionCard
              title="Business Account"
              icon={RiBankLine}
              action={
                !business.business_account && status === "verified" ? (
                  // ── No account yet — show create button ────────────
                  <button
                    onClick={() => {
                      setIsUpgrading(false);
                      setShowCreateAccount(true);
                    }}
                    className="text-[12px] font-semibold text-accent hover:underline"
                  >
                    + Create Account
                  </button>
                ) : business.business_account &&
                  business.business_type !== "limited_liability" &&
                  business.business_account.tier !== "3" ? (
                  // ── Has account + not LLC + not max tier — show upgrade ─
                  <button
                    onClick={() => {
                      setIsUpgrading(true);
                      setShowCreateAccount(true);
                    }}
                    className="text-[12px] font-semibold text-accent hover:underline"
                  >
                    ↑ Upgrade Tier
                  </button>
                ) : undefined
              }
            >
              {business.business_account ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-gray-400">Status</p>
                    <StatusBadge status={business.business_account.status} />
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Account No.</p>
                    <p className="text-[14px] font-bold font-mono text-gray-900">
                      {business.business_account.account_number}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Account Name</p>
                    <p className="text-[13px] font-semibold text-gray-900 text-right max-w-[60%]">
                      {business.business_account.account_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Bank</p>
                    <p className="text-[13px] text-gray-700">
                      {business.business_account.bank_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Tier</p>
                    <span className="text-[12px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                      {business.business_account.tier_label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Daily Limit</p>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {formatCurrency(business.business_account.daily_limit)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Max per Txn</p>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {formatCurrency(
                        business.business_account.max_transaction_limit,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <p className="text-[13px] text-gray-400">Activated</p>
                    <p className="text-[13px] text-gray-600">
                      {formatDate(business.business_account.activated_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-6 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <RiBankLine size={18} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-gray-600">
                      No account assigned
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {status === "verified"
                        ? "Click '+ Create Account' to assign a VFD account"
                        : "Business must be verified first"}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Documents */}
            <SectionCard title="Documents" icon={RiFileTextLine}>
              {docs.length === 0 ? (
                <p className="text-[13px] text-gray-300 text-center py-4">
                  No documents submitted
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {docs.map((doc) => (
                    <div key={doc.type}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-gray-700 leading-snug">
                            {doc.label}
                            {doc.required && (
                              <span className="text-gray-300 ml-0.5">*</span>
                            )}
                          </p>
                          {doc.rejection_reason && (
                            <p className="text-[11px] text-red-500 mt-0.5">
                              {doc.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {doc.uploaded && doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[12px] text-accent hover:underline"
                            >
                              View <RiExternalLinkLine size={11} />
                            </a>
                          ) : doc.uploaded ? (
                            <StatusBadge status={doc.status ?? "pending"} />
                          ) : (
                            <span className="text-[11px] text-gray-300">
                              {doc.required ? "Missing" : "—"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      {modalAction && business && (
        <ActionModal
          action={modalAction}
          businessName={business.business_name}
          onConfirm={handleAction}
          onClose={() => setModalAction(null)}
        />
      )}

      {showCreateAccount && business && (
        <CreateAccountModal
          business={business}
          isUpgrade={isUpgrading}
          currentTier={business.business_account?.tier ?? "1"}
          onSuccess={(account) => {
            setBusiness((prev) =>
              prev ? { ...prev, business_account: account } : prev,
            );
            showFeedback(
              "ok",
              isUpgrading
                ? "Account upgraded successfully!"
                : "Account created successfully!",
            );
          }}
          onClose={() => {
            setShowCreateAccount(false);
            setIsUpgrading(false);
          }}
        />
      )}
    </div>
  );
}
