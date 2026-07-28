"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  RiArrowLeftLine,
  RiRefreshLine,
  RiAlertLine,
  RiCheckLine,
  RiFlagLine,
  RiLockUnlockLine,
  RiCloseCircleLine,
} from "react-icons/ri";

interface ComplaintDetail {
  id: string;
  complainant_name: string;
  complainant_email: string;
  complainant_phone: string;
  description: string;
  reference_provided: string | null;
  account_number_provided: string | null;
  amount_provided: number | null;
  approx_date_provided: string | null;
  match_status: "matched" | "ambiguous" | "unmatched";
  candidate_count: number;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  transaction: {
    id: string;
    reference: string;
    amount: number;
    is_flagged: boolean;
    is_settled: boolean;
    business: string | null;
  } | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
}

interface CurrentAdmin {
  permissions: string[];
}

function fmt(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

export default function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
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
        setAdmin(json.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/complaints/${id}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load complaint");
      setComplaint(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const updateComplaintStatus = async (
    status: "reviewing" | "resolved" | "rejected",
  ) => {
    setActioning(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/complaints/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes || undefined }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Failed to update complaint");
      showSuccess("Complaint updated");
      setNotes("");
      await fetchComplaint();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update complaint");
    } finally {
      setActioning(false);
    }
  };

  const releaseTransaction = async () => {
    if (!complaint?.transaction) return;
    setActioning(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/transactions/${complaint.transaction.id}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "release",
            notes: notes || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Failed to release transaction");
      showSuccess(
        "Transaction released — eligible for the next settlement run",
      );
      await fetchComplaint();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to release transaction",
      );
    } finally {
      setActioning(false);
    }
  };

  const reverseTransaction = async () => {
    if (!complaint?.transaction) return;
    if (
      !confirm(
        "Reverse this transaction? This removes it from the merchant's ledger permanently. You'll still need to manually initiate the refund transfer to the payer.",
      )
    )
      return;
    setActioning(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/transactions/${complaint.transaction.id}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reverse",
            notes: notes || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Failed to reverse transaction");
      showSuccess(
        "Transaction reversed — remember to initiate the outbound refund manually",
      );
      await fetchComplaint();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to reverse transaction",
      );
    } finally {
      setActioning(false);
    }
  };

  const flagTransaction = async () => {
    if (!complaint?.transaction) return;
    const reason = prompt("Reason for flagging this transaction:");
    if (!reason) return;
    setActioning(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/transactions/${complaint.transaction.id}/flag`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Failed to flag transaction");
      showSuccess("Transaction flagged and held from settlement");
      await fetchComplaint();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to flag transaction");
    } finally {
      setActioning(false);
    }
  };

  const canManage = admin?.permissions.includes("handle_disputes") ?? false;

  if (admin && !canManage) {
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
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col gap-6 px-4 sm:px-0">
          <a
            href="/dashboard/complaints"
            className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1"
          >
            <RiArrowLeftLine size={13} /> All complaints
          </a>
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-6 px-4 sm:px-0">
        <div>
          <a
            href="/dashboard/complaints"
            className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1 mb-3 transition-colors"
          >
            <RiArrowLeftLine size={13} /> All complaints
          </a>
          <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
            Complaint from {complaint.complainant_name}
          </h1>
          <p className="text-[13px] text-gray-400 mt-1 font-mono">
            {complaint.id}
          </p>
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
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: complaint details ── */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3">
                Complainant
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Name
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {complaint.complainant_name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {complaint.complainant_email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {complaint.complainant_phone}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                What happened
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {complaint.description}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3">
                Details Provided
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Reference
                  </p>
                  <p className="text-sm font-mono text-gray-900">
                    {complaint.reference_provided ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Account Number
                  </p>
                  <p className="text-sm font-mono text-gray-900">
                    {complaint.account_number_provided ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Amount
                  </p>
                  <p className="text-sm text-gray-900">
                    {complaint.amount_provided !== null
                      ? fmt(complaint.amount_provided)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Approx. Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {complaint.approx_date_provided ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {complaint.transaction && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-3">
                  Matched Transaction
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                      Reference
                    </p>
                    <p className="text-sm font-mono text-gray-900">
                      {complaint.transaction.reference}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                      Business
                    </p>
                    <p className="text-sm text-gray-900">
                      {complaint.transaction.business ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                      Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {fmt(complaint.transaction.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                      Status
                    </p>
                    <p className="text-sm text-gray-900">
                      {complaint.transaction.is_settled
                        ? "Settled"
                        : complaint.transaction.is_flagged
                          ? "Flagged / On Hold"
                          : "Pending settlement"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                  {!complaint.transaction.is_flagged &&
                    !complaint.transaction.is_settled && (
                      <button
                        onClick={flagTransaction}
                        disabled={actioning}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        <RiFlagLine size={13} />
                        Flag / Hold
                      </button>
                    )}
                  {complaint.transaction.is_flagged && (
                    <>
                      <button
                        onClick={releaseTransaction}
                        disabled={actioning}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors disabled:opacity-40"
                      >
                        <RiLockUnlockLine size={13} />
                        Release Hold
                      </button>
                      <button
                        onClick={reverseTransaction}
                        disabled={actioning}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40"
                      >
                        <RiCloseCircleLine size={13} />
                        Reverse
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: status + actions ── */}
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3">
                Review Status
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-gray-400">Match</p>
                  <p className="text-[13px] font-medium text-gray-900 capitalize">
                    {complaint.match_status}
                    {complaint.match_status === "ambiguous"
                      ? ` (${complaint.candidate_count})`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <p className="text-[13px] text-gray-400">Status</p>
                  <p className="text-[13px] font-medium text-gray-900 capitalize">
                    {complaint.status}
                  </p>
                </div>
                {complaint.reviewed_by && (
                  <>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <p className="text-[13px] text-gray-400">Reviewed by</p>
                      <p className="text-[13px] font-medium text-gray-900">
                        {complaint.reviewed_by}
                      </p>
                    </div>
                    {complaint.review_notes && (
                      <div className="border-t border-gray-50 pt-3">
                        <p className="text-[13px] text-gray-400 mb-1">Notes</p>
                        <p className="text-[13px] text-gray-700">
                          {complaint.review_notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
              <h3 className="text-[15px] font-semibold text-gray-900">
                Update Status
              </h3>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all resize-none"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => updateComplaintStatus("reviewing")}
                  disabled={actioning || complaint.status === "reviewing"}
                  className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Mark Reviewing
                </button>
                <button
                  onClick={() => updateComplaintStatus("resolved")}
                  disabled={actioning || complaint.status === "resolved"}
                  className="w-full py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateComplaintStatus("rejected")}
                  disabled={actioning || complaint.status === "rejected"}
                  className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40"
                >
                  Mark Rejected
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
