"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import {
  Director,
  DirectorRole,
  DIRECTOR_ROLES,
  NIGERIAN_STATES,
} from "@/app/lib/compliance";

interface DirectorFormData extends Record<string, unknown> {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  bvn: string;
  nin: string;
  role: DirectorRole;
  ownership_percentage: string;
  address: string;
  city: string;
  state: string;
  country: string;
  is_pep: boolean;
  is_primary: boolean;
}

const EMPTY_FORM: DirectorFormData = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  nationality: "Nigerian",
  bvn: "",
  nin: "",
  role: "director",
  ownership_percentage: "",
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
  is_pep: false,
  is_primary: false,
};

export function DirectorModal({
  director,
  onSave,
  onClose,
}: {
  director?: Director | null;
  onSave: (data: DirectorFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DirectorFormData>(
    director
      ? {
          full_name: director.full_name,
          email: director.email ?? "",
          phone: director.phone ?? "",
          date_of_birth: director.date_of_birth ?? "",
          nationality: director.nationality,
          bvn: director.bvn ?? "",
          nin: director.nin ?? "",
          role: director.role,
          ownership_percentage: director.ownership_percentage?.toString() ?? "",
          address: director.address ?? "",
          city: director.city ?? "",
          state: director.state ?? "",
          country: director.country,
          is_pep: director.is_pep,
          is_primary: director.is_primary,
        }
      : EMPTY_FORM,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof DirectorFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.role) {
      setError("Role is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save director.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-gray-400 outline-none text-sm transition-colors bg-white";
  const labelCls =
    "block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900 text-[17px]">
            {director ? "Edit Director" : "Add Director"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input
                  className={inputCls}
                  placeholder="As on government ID"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="director@company.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input
                  className={inputCls}
                  placeholder="+234 801 234 5678"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <input
                  className={inputCls}
                  placeholder="Nigerian"
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Identity */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-4">
              Identity Verification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>BVN *</label>
                <input
                  className={clsx(inputCls, "font-mono tracking-wider")}
                  placeholder="11-digit BVN"
                  maxLength={11}
                  value={form.bvn}
                  onChange={(e) =>
                    set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                />
                {form.bvn && form.bvn.length < 11 && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    {11 - form.bvn.length} more digits needed
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>NIN</label>
                <input
                  className={clsx(inputCls, "font-mono tracking-wider")}
                  placeholder="11-digit NIN"
                  maxLength={11}
                  value={form.nin}
                  onChange={(e) =>
                    set("nin", e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                />
              </div>
            </div>
          </div>

          {/* Role & Ownership */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-4">
              Role & Ownership
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Role *</label>
                <select
                  className={inputCls}
                  value={form.role}
                  onChange={(e) => set("role", e.target.value as DirectorRole)}
                >
                  {DIRECTOR_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  Ownership %{" "}
                  <span className="normal-case font-normal">
                    (if applicable)
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls}
                  placeholder="e.g. 51"
                  value={form.ownership_percentage}
                  onChange={(e) => set("ownership_percentage", e.target.value)}
                />
              </div>
            </div>

            {/* Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                {
                  key: "is_primary" as const,
                  label: "Primary Director",
                  sub: "Main/lead director of the company",
                },
                {
                  key: "is_pep" as const,
                  label: "Politically Exposed Person (PEP)",
                  sub: "Currently or previously holds a prominent public function",
                },
              ].map(({ key, label, sub }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="mt-0.5 accent-gray-900"
                  />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-[11px] text-gray-400">{sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-4">
              Residential Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Street Address</label>
                <input
                  className={inputCls}
                  placeholder="12 Adeola Odeku Street"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input
                  className={inputCls}
                  placeholder="Lagos"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select
                  className={inputCls}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {director ? "Save Changes" : "Add Director"}
          </button>
        </div>
      </div>
    </div>
  );
}
