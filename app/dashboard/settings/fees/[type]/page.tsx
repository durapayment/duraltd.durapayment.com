"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  RiExchangeDollarLine,
  RiRefreshLine,
  RiAlertLine,
  RiHistoryLine,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";

interface FeeHistoryEntry {
  id: string;
  fee: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

interface AdminInfo {
  permissions: string[];
}

function fmt(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

export default function FeeDetailPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);

  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [label, setLabel] = useState("");
  const [currentFee, setCurrentFee] = useState<number | null>(null);
  const [history, setHistory] = useState<FeeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newFee, setNewFee] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const fetchFee = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fees/${type}`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message ?? "Failed to load fee settings");
      setLabel(json.data.label);
      setCurrentFee(json.data.current);
      setHistory(json.data.history ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load fee settings");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchFee();
  }, [fetchFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    const parsed = parseFloat(newFee);
    if (!newFee || isNaN(parsed) || parsed < 0) {
      setSaveError("Enter a valid fee amount.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fees/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee: parsed, note: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to update fee");

      setNewFee("");
      setNote("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchFee();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to update fee");
    } finally {
      setSaving(false);
    }
  };

  const canManage = admin?.permissions.includes("manage_fees") ?? false;

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

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        <div className="flex items-start justify-between">
          <div>
            <a
              href="/dashboard/settings/fees"
              className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1 mb-2 transition-colors"
            >
              <RiArrowLeftLine size={13} /> All fees
            </a>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
              {label || "Fee Settings"}
            </h1>
          </div>
          <button
            onClick={fetchFee}
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
              onClick={fetchFee}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 flex flex-col gap-5">
            <div className="bg-accent rounded-2xl border border-accent p-5 flex flex-col gap-4 text-white">
              <div className="flex items-center justify-between">
                <p className="text-[12px] uppercase tracking-widest font-medium text-white/60">
                  Current Fee
                </p>
              </div>
              {loading ? (
                <div className="h-8 w-28 rounded bg-white/10 animate-pulse" />
              ) : (
                <p className="text-[28px] font-bold leading-none tracking-tight">
                  {currentFee !== null ? fmt(currentFee) : "—"}
                </p>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4"
            >
              <h3 className="text-[15px] font-semibold text-gray-900">
                Set New Fee
              </h3>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  New Fee (₦)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newFee}
                  onChange={(e) =>
                    setNewFee(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="e.g. 15.00"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Note{" "}
                  <span className="text-gray-400 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for this change"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
                />
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  <RiCheckLine size={15} />
                  Fee updated successfully
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !newFee}
                className="w-full py-2.5 rounded-xl mt-5 bg-accent text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RiRefreshLine size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Update Fee"
                )}
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <RiHistoryLine size={17} className="text-gray-400" />
              <h2 className="text-[16px] font-semibold text-gray-900">
                Change History
              </h2>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-40" />
                    </div>
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <RiHistoryLine size={28} className="text-gray-300 mb-3" />
                <p className="text-[15px] font-semibold text-gray-700">
                  No changes yet
                </p>
                <p className="text-[13px] text-gray-400 mt-1">
                  This fee is still at its default value
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900">
                        {fmt(entry.fee)}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                        {entry.note || "No note provided"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] text-gray-600">
                        {entry.created_by ?? "—"}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {new Date(entry.created_at).toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
