"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface SettingsData {
  business_id: string;
  verification_status: string;
  fullname: string;
  company_name: string;
  email: string;
  phone_number: string;
  alternative_email: string | null;
  registration_number: string | null;
  business_type: string | null;
  business_industry: string | null;
  bvn: string | null;
  nin_image_path: string | null;
  cac_certificate_path: string | null;
  status_report_path: string | null;
  memorandum_path: string | null;
  board_resolution_path: string | null;
  receive_email_notifications: boolean;
  receive_sms_notifications: boolean;
}

type DocKey =
  | "nin"
  | "cac_certificate"
  | "status_report"
  | "memorandum"
  | "board_resolution";
type Tab = "profile" | "contact" | "compliance" | "preferences";
type Theme = "light" | "dark" | "system";

const BUSINESS_TYPES = ["individual", "corporate"];

const BUSINESS_INDUSTRIES = [
  "Fintech",
  "E-commerce",
  "Logistics",
  "Healthcare",
  "Education",
  "Agriculture",
  "Real Estate",
  "Media & Entertainment",
  "Travel & Hospitality",
  "Manufacturing",
  "Other",
];

const THEME_KEY = "dura_theme_preference";

const DOC_FIELDS: {
  key: DocKey;
  label: string;
  serverKey: keyof SettingsData;
}[] = [
  {
    key: "nin",
    label: "Identity Number (NIN)",
    serverKey: "nin_image_path",
  },
  {
    key: "cac_certificate",
    label: "CAC Certificate",
    serverKey: "cac_certificate_path",
  },
  {
    key: "status_report",
    label: "Status Report",
    serverKey: "status_report_path",
  },
  {
    key: "memorandum",
    label: "Memorandum",
    serverKey: "memorandum_path",
  },
  {
    key: "board_resolution",
    label: "Board Resolution",
    serverKey: "board_resolution_path",
  },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
  localStorage.setItem(THEME_KEY, theme);
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_KEY) as Theme) ?? "system";
}

