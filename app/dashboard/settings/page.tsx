"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Bell,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import clsx from "clsx";
import { ComplianceWizard } from "@/app/components/compliance/ComplianceWizard";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface DocumentInfo {
  label: string;
  path: string | null;
  uploaded: boolean;
  required: boolean;
}

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
  website: string | null;
  nin_image_path: string | null;
  cac_certificate_path: string | null;
  status_report_path: string | null;
  memorandum_path: string | null;
  board_resolution_path: string | null;
  documents: {
    nin: DocumentInfo;
    cac_certificate: DocumentInfo;
    status_report: DocumentInfo;
    memorandum: DocumentInfo;
    board_resolution: DocumentInfo;
  };
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

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "business_name", label: "Business Name (BN / Sole Proprietor)" },
  { value: "limited_liability", label: "Limited Liability Company (RC)" },
];

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

// All possible documents
const ALL_DOCS: {
  key: DocKey;
  label: string;
  serverKey: keyof SettingsData;
  hint: string;
}[] = [
  {
    key: "nin",
    label: "National Identity Number (NIN)",
    serverKey: "nin_image_path",
    hint: "Upload a clear photo or scan of your NIN slip or National ID card.",
  },
  {
    key: "cac_certificate",
    label: "CAC Certificate",
    serverKey: "cac_certificate_path",
    hint: "Certificate of Incorporation or Business Name registration from CAC.",
  },
  {
    key: "status_report",
    label: "Company Status Report",
    serverKey: "status_report_path",
    hint: "Current CAC status report confirming active status and directors.",
  },
  {
    key: "memorandum",
    label: "Memorandum & Articles of Association",
    serverKey: "memorandum_path",
    hint: "MEMART signed and certified by CAC.",
  },
  {
    key: "board_resolution",
    label: "Board Resolution",
    serverKey: "board_resolution_path",
    hint: "Board resolution authorising account opening, signed by directors.",
  },
];

