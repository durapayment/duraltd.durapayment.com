"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  RiArrowLeftLine,
  RiExchangeDollarLine,
  RiPercentLine,
  RiRefreshLine,
  RiAlertLine,
  RiCheckLine,
  RiHistoryLine,
} from "react-icons/ri";

type FeeKind = "flat" | "percentage";

interface FeeSummary {
  type: string;
  label: string;
  description: string;
  fee_type: FeeKind;
  has_override: boolean;
  default_fee: number | null;
  default_rate: number | null;
  default_cap: number | null;
  effective_fee: number | null;
  effective_rate: number | null;
  effective_cap: number | null;
  last_updated: string | null;
}

interface FeeHistoryEntry {
  id: string;
  fee_type: FeeKind;
  fee: number | null;
  percentage_rate: number | null;
  percentage_cap: number | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

interface CurrentAdmin {
  permissions: string[];
}

function fmt(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function fmtRate(rate: number): string {
  return `${parseFloat(rate.toFixed(4))}%`;
}

export default function BusinessPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [fees, setFees] = useState<FeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeType, setActiveType] = useState<string | null>(null);
  const [history, setHistory] = useState<FeeHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [newFee, setNewFee] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newCap, setNewCap] = useState("");
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

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/fees`);
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load pricing");
      setBusinessName(json.data.business.name);
      setFees(json.data.fees ?? []);
      if (!activeType && json.data.fees?.length) {
        setActiveType(json.data.fees[0].type);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, [id, activeType]);

  useEffect(() => {
    fetchFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchHistory = useCallback(
    async (type: string) => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/admin/businesses/${id}/fees/${type}`);
        const json = await res.json();
        if (res.ok) setHistory(json.data.history ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setHistoryLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (activeType) {
      setNewFee("");
      setNewRate("");
      setNewCap("");
      setNote("");
      fetchHistory(activeType);
    }
  }, [activeType, fetchHistory]);

  const active = fees.find((f) => f.type === activeType) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setSaveError(null);
    setSaveSuccess(false);

    let body: Record<string, unknown>;

    if (active.fee_type === "flat") {
      const parsed = parseFloat(newFee);
      if (!newFee || isNaN(parsed) || parsed < 0) {
        setSaveError("Enter a valid fee amount.");
        return;
      }
      body = { fee: parsed, note: note || undefined };
    } else {
      const parsedRate = parseFloat(newRate);
      if (!newRate || isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
        setSaveError("Enter a valid rate between 0 and 100.");
        return;
      }
      const parsedCap = newCap ? parseFloat(newCap) : null;
      body = {
        percentage_rate: parsedRate,
        percentage_cap: parsedCap ?? undefined,
        note: note || undefined,
      };
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/businesses/${id}/fees/${active.type}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to update fee");

      setNewFee("");
      setNewRate("");
      setNewCap("");
      setNote("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchFees();
      await fetchHistory(active.type);
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
        <div>
          <a
            href={`/dashboard/businesses/${id}`}
            className="text-[13px] text-gray-400 hover:text-accent flex items-center gap-1 mb-2 transition-colors"
          >
            <RiArrowLeftLine size={13} /> Back to business
          </a>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
                Pricing
              </h1>
              <p className="text-[14px] text-gray-400 mt-1">
                {businessName
                  ? `Custom fees for ${businessName}`
                  : "Custom fees for this business"}
              </p>
            </div>
            <button
              onClick={fetchFees}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
            >
              <RiRefreshLine
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700">
            <RiAlertLine size={16} className="shrink-0 text-gray-400" />
            {error}
            <button
              onClick={fetchFees}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Fee type tabs ── */}
        <div className="flex items-center gap-2">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 bg-gray-100 rounded-full animate-pulse"
                />
              ))
            : fees.map((f) => (
                <button
                  key={f.type}
                  onClick={() => setActiveType(f.type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeType === f.type
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                  {f.has_override && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        activeType === f.type
                          ? "bg-white/20 text-white"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      Custom
                    </span>
                  )}
                </button>
              ))}
        </div>

        {active && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Left: current + form ── */}
            <div className="xl:col-span-1 flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-widest font-medium text-gray-400">
                    Default (Platform)
                  </p>
                  {active.fee_type === "percentage" ? (
                    <RiPercentLine size={16} className="text-gray-400" />
                  ) : (
                    <RiExchangeDollarLine size={16} className="text-gray-400" />
                  )}
                </div>
                <p className="text-[20px] font-bold text-gray-900">
                  {active.fee_type === "percentage"
                    ? active.default_rate !== null
                      ? fmtRate(active.default_rate)
                      : "—"
                    : active.default_fee !== null
                      ? fmt(active.default_fee)
                      : "—"}
                </p>
                {active.fee_type === "percentage" &&
                  active.default_cap !== null && (
                    <p className="text-[12px] text-gray-400">
                      Capped at {fmt(active.default_cap)}
                    </p>
                  )}
              </div>

              <div
                className={`rounded-2xl border p-5 flex flex-col gap-3 text-white ${
                  active.has_override
                    ? "bg-accent border-accent"
                    : "bg-gray-900 border-gray-900"
                }`}
              >
                <p className="text-[12px] uppercase tracking-widest font-medium text-white/60">
                  {active.has_override
                    ? "Custom Rate (This Business)"
                    : "Effective Rate"}
                </p>
                <p className="text-[28px] font-bold leading-none tracking-tight">
                  {active.fee_type === "percentage"
                    ? active.effective_rate !== null
                      ? fmtRate(active.effective_rate)
                      : "—"
                    : active.effective_fee !== null
                      ? fmt(active.effective_fee)
                      : "—"}
                </p>
                {active.fee_type === "percentage" &&
                  active.effective_cap !== null && (
                    <p className="text-[13px] text-white/60">
                      Capped at {fmt(active.effective_cap)}
                    </p>
                  )}
                {!active.has_override && (
                  <p className="text-[12px] text-white/60">
                    Currently using the platform default
                  </p>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4"
              >
                <h3 className="text-[15px] font-semibold text-gray-900">
                  Set Custom {active.fee_type === "percentage" ? "Rate" : "Fee"}
                </h3>

                {active.fee_type === "percentage" ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Rate (%)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newRate}
                        onChange={(e) =>
                          setNewRate(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        placeholder="e.g. 1.0"
                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                        Cap (₦){" "}
                        <span className="text-gray-400 normal-case font-normal">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newCap}
                        onChange={(e) =>
                          setNewCap(e.target.value.replace(/[^0-9.]/g, ""))
                        }
                        placeholder="e.g. 1500"
                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      Fee (₦)
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
                )}

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
                    placeholder="Reason for this custom rate"
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
                    Custom fee saved
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <RiRefreshLine size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Custom Fee"
                  )}
                </button>
              </form>
            </div>

            {/* ── Right: history ── */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <RiHistoryLine size={17} className="text-gray-400" />
                <h2 className="text-[16px] font-semibold text-gray-900">
                  Custom Fee History for This Business
                </h2>
              </div>

              {historyLoading ? (
                <div className="divide-y divide-gray-50">
                  {Array.from({ length: 4 }).map((_, i) => (
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
                    No custom fee set
                  </p>
                  <p className="text-[13px] text-gray-400 mt-1">
                    This business is currently on the platform default
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
                          {entry.fee_type === "percentage"
                            ? entry.percentage_rate !== null
                              ? fmtRate(entry.percentage_rate)
                              : "—"
                            : entry.fee !== null
                              ? fmt(entry.fee)
                              : "—"}
                          {entry.fee_type === "percentage" &&
                            entry.percentage_cap !== null && (
                              <span className="text-[12px] font-normal text-gray-400 ml-2">
                                capped at {fmt(entry.percentage_cap)}
                              </span>
                            )}
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
        )}
      </div>
    </div>
  );
}