function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string; label: string }> = {
    verified: {
      cls: "bg-green-50 text-green-700 border-green-200",
      label: "Verified",
    },
    under_review: {
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Under Review",
    },
    incomplete: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Incomplete",
    },
    pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Pending",
    },
    rejected: {
      cls: "bg-red-50 text-red-700 border-red-200",
      label: "Rejected",
    },
    suspended: {
      cls: "bg-red-50 text-red-700 border-red-200",
      label: "Suspended",
    },
  };
  const { cls } = config[status] ?? {
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      {status === "verified" ? (
        <CheckCircle size={11} />
      ) : (
        <AlertCircle size={11} />
      )}
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(
    new Set(),
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const [contactForm, setContactForm] = useState({ alternative_email: "" });

  const [complianceForm, setComplianceForm] = useState({
    registration_number: "",
    business_type: "",
    business_industry: "",
    bvn: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<
    Record<DocKey, File | null>
  >({
    nin: null,
    cac_certificate: null,
    status_report: null,
    memorandum: null,
    board_resolution: null,
  });

  const [preferencesForm, setPreferencesForm] = useState({
    receive_email_notifications: true,
    receive_sms_notifications: true,
    theme: "system" as Theme,
  });

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to load settings");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await res.json();
        const data: SettingsData = json.data;

        setSettings(data);
        setContactForm({ alternative_email: data.alternative_email ?? "" });
        setComplianceForm({
          registration_number: data.registration_number ?? "",
          business_type: data.business_type ?? "",
          business_industry: data.business_industry ?? "",
          bvn: data.bvn ?? "",
        });
        setPreferencesForm({
          receive_email_notifications: data.receive_email_notifications,
          receive_sms_notifications: data.receive_sms_notifications,
          theme: getStoredTheme(),
        });

        const params = new URLSearchParams(window.location.search);
        if (params.get("completeVerification") === "true")
          setActiveTab("compliance");
      } catch (err: unknown) {
        setPageError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveContact = async () => {
    setSavingSection("contact");
    try {
      const res = await fetch("/api/settings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternative_email: contactForm.alternative_email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      showFeedback("success", "Contact information updated.");
      setSettings((prev) =>
        prev
          ? { ...prev, alternative_email: contactForm.alternative_email }
          : prev,
      );
    } catch (err: unknown) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to save.",
      );
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCompliance = async () => {
    const missingFields: string[] = [];

    if (!complianceForm.registration_number.trim())
      missingFields.push("Registration Number");
    if (!complianceForm.business_type) missingFields.push("Business Type");
    if (!complianceForm.business_industry) missingFields.push("Industry");
    if (!complianceForm.bvn || complianceForm.bvn.length < 11)
      missingFields.push("BVN (must be 11 digits)");

    for (const { key, label, serverKey } of DOC_FIELDS) {
      const alreadyUploaded = !!(
        settings as unknown as Record<string, unknown>
      )?.[serverKey];
      const newlySelected = !!selectedFiles[key];
      if (!alreadyUploaded && !newlySelected) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      setValidationErrors(new Set(missingFields));
      showFeedback(
        "error",
        `Please complete the following:\n• ${missingFields.join("\n• ")}`,
      );
      return;
    }

    setValidationErrors(new Set());
    setSavingSection("compliance");
    try {
      const formData = new FormData();
      if (complianceForm.registration_number)
        formData.append(
          "registration_number",
          complianceForm.registration_number,
        );
      if (complianceForm.business_type)
        formData.append("business_type", complianceForm.business_type);
      if (complianceForm.business_industry)
        formData.append("business_industry", complianceForm.business_industry);
      if (complianceForm.bvn) formData.append("bvn", complianceForm.bvn);

      (Object.entries(selectedFiles) as [DocKey, File | null][]).forEach(
        ([key, file]) => {
          if (file) formData.append(key, file);
        },
      );

      const res = await fetch("/api/settings/compliance", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save compliance");

      showFeedback("success", "Compliance documents submitted successfully.");

      if (data.data) {
        setSettings((prev) => (prev ? { ...prev, ...data.data } : prev));
      }

      setSelectedFiles({
        nin: null,
        cac_certificate: null,
        status_report: null,
        memorandum: null,
        board_resolution: null,
      });
    } catch (err: unknown) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to save compliance.",
      );
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePreferences = async () => {
    setSavingSection("preferences");
    try {
      applyTheme(preferencesForm.theme);

      const res = await fetch("/api/settings/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receive_email_notifications:
            preferencesForm.receive_email_notifications,
          receive_sms_notifications: preferencesForm.receive_sms_notifications,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to save preferences");

      if (data.data) {
        setSettings((prev) => (prev ? { ...prev, ...data.data } : prev));
      }

      showFeedback("success", "Preferences saved.");
    } catch (err: unknown) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to save preferences.",
      );
    } finally {
      setSavingSection(null);
    }
  };

  const triggerFileInput = (key: DocKey) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setSelectedFiles((prev) => ({ ...prev, [key]: file }));
    };
    input.click();
  };

  // ── Doc row ───────────────────────────────────
  // FIX: removed non-standard `xs:` breakpoints; used `min-[480px]:` instead
  const DocRow = ({
    docKey,
    label,
    serverKey,
  }: {
    docKey: DocKey;
    label: string;
    serverKey: keyof SettingsData;
  }) => {
    const existingUrl = settings?.[serverKey] as string | null;
    const existingName = existingUrl ? existingUrl.split("/").pop() : null;
    const selected = selectedFiles[docKey];
    const hasError = !selected && !existingUrl && validationErrors.has(label);

    return (
      <div
        className={clsx(
          "flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between",
          "p-3 sm:p-4 border rounded-2xl gap-3 w-full overflow-hidden",
          hasError ? "border-red-400 bg-red-50" : "border-border",
        )}
      >
        {/* Label + status */}
        <div className="flex items-start min-[480px]:items-center gap-3 min-w-0 flex-1">
          <FileText
            className="opacity-75 shrink-0 mt-0.5 min-[480px]:mt-0"
            size={18}
          />
          <div className="">
            <p className="font-medium text-sm leading-snug wrap-break-word">
              {label}
            </p>
            {/* <div className="text-[12px] opacity-80 mt-0.5 min-w-0 overflow-hidden">
              {selected ? (
                <span className="text-blue-600 block truncate">
                  {selected.name}
                </span>
              ) : existingName ? (
                <span className="text-green-600 flex items-center gap-1 min-w-0">
                  <CheckCircle size={10} className="shrink-0" />
                  <span className="truncate min-w-0">{existingName}</span>
                </span>
              ) : (
                <span className="text-gray-400">No file uploaded</span>
              )}
            </div> */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end min-[480px]:self-auto">
          {existingUrl && !selected && (
            <a
              href={existingUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-100 opacity-80 transition-colors"
              title="View"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={() => triggerFileInput(docKey)}
            className="px-3 py-1.5 text-sm font-medium opacity-80 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Upload size={13} />
            {existingName || selected ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
    );
  };

  // ── Render guards ─────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin opacity-75" size={32} />
          <p className="opacity-80 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (pageError || !settings) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">
            {pageError ?? "Failed to load settings"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl border border-red-300 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── JSX ───────────────────────────────────────
  return (
    <section className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 opacity-80 text-xs sm:text-sm">
          Manage your profile, business verification, and preferences
        </p>
      </div>

      {/* ── Feedback banner ── */}
      {feedback && (
        <div
          className={clsx(
            "mb-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5",
            feedback.type === "success"
              ? "bg-green-50 border-green-300 text-green-800"
              : "bg-red-50 border-red-300 text-red-800",
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-600" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          )}
          {/* FIX: break-words prevents long error text overflowing on narrow screens */}
          <p className="whitespace-pre-line leading-snug break-words min-w-0 flex-1">
            {feedback.message}
          </p>
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Tabs ──
        FIX: removed `min-w-max` which forced the container wider than the viewport.
        Now uses `w-full` + `overflow-x-auto` with proper scrollbar hiding.
        Tab labels always visible; icon + label kept together with `shrink-0`.
      */}
      <div
        className="w-full overflow-x-auto border-b border-border mb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="tablist"
      >
        <div className="flex w-full min-w-0">
          {(
            [
              { id: "profile", label: "Profile", icon: User },
              { id: "contact", label: "Contact", icon: Mail },
              { id: "compliance", label: "Compliance", icon: Shield },
              { id: "preferences", label: "Preferences", icon: Bell },
            ] as { id: Tab; label: string; icon: React.ElementType }[]
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                // FIX: flex-1 so tabs share space evenly and never overflow;
                // removed `first:pl-0` which clipped the border-b indicator.
                "flex-1 flex items-center justify-center gap-1.5 pb-3 sm:pb-4",
                "px-1 sm:px-3",
                "border-b-2 transition-all text-xs sm:text-sm font-medium",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent opacity-80 hover:text-gray-700",
              )}
            >
              <tab.icon size={14} className="shrink-0" />
              {/* FIX: always show label; use `truncate` instead of hiding on small screens */}
              <span className="truncate">{tab.label}</span>
              {tab.id === "compliance" &&
                settings.verification_status !== "verified" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8">
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
            <h2 className="text-base sm:text-[18px] font-semibold flex items-center gap-2 sm:gap-3">
              <User className="opacity-75 shrink-0" size={18} />
              Personal & Business Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
            {[
              { label: "Full Name", value: settings.fullname },
              { label: "Business ID", value: settings.business_id, mono: true },
              { label: "Company Name", value: settings.company_name },
              { label: "Primary Email", value: settings.email },
              { label: "Phone Number", value: settings.phone_number },
              {
                label: "Alternative Email",
                value: settings.alternative_email ?? "—",
              },
            ].map(({ label, value, mono }) => (
              <div key={label} className="min-w-0">
                <label className="block text-[11px] uppercase tracking-wider opacity-75 mb-1">
                  {label}
                </label>
                {/* FIX: `break-all` → `break-words overflow-hidden` to handle long emails
                    without breaking every single character unnecessarily */}
                <p
                  className={clsx(
                    "font-medium text-sm sm:text-[15px] break-words overflow-hidden",
                    mono && "font-mono tracking-wide",
                  )}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[11px] sm:text-[12px] text-amber-600 mt-6 sm:mt-8 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            Some fields are immutable. Contact support to make changes.
          </p>
        </div>
      )}

      {/* ── Contact Tab ── */}
      {activeTab === "contact" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8 max-w-2xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-5 sm:mb-6">
            Contact Information
          </h2>

          <div className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 mb-2">
                Alternative Email
              </label>
              <input
                type="email"
                value={contactForm.alternative_email}
                onChange={(e) =>
                  setContactForm({ alternative_email: e.target.value })
                }
                className="w-full px-4 py-3 border border-border rounded-2xl focus:border-gray-400 outline-none text-sm transition-colors"
                placeholder="alternate@email.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 mb-2">
                Phone Number (Primary)
              </label>
              <div className="px-4 py-3 border border-border rounded-2xl opacity-80 text-sm bg-gray-50">
                {settings.phone_number || "—"}
              </div>
              <p className="text-[11px] opacity-75 mt-1">
                Cannot be changed here — contact support
              </p>
            </div>
          </div>

          {/* FIX: `w-full sm:w-auto` already present; added `min-w-0` to prevent overflow */}
          <button
            onClick={handleSaveContact}
            disabled={savingSection === "contact"}
            className="mt-6 sm:mt-8 w-full sm:w-auto px-8 py-3 bg-accent hover:bg-black disabled:opacity-60 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {savingSection === "contact" && (
              <Loader2 className="animate-spin" size={16} />
            )}
            Save Contact Info
          </button>
        </div>
      )}

      {/* ── Compliance Tab ── */}
      {activeTab === "compliance" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8 w-full overflow-hidden">
          {/* Header: stack vertically on mobile so the badge never pushes content wide */}
          <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between gap-2 mb-2">
            <h2 className="text-lg sm:text-xl font-semibold">
              Business Verification (KYC)
            </h2>
            <div>
              <VerificationBadge status={settings.verification_status} />
            </div>
          </div>
          <p className="opacity-80 text-xs sm:text-sm mb-6 sm:mb-8">
            Complete all fields and upload required documents to unlock full
            platform features.
          </p>

          <div className="space-y-8 sm:space-y-10">
            {/* Business Info */}
            <div>
              <h3 className="font-semibold mb-4 text-sm sm:text-[15px]">
                Business Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full">
                <div className="w-full min-w-0">
                  <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 mb-2">
                    Registration Number (RC / BN)
                  </label>
                  <input
                    type="text"
                    value={complianceForm.registration_number}
                    onChange={(e) =>
                      setComplianceForm((f) => ({
                        ...f,
                        registration_number: e.target.value,
                      }))
                    }
                    className={clsx(
                      "w-full px-4 py-2.5 border rounded-2xl focus:border-gray-400 outline-none text-sm",
                      validationErrors.has("Registration Number")
                        ? "border-red-400 bg-red-50"
                        : "border-border",
                    )}
                    placeholder="RC-1234567"
                  />
                </div>

                <div className="w-full min-w-0">
                  <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 mb-2">
                    Business Type
                  </label>
                  <div
                    className={clsx(
                      "px-4 py-2.5 border rounded-2xl w-full",
                      validationErrors.has("Business Type")
                        ? "border-red-400 bg-red-50"
                        : "border-border",
                    )}
                  >
                    <select
                      value={complianceForm.business_type}
                      onChange={(e) =>
                        setComplianceForm((f) => ({
                          ...f,
                          business_type: e.target.value,
                        }))
                      }
                      className="w-full focus:border-gray-400 outline-none text-sm bg-transparent"
                    >
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full min-w-0">
                  <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 mb-2">
                    Industry
                  </label>
                  <div
                    className={clsx(
                      "px-4 py-2.5 border rounded-2xl w-full",
                      validationErrors.has("Industry")
                        ? "border-red-400 bg-red-50"
                        : "border-border",
                    )}
                  >
                    <select
                      value={complianceForm.business_industry}
                      onChange={(e) =>
                        setComplianceForm((f) => ({
                          ...f,
                          business_industry: e.target.value,
                        }))
                      }
                      className="w-full focus:border-gray-400 outline-none text-sm bg-transparent"
                    >
                      <option value="">Select industry</option>
                      {BUSINESS_INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* BVN spans full width on both mobile and desktop */}
                <div className="col-span-1 sm:col-span-2 w-full min-w-0">
                  <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 mb-2">
                    BVN (Bank Verification Number)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={complianceForm.bvn}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      setComplianceForm((f) => ({ ...f, bvn: val }));
                    }}
                    className={clsx(
                      "w-full px-4 py-2.5 border rounded-2xl focus:border-gray-400 outline-none text-sm font-mono tracking-wider",
                      validationErrors.has("BVN (must be 11 digits)")
                        ? "border-red-400 bg-red-50"
                        : "border-border",
                    )}
                    placeholder="11-digit BVN"
                    maxLength={11}
                  />
                  <p className="text-[11px] opacity-75 mt-1">
                    Required for live virtual account generation. Must be 11
                    digits.
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-[15px]">
                Required Documents
              </h3>
              <p className="text-xs opacity-80 mb-3 sm:mb-4">
                Accepted formats: PDF, JPEG, PNG, GIF, WEBP · Max size: 5MB per
                file
              </p>
              <div className="space-y-2.5 sm:space-y-3 ">
                {DOC_FIELDS.map(({ key, label, serverKey }) => (
                  <DocRow
                    key={key}
                    docKey={key}
                    label={label}
                    serverKey={serverKey}
                  />
                ))}
              </div>
            </div>

            {/* Completion indicator */}
            {(() => {
              const filled = [
                complianceForm.registration_number,
                complianceForm.business_type,
                complianceForm.business_industry,
                complianceForm.bvn,
                settings.nin_image_path || selectedFiles.nin,
                settings.cac_certificate_path || selectedFiles.cac_certificate,
                settings.status_report_path || selectedFiles.status_report,
                settings.memorandum_path || selectedFiles.memorandum,
                settings.board_resolution_path ||
                  selectedFiles.board_resolution,
              ].filter(Boolean).length;
              const total = 9;
              const pct = Math.round((filled / total) * 100);
              return (
                <div className="rounded-2xl p-3 sm:p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Completion
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {pct}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={clsx(
                        "h-2 rounded-full transition-all",
                        pct === 100
                          ? "bg-green-500"
                          : pct > 50
                            ? "bg-blue-500"
                            : "bg-amber-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] opacity-75 mt-2">
                    {filled} of {total} fields completed
                    {pct === 100 ? " — Ready to submit!" : ""}
                  </p>
                </div>
              );
            })()}
          </div>

          <button
            onClick={handleSaveCompliance}
            disabled={savingSection === "compliance"}
            className="mt-6 sm:mt-8 w-full sm:w-auto px-10 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {savingSection === "compliance" && (
              <Loader2 className="animate-spin" size={16} />
            )}
            Submit Compliance Documents
          </button>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === "preferences" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8 max-w-2xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8">
            Preferences
          </h2>

          <div className="space-y-8 sm:space-y-10">
            {/* Notifications */}
            <div>
              <h3 className="font-semibold mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-[15px]">
                <Bell size={16} /> Notifications
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  {
                    key: "receive_email_notifications" as const,
                    label: "Email Notifications",
                    sub: "Receive payment alerts and account updates via email",
                  },
                  {
                    key: "receive_sms_notifications" as const,
                    label: "SMS Notifications",
                    sub: "Receive real-time SMS alerts for transactions",
                  },
                ].map(({ key, label, sub }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-border rounded-2xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-[12px] opacity-75 leading-snug mt-0.5">
                        {sub}
                      </p>
                    </div>
                    {/* FIX: toggle — moved `relative` to the outer wrapper div so the
                        absolutely-positioned knob is correctly contained. Previously
                        `relative` was only on the hidden <input>, causing the knob to
                        escape its container on mobile. */}
                    <div
                      className="relative shrink-0 w-11 h-6 cursor-pointer"
                      onClick={() =>
                        setPreferencesForm((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={preferencesForm[key]}
                        onChange={(e) =>
                          setPreferencesForm((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                      <div
                        className={clsx(
                          "w-11 h-6 rounded-full transition-colors",
                          preferencesForm[key] ? "bg-accent" : "bg-gray-200",
                        )}
                      />
                      <div
                        className={clsx(
                          "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                          preferencesForm[key]
                            ? "translate-x-5"
                            : "translate-x-0.5",
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-[15px]">
                <Palette size={16} /> Appearance
              </h3>
              <p className="text-[12px] opacity-75 mb-3 sm:mb-4">
                Preference is saved locally to your browser
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(["light", "dark", "system"] as Theme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setPreferencesForm((prev) => ({ ...prev, theme }));
                      applyTheme(theme);
                    }}
                    className={clsx(
                      "py-2.5 sm:py-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all",
                      preferencesForm.theme === theme
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border hover:border-gray-400 text-gray-600",
                    )}
                  >
                    {theme === "light"
                      ? "Light"
                      : theme === "dark"
                        ? "Dark"
                        : "System"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={savingSection === "preferences"}
            className="mt-8 sm:mt-10 w-full sm:w-auto px-10 py-3 bg-accent hover:bg-black disabled:opacity-60 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {savingSection === "preferences" && (
              <Loader2 className="animate-spin" size={16} />
            )}
            Save Preferences
          </button>
        </div>
      )}
    </section>
  );
}
