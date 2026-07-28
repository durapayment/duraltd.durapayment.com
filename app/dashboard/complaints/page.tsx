"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RiFlagLine,
  RiRefreshLine,
  RiAlertLine,
  RiCheckLine,
  RiQuestionLine,
  RiCloseLine,
} from "react-icons/ri";

interface ComplaintRow {
  id: string;
  complainant_name: string;
  complainant_email: string;
  complainant_phone: string;
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
  created_at: string;
}

interface CurrentAdmin {
  permissions: string[];
}

function fmt(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

const MATCH_STYLES: Record<
  string,
  { cls: string; icon: React.ElementType; label: string }
> = {
  matched: {
    cls: "bg-green-50 text-green-700",
    icon: RiCheckLine,
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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700",
  reviewing: "bg-yellow-50 text-yellow-700",
  resolved: "bg-green-50 text-green-700",
  rejected: "bg-gray-100 text-gray-500",
};

export default function ComplaintsListPage() {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    last_page: number;
    current_page: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "20",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/complaints?${params}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load complaints");
      setComplaints(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const canView = admin?.permissions.includes("handle_disputes") ?? false;

  if (admin && !canView) {
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

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
              Complaints
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              Payment reports submitted by customers
              {meta ? ` · ${meta.total} total` : ""}
            </p>
          </div>
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
          >
            <RiRefreshLine
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error}
            <button
              onClick={fetchComplaints}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="px-3 py-2 border border-gray-200 rounded-full bg-white w-fit">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm outline-none cursor-pointer bg-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3 font-medium">Complainant</th>
                <th className="px-6 py-3 font-medium">Transaction</th>
                <th className="px-6 py-3 font-medium">Match</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[100px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : complaints.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-14 text-gray-400 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RiFlagLine size={32} className="opacity-30" />
                      <p>No complaints found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const matchInfo = MATCH_STYLES[c.match_status];
                  const MatchIcon = matchInfo.icon;
                  return (
                    <tr
                      key={c.id}
                      onClick={() =>
                        (window.location.href = `/dashboard/complaints/${c.id}`)
                      }
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {c.complainant_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.complainant_email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {c.transaction ? (
                          <>
                            <p className="font-mono text-xs text-gray-700">
                              {c.transaction.reference}
                            </p>
                            <p className="text-xs text-gray-400">
                              {fmt(c.transaction.amount)} ·{" "}
                              {c.transaction.business ?? "—"}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${matchInfo.cls}`}
                        >
                          <MatchIcon size={11} />
                          {matchInfo.label}
                          {c.match_status === "ambiguous" &&
                            ` (${c.candidate_count})`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[c.status]}`}
                        >
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-nowrap">
                        {new Date(c.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && meta && meta.total > 0 && (
          <div className="flex items-center justify-between pb-4">
            <p className="text-sm text-gray-500">
              Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === meta.last_page}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