// Required docs per business type
const REQUIRED_DOCS: Record<string, DocKey[]> = {
  individual: ["nin"],
  business_name: ["nin", "cac_certificate"],
  limited_liability: [
    "nin",
    "cac_certificate",
    "status_report",
    "memorandum",
    "board_resolution",
  ],
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { cls: string }> = {
    verified: { cls: "bg-green-50 text-green-700 border-green-200" },
    under_review: { cls: "bg-blue-50 text-blue-700 border-blue-200" },
    incomplete: { cls: "bg-amber-50 text-amber-700 border-amber-200" },
    pending: { cls: "bg-amber-50 text-amber-700 border-amber-200" },
    rejected: { cls: "bg-red-50 text-red-700 border-red-200" },
    suspended: { cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const { cls } = config[status] ?? {
    cls: "bg-gray-100 text-gray-600 border-gray-200",
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

function DocStatusBadge({
  uploaded,
  required,
}: {
  uploaded: boolean;
  required: boolean;
}) {
  if (uploaded) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle size={10} /> Uploaded
      </span>
    );
  }
  if (required) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <AlertCircle size={10} /> Required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
      Optional
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
    website: "",
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
  });

  // ── Load settings ──────────────────────────────────────
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
          website: data.website ?? "",
        });
        setPreferencesForm({
          receive_email_notifications: data.receive_email_notifications,
          receive_sms_notifications: data.receive_sms_notifications,
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

  // ── Derived: which docs to show based on selected business type ──
  const selectedType =
    complianceForm.business_type || settings?.business_type || "individual";
  const requiredDocKeys: DocKey[] = REQUIRED_DOCS[selectedType] ?? ["nin"];

  // All docs — required ones first, optional ones after
  const visibleDocs = [
    ...ALL_DOCS.filter((d) => requiredDocKeys.includes(d.key)),
    ...ALL_DOCS.filter((d) => !requiredDocKeys.includes(d.key)),
  ];

  // ── Completion progress ────────────────────────────────
  const completionItems = [
    complianceForm.registration_number || selectedType === "individual",
    !!complianceForm.business_type,
    !!complianceForm.business_industry,
    complianceForm.bvn?.length === 11,
    ...requiredDocKeys.map((key) => {
      const serverKey =
        `${key === "nin" ? "nin_image" : key}_path` as keyof SettingsData;
      return !!(settings?.[serverKey] || selectedFiles[key]);
    }),
  ];
  const completedCount = completionItems.filter(Boolean).length;
  const totalCount = completionItems.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  // ── Handlers ───────────────────────────────────────────
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
    setSavingSection("compliance");
    try {
      const tokenRes = await fetch("/api/token");
      if (!tokenRes.ok) {
        window.location.href = "/login";
        return;
      }
      const { token } = await tokenRes.json();
      if (!token) {
        window.location.href = "/login";
        return;
      }

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
      if (complianceForm.website.trim())
        formData.append("website", complianceForm.website.trim());

      (Object.entries(selectedFiles) as [DocKey, File | null][]).forEach(
        ([key, file]) => {
          if (file) formData.append(key, file);
        },
      );

      const res = await fetch(
        "https://api.durapayment.com/api/business/settings/compliance",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save compliance");

      showFeedback("success", data.message || "Compliance documents saved.");

      if (data.data) {
        setSettings((prev) => (prev ? { ...prev, ...data.data } : prev));
      }

      // Clear only newly uploaded files
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
      const res = await fetch("/api/settings/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferencesForm),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to save preferences");
      if (data.data)
        setSettings((prev) => (prev ? { ...prev, ...data.data } : prev));
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

  // ── Doc Row ────────────────────────────────────────────
  const DocRow = ({
    docKey,
    label,
    serverKey,
    hint,
    isRequired,
  }: {
    docKey: DocKey;
    label: string;
    serverKey: keyof SettingsData;
    hint: string;
    isRequired: boolean;
  }) => {
    const existingUrl = settings?.[serverKey] as string | null;
    const existingName = existingUrl ? existingUrl.split("/").pop() : null;
    const selected = selectedFiles[docKey];
    const isUploaded = !!(existingUrl || selected);

    return (
      <div
        className={clsx(
          "flex flex-col gap-3 p-4 border rounded-2xl w-full overflow-hidden transition-colors",
          isUploaded
            ? "border-green-200 bg-green-50/30"
            : isRequired
              ? "border-amber-200 bg-amber-50/20"
              : "border-border bg-background",
        )}
      >
        {/* Top row: label + badge + actions */}
        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <FileText className="opacity-60 shrink-0 mt-0.5" size={16} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-medium text-sm leading-snug">{label}</p>
                <DocStatusBadge uploaded={isUploaded} required={isRequired} />
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end min-[480px]:self-auto">
            {existingUrl && !selected && (
              <a
                href={existingUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-gray-100 opacity-70 transition-colors"
                title="View uploaded file"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button
              type="button"
              onClick={() => triggerFileInput(docKey)}
              className={clsx(
                "px-3 py-1.5 text-sm font-medium border rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0",
                isUploaded
                  ? "border-green-300 text-green-700 hover:bg-green-100"
                  : isRequired
                    ? "border-amber-300 text-amber-700 hover:bg-amber-100"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100",
              )}
            >
              <Upload size={13} />
              {isUploaded ? "Replace" : "Upload"}
            </button>
          </div>
        </div>

        {/* Selected file preview */}
        {selected && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-[12px] text-blue-700">
            <CheckCircle size={12} className="shrink-0" />
            <span className="truncate font-medium">{selected.name}</span>
            <button
              onClick={() =>
                setSelectedFiles((prev) => ({ ...prev, [docKey]: null }))
              }
              className="ml-auto shrink-0 text-blue-400 hover:text-blue-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Existing file */}
        {!selected && existingName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-[12px] text-green-700">
            <CheckCircle size={12} className="shrink-0" />
            <span className="truncate">{decodeURIComponent(existingName)}</span>
          </div>
        )}
      </div>
    );
  };

  // ── Guards ─────────────────────────────────────────────
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
            className="px-4 py-2 rounded-xl border border-red-300 text-red-600 text-sm font-medium hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main JSX ───────────────────────────────────────────
  return (
    <section className="max-w-5xl mx-auto pt-5 sm:pt-10 pb-5 sm:pb-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 opacity-80 text-xs sm:text-sm">
          Manage your profile, business verification, and preferences
        </p>
      </div>

      {/* Feedback */}
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
          <p className="whitespace-pre-line leading-snug break-words min-w-0 flex-1">
            {feedback.message}
          </p>
          <button
            onClick={() => setFeedback(null)}
            className="ml-auto shrink-0 opacity-50 hover:opacity-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="w-full overflow-x-auto border-b border-border mb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                "flex-1 flex items-center justify-center gap-1.5 pb-3 sm:pb-4 px-1 sm:px-3",
                "border-b-2 transition-all text-xs sm:text-sm font-medium",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent opacity-80 hover:text-gray-700",
              )}
            >
              <tab.icon size={16} className="shrink-0" />
              <span className="truncate hidden sm:inline">{tab.label}</span>
              {tab.id === "compliance" &&
                settings.verification_status !== "verified" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
                )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Profile Tab ─────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8">
          <h2 className="text-base sm:text-[18px] font-semibold flex items-center gap-2 mb-5 sm:mb-6">
            <User className="opacity-75 shrink-0" size={18} />
            Personal & Business Information
          </h2>
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
                <p
                  className={clsx(
                    "font-medium text-sm sm:text-[15px] break-words",
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

      {/* ── Contact Tab ─────────────────────────────────── */}
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

      {/* ── Compliance Tab ───────────────────────────────── */}
      {activeTab === "compliance" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8 w-full overflow-hidden">
          <ComplianceWizard />
        </div>
      )}

      {/* ── Preferences Tab ──────────────────────────────── */}
      {activeTab === "preferences" && (
        <div className="bg-background rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-8 max-w-2xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8">
            Preferences
          </h2>
          <div className="space-y-8 sm:space-y-10">
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
