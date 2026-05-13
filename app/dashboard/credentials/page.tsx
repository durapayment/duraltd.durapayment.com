"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  Shield,
  Zap,
  Key,
  CheckCircle2,
  Lock,
} from "lucide-react";
import clsx from "clsx";
import { Tabs, ProgressCircle } from "@heroui/react";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface ApiKey {
  id: string;
  name: string;
  public_key: string;
  secret_key: string;
  allowed_ips: string[];
  last_used_at: string | null;
  created_at: string;
  mode: "test" | "live";
}

interface NewKeyBanner {
  public_key: string;
  secret_key: string;
  mode: "test" | "live";
}

// ─────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────
const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

function isValidIp(ip: string) {
  return IPV4_RE.test(ip.trim());
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────
// Small atoms
// ─────────────────────────────────────────────────────────
function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "blue" | "red" | "green" | "violet";
}) {
  const cls = {
    neutral: "bg-gray-100 text-gray-600",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border border-violet-200",
  }[variant];
  return (
    <span
      className={clsx(
        "text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function IconBtn({
  icon: Icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: any;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex items-center gap-1.5 text-[14px] font-medium px-3 py-1.5 rounded-lg transition-all",
        danger
          ? "text-red-600 hover:bg-red-50 disabled:opacity-40"
          : "text-gray-600 hover:bg-gray-100 disabled:opacity-40",
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Masked field with reveal toggle
// ─────────────────────────────────────────────────────────
function SecretField({ value, onCopy }: { value: string; onCopy: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-[14px] group">
      <code className="flex-1 break-all text-gray-700 select-none">
        {revealed ? value : "•".repeat(Math.min(value?.length, 40))}
      </code>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setRevealed((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          title="Copy"
        >
          {copied ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

function PublicField({ value, onCopy }: { value: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-[14px] group">
      <code className="flex-1 break-all text-gray-700">{value}</code>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors opacity-0 group-hover:opacity-100"
        title="Copy"
      >
        {copied ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// IP Whitelist section
// ─────────────────────────────────────────────────────────
function IpWhitelist({
  keyId,
  ips,
  onAdd,
  onRemove,
}: {
  keyId: string;
  ips: string[];
  onAdd: (keyId: string, ip: string) => Promise<void>;
  onRemove: (keyId: string, ip: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingIp, setRemovingIp] = useState<string | null>(null);

  const handleAdd = async () => {
    const ip = input.trim();
    if (!ip) {
      setError("Enter an IP address");
      return;
    }
    if (!isValidIp(ip)) {
      setError("Invalid IPv4 address");
      return;
    }
    if (ips.includes(ip)) {
      setError("IP already whitelisted");
      return;
    }
    setError("");
    setAdding(true);
    await onAdd(keyId, ip);
    setInput("");
    setAdding(false);
  };

  const handleRemove = async (ip: string) => {
    setRemovingIp(ip);
    await onRemove(keyId, ip);
    setRemovingIp(null);
  };

  return (
    <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-violet-500" />
        <h4 className="text-[14px] font-semibold text-gray-700 tracking-wide uppercase">
          IP Whitelist
        </h4>
        <Badge variant="violet">Optional</Badge>
      </div>

      {ips.length === 0 ? (
        <p className="text-[14px] text-gray-400 italic mb-3">
          No IPs added. All server IPs are allowed by default.
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {ips.map((ip) => (
            <div
              key={ip}
              className="flex items-center justify-between bg-violet-50 border border-violet-100 px-4 py-2.5 rounded-xl font-mono text-[14px] text-violet-800"
            >
              <span>{ip}</span>
              <button
                onClick={() => handleRemove(ip)}
                disabled={removingIp === ip}
                className="text-red-400 hover:text-red-600 transition-colors ml-3 disabled:opacity-40"
              >
                {removingIp === ip ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. 102.88.104.5"
            className={clsx(
              "w-full px-4 py-2.5 rounded-xl border text-[14px] font-mono outline-none transition-all",
              error
                ? "border-red-300 bg-red-50 placeholder:text-red-300"
                : "border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:border-violet-400 focus:bg-white",
            )}
          />
          {error && (
            <p className="text-[11px] text-red-500 mt-1 ml-1">{error}</p>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-[14px] font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {adding ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Plus size={13} />
          )}
          Add IP
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        Only add static server IPs. Avoid dynamic/residential IPs.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Single API Key card
// ─────────────────────────────────────────────────────────
function KeyCard({
  apiKey,
  onCopy,
  onRegenerate,
  onAddIp,
  onRemoveIp,
}: {
  apiKey: ApiKey;
  onCopy: (text: string) => void;
  onRegenerate: (keyId: string) => void;
  onAddIp: (keyId: string, ip: string) => Promise<void>;
  onRemoveIp: (keyId: string, ip: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div
        className="flex flex-col lg:flex-row flex-start gap-3 lg:gap-0 lg:items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              apiKey.mode === "live"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600",
            )}
          >
            <Key size={15} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">
              {apiKey.name}
            </p>
            <p className="text-[12px] text-gray-400">
              Created {fmtDate(apiKey.created_at)}
              {apiKey.last_used_at && ` · Used ${fmtDate(apiKey.last_used_at)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* <Badge variant={apiKey.mode === "live" ? "red" : "blue"}>
            {apiKey.mode}
          </Badge> */}
          {apiKey.allowed_ips.length > 0 && (
            <Badge variant="violet">
              {apiKey.allowed_ips.length} IP
              {apiKey.allowed_ips.length > 1 ? "s" : ""}
            </Badge>
          )}
          <IconBtn
            icon={RefreshCw}
            label="Regenerate"
            onClick={(e: any) => {
              e?.stopPropagation?.();
              onRegenerate(apiKey.id);
            }}
            danger
          />
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Public Key
              </span>
              <span className="text-[11px] text-gray-400">
                Safe to expose client-side
              </span>
            </div>
            <PublicField
              value={apiKey.public_key}
              onCopy={() => onCopy(apiKey.public_key)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Secret Key
              </span>
              <div className="flex items-center gap-1.5">
                <Lock size={11} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">
                  Server-side only · never expose
                </span>
              </div>
            </div>
            <SecretField
              value={apiKey.secret_key}
              onCopy={() => onCopy(apiKey.secret_key)}
            />
          </div>
          <IpWhitelist
            keyId={apiKey.id}
            ips={apiKey.allowed_ips}
            onAdd={onAddIp}
            onRemove={onRemoveIp}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Confirm modal
// ─────────────────────────────────────────────────────────
function ConfirmModal({
  mode,
  isFirstKey,
  onConfirm,
  onCancel,
  loading,
}: {
  mode: "test" | "live";
  isFirstKey: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!pw.trim()) {
      setErr("Password is required");
      return;
    }
    setErr("");
    onConfirm(pw);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] border border-gray-200 overflow-hidden">
        <div
          className={clsx(
            "h-1.5 w-full",
            mode === "live" ? "bg-red-500" : "bg-blue-500",
          )}
        />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[17px] font-bold text-gray-900">
                {isFirstKey ? "Generate" : "Regenerate"}{" "}
                {mode === "live" ? "Live" : "Test"} Keys
              </h3>
              <p className="text-[14px] text-gray-500 mt-0.5">
                {isFirstKey
                  ? "A new key pair will be created."
                  : "Existing keys will be invalidated immediately."}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {mode === "live" && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertTriangle
                size={16}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-[14px] text-red-700">
                {isFirstKey
                  ? "Live keys process real money. Guard your secret key carefully."
                  : "Old live keys stop working instantly. Update your servers before confirming."}
              </p>
            </div>
          )}

          <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
            Confirm with your password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className={clsx(
              "w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all",
              err
                ? "border-red-300 bg-red-50"
                : "border-gray-200 focus:border-blue-400 focus:bg-blue-50/30",
            )}
          />
          {err && <p className="text-[12px] text-red-500 mt-1">{err}</p>}

          <div className="flex gap-3 mt-5">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className={clsx(
                "flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60",
                mode === "live"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700",
              )}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Processing…
                </>
              ) : (
                "Confirm & Generate"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// New Key Banner — shown once after generation
// ─────────────────────────────────────────────────────────
function NewKeyBannerUI({
  banner,
  onDismiss,
}: {
  banner: NewKeyBanner;
  onDismiss: () => void;
}) {
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedSec, setCopiedSec] = useState(false);

  const copy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 overflow-hidden">
      <div className="flex items-start justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <h3 className="text-[15px] font-bold text-amber-900">
            New {banner.mode === "live" ? "Live" : "Test"} Keys — Save Now
          </h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <p className="px-6 text-[14px] text-amber-800 mb-4">
        This is the <strong>only time</strong> your full secret key will be
        displayed. Copy it now and store it securely.
      </p>
      <div className="px-6 pb-5 space-y-3">
        {[
          {
            label: "Public Key",
            val: banner.public_key,
            copied: copiedPub,
            setCopied: setCopiedPub,
          },
          {
            label: "Secret Key",
            val: banner.secret_key,
            copied: copiedSec,
            setCopied: setCopiedSec,
          },
        ].map(({ label, val, copied, setCopied }) => (
          <div key={label}>
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
              {label}
            </p>
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-4 py-3">
              <code className="flex-1 text-[14px] font-mono text-gray-800 break-all">
                {val}
              </code>
              <button
                onClick={() => copy(val, setCopied)}
                className="shrink-0 p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
              >
                {copied ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────
function EmptyState({
  mode,
  onGenerate,
}: {
  mode: "test" | "live";
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-gray-200 text-center">
      <div
        className={clsx(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
          mode === "live"
            ? "bg-red-100 text-red-500"
            : "bg-blue-100 text-blue-500",
        )}
      >
        <Zap size={24} />
      </div>
      <h3 className="text-[17px] font-semibold text-gray-800 mb-1">
        No {mode === "live" ? "Live" : "Test"} Keys Yet
      </h3>
      <p className="text-[14px] text-gray-500 mb-6 max-w-xs">
        {mode === "live"
          ? "Generate live keys to start accepting real payments in production."
          : "Generate test keys to integrate and test your payment flow safely."}
      </p>
      <button
        onClick={onGenerate}
        className={clsx(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-colors",
          mode === "live"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-blue-600 hover:bg-blue-700",
        )}
      >
        <Plus size={16} />
        Generate {mode === "live" ? "Live" : "Test"} Keys
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function ApiKeys() {
  const [mode, setMode] = useState<"test" | "live">("test");
  const [keys, setKeys] = useState<{ test: ApiKey[]; live: ApiKey[] }>({
    test: [],
    live: [],
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<{
    open: boolean;
    mode: "test" | "live";
    regenerateId: string | null;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [newKeyBanner, setNewKeyBanner] = useState<NewKeyBanner | null>(null);

  const [snack, setSnack] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  const showSnack = (msg: string, type: "ok" | "err" = "ok") => {
    setSnack({ msg, type });
    setTimeout(() => setSnack(null), 2500);
  };

  // ── Fetch keys on mount ───────────────────────────────

  const fetchKeys = async () => {
    setPageLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/keys", {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load keys");
      setKeys({
        test: json.data?.test ?? [],
        live: json.data?.live ?? [],
      });
    } catch (err: any) {
      setFetchError(err.message ?? "Failed to load API keys");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // ── Generate / Regenerate ────────────────────────────

  const openGenerate = (
    m: "test" | "live" = mode,
    regenerateId: string | null = null,
  ) => {
    setModalError(null);
    setModal({ open: true, mode: m, regenerateId });
  };

  const handleConfirm = async (password: string) => {
    if (!modal) return;
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch("/api/keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ mode: modal.mode, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to generate keys");

      const newKey: ApiKey = json.data;

      // Update local state — replace all keys for this mode (server deletes old ones)
      setKeys((prev) => ({
        ...prev,
        [modal.mode]: [newKey],
      }));

      setNewKeyBanner({
        public_key: newKey.public_key,
        secret_key: newKey.secret_key,
        mode: modal.mode,
      });
      setMode(modal.mode);
      setModal(null);
      showSnack(
        `${modal.mode === "live" ? "Live" : "Test"} key ${modal.regenerateId ? "regenerated" : "created"}`,
      );
    } catch (err: any) {
      setModalError(err.message ?? "Something went wrong");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Copy ─────────────────────────────────────────────

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    showSnack("Copied to clipboard");
  };

  // ── IP management ────────────────────────────────────

  const handleAddIp = async (keyId: string, ip: string) => {
    try {
      const res = await fetch("/api/keys/add-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ api_key_id: keyId, ip }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to add IP");

      // Update local state with server-returned IPs
      setKeys((prev) => ({
        ...prev,
        [mode]: prev[mode].map((k) =>
          k.id === keyId
            ? { ...k, allowed_ips: json.allowed_ips ?? [...k.allowed_ips, ip] }
            : k,
        ),
      }));
      showSnack("IP added");
    } catch (err: any) {
      showSnack(err.message ?? "Failed to add IP", "err");
    }
  };

  const handleRemoveIp = async (keyId: string, ip: string) => {
    try {
      const res = await fetch("/api/keys/remove-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ api_key_id: keyId, ip }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to remove IP");

      setKeys((prev) => ({
        ...prev,
        [mode]: prev[mode].map((k) =>
          k.id === keyId
            ? {
                ...k,
                allowed_ips:
                  json.allowed_ips ?? k.allowed_ips.filter((i) => i !== ip),
              }
            : k,
        ),
      }));
      showSnack("IP removed");
    } catch (err: any) {
      showSnack(err.message ?? "Failed to remove IP", "err");
    }
  };

  // ── Render ───────────────────────────────────────────

  const currentKeys = keys[mode];

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <ProgressCircle isIndeterminate aria-label="Loading API keys...">
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-310 mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{fetchError}</p>
          <button
            onClick={fetchKeys}
            className="px-4 py-2 rounded-xl border border-red-300 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-310 mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] md:text-[30px] font-bold text-gray-900 tracking-tight">
          API Keys
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Manage your test and live key pairs. Keep secret keys server-side
          only.
        </p>
      </div>

      {/* New Key Banner */}
      {newKeyBanner && (
        <NewKeyBannerUI
          banner={newKeyBanner}
          onDismiss={() => setNewKeyBanner(null)}
        />
      )}

      {/* Mode Tabs */}
      <Tabs
        selectedKey={mode}
        onSelectionChange={(key: any) => setMode(key as "test" | "live")}
        className="mb-6"
      >
        <Tabs.ListContainer>
          <Tabs.List className="max-w-md" aria-label="API key mode">
            <Tabs.Tab id="test">
              Test
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="live">
              Live
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* Live mode warning */}
      {mode === "live" && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[14px] text-red-700">
            <strong>Live mode:</strong> these keys process real transactions.
            Never commit your secret key to version control or expose it
            client-side.
          </p>
        </div>
      )}

      {/* Generate button (when keys exist) */}
      {currentKeys.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => openGenerate(mode)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-semibold text-white transition-colors",
              mode === "live"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            <Plus size={14} />
            New {mode === "live" ? "Live" : "Test"} Key
          </button>
        </div>
      )}

      {/* Keys list or empty */}
      {currentKeys.length === 0 ? (
        <EmptyState mode={mode} onGenerate={() => openGenerate(mode)} />
      ) : (
        <div className="space-y-4">
          {currentKeys.map((key) => (
            <KeyCard
              key={key.id}
              apiKey={key}
              onCopy={handleCopy}
              onRegenerate={(id) => openGenerate(mode, id)}
              onAddIp={handleAddIp}
              onRemoveIp={handleRemoveIp}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 text-[14px] text-gray-400">
        Need help?{" "}
        <a href="/docs" className="text-blue-500 hover:underline">
          Read the integration docs →
        </a>
      </div>

      {/* Confirm Modal */}
      {modal?.open && (
        <ConfirmModal
          mode={modal.mode}
          isFirstKey={
            modal.regenerateId === null && keys[modal.mode].length === 0
          }
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
          loading={modalLoading}
        />
      )}
      {/* Modal error shown below modal — or you can inline it */}
      {modalError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-[14px] font-medium text-white bg-red-600 shadow-xl z-50">
          {modalError}
        </div>
      )}

      {/* Snack */}
      {snack && (
        <div
          className={clsx(
            "fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-[14px] font-medium text-white shadow-xl transition-all z-50",
            snack.type === "ok" ? "bg-gray-900" : "bg-red-600",
          )}
        >
          {snack.msg}
        </div>
      )}
    </section>
  );
}
