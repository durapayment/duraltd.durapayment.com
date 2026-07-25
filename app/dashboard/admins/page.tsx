"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RiUserSettingsLine,
  RiAddLine,
  RiCloseLine,
  RiRefreshLine,
  RiAlertLine,
  RiCheckLine,
  RiMoreFill,
} from "react-icons/ri";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
type AdminRole = "superadmin" | "compliance" | "finance" | "support";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  role_label: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface CurrentAdmin {
  permissions: string[];
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "compliance", label: "Compliance Officer" },
  { value: "finance", label: "Finance Officer" },
  { value: "support", label: "Support Agent" },
  { value: "superadmin", label: "Super Admin" },
];

// ─────────────────────────────────────────────────────────
// Role badge
// ─────────────────────────────────────────────────────────
function RoleBadge({ role, label }: { role: AdminRole; label: string }) {
  const map: Record<AdminRole, string> = {
    superadmin: "bg-accent text-white",
    compliance: "bg-purple-50 text-purple-700",
    finance: "bg-green-50 text-green-700",
    support: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${map[role] ?? "bg-gray-100 text-gray-600"}`}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Plain modal shell
// ─────────────────────────────────────────────────────────
function PlainModal({
  onBackdropClick,
  children,
}: {
  onBackdropClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onBackdropClick?.()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Create Admin Modal
// ─────────────────────────────────────────────────────────
function CreateAdminModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "support" as AdminRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to create admin");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlainModal onBackdropClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-[16px] text-gray-900">New Admin</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RiCloseLine size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              First Name
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Last Name
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Temporary Password
          </label>
          <input
            type="text"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="Min. 8 characters"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as AdminRole }))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all cursor-pointer"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RiRefreshLine size={14} className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create Admin"
            )}
          </button>
        </div>
      </form>
    </PlainModal>
  );
}

// ─────────────────────────────────────────────────────────
// Edit Admin Modal — role, active status, password reset
// ─────────────────────────────────────────────────────────
function EditAdminModal({
  admin,
  onClose,
  onSuccess,
}: {
  admin: AdminRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [isActive, setIsActive] = useState(admin.is_active);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = { role, is_active: isActive };
      if (newPassword) body.password = newPassword;

      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to update admin");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlainModal onBackdropClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-[16px] text-gray-900">
            {admin.name}
          </h2>
          <p className="text-xs text-gray-400">{admin.email}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RiCloseLine size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all cursor-pointer"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Active</p>
            <p className="text-xs text-gray-400">
              Inactive admins can't log in
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              isActive ? "bg-accent" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Reset Password{" "}
            <span className="text-gray-400 normal-case font-normal">
              (optional)
            </span>
          </label>
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-gray-400 focus:bg-white text-sm outline-none transition-all font-mono"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RiRefreshLine size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </PlainModal>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function ManageAdminsPage() {
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null);
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

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins");
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load admins");
      setAdmins(json.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const canManage =
    currentAdmin?.permissions.includes("manage_admins") ?? false;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (currentAdmin && !canManage) {
    return (
      <div className="w-full flex flex-col items-center pt-6 pb-12">
        <div className="max-w-310 w-full flex flex-col items-center justify-center py-20 text-center px-4">
          <RiAlertLine size={28} className="text-gray-300 mb-3" />
          <p className="text-[15px] font-semibold text-gray-700">
            Not authorized
          </p>
          <p className="text-[13px] text-gray-400 mt-1">
            You don't have permission to manage admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center pt-6 pb-12">
      <div className="max-w-310 w-full flex flex-col gap-7 px-4 sm:px-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
              Manage Admins
            </h1>
            <p className="text-[14px] text-gray-400 mt-1">
              Create and manage admin accounts and their roles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdmins}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 hover:text-accent transition-colors"
            >
              <RiRefreshLine
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors"
            >
              <RiAddLine size={16} />
              New Admin
            </button>
          </div>
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
              onClick={fetchAdmins}
              className="ml-auto text-accent underline underline-offset-2 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── List ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-56" />
                  </div>
                  <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <RiUserSettingsLine size={28} className="text-gray-300 mb-3" />
              <p className="text-[15px] font-semibold text-gray-700">
                No admins yet
              </p>
              <p className="text-[13px] text-gray-400 mt-1">
                Create the first admin account
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {admins.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[13px] font-bold text-gray-600 shrink-0">
                    {a.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate flex items-center gap-2">
                      {a.name}
                      {!a.is_active && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                      {a.email}
                    </p>
                  </div>

                  <p className="text-[12px] text-gray-400 shrink-0 hidden sm:block">
                    {a.last_login_at
                      ? `Last login ${new Date(a.last_login_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                      : "Never logged in"}
                  </p>

                  <RoleBadge role={a.role} label={a.role_label} />

                  <button
                    onClick={() => setEditingAdmin(a)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                    title="Edit admin"
                  >
                    <RiMoreFill size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            fetchAdmins();
            showSuccess("Admin created successfully");
          }}
        />
      )}

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => {
            fetchAdmins();
            showSuccess("Admin updated successfully");
          }}
        />
      )}
    </div>
  );
}
