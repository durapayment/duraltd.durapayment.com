"use client";

import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Upload,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import clsx from "clsx";
import { DocumentStatus } from "@/app/lib/compliance";
import { useState } from "react";

// ─────────────────────────────────────────────────────────
// Document Status Badge
// ─────────────────────────────────────────────────────────
export function DocStatusBadge({
  status,
  required,
  uploaded,
}: {
  status: DocumentStatus;
  required: boolean;
  uploaded: boolean;
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle size={10} /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <XCircle size={10} /> Rejected
      </span>
    );
  }
  if (status === "under_review" || status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
        <Clock size={10} /> Under Review
      </span>
    );
  }
  if (uploaded) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle size={10} /> Uploaded
      </span>
    );
  }
  if (required) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
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
// Document Upload Row
// ─────────────────────────────────────────────────────────
export function DocUploadRow({
  label,
  hint,
  required,
  uploaded,
  status,
  fileName,
  url,
  rejectionReason,
  uploading,
  uploadProgress,
  disabled = false,
  onUpload,
  onDelete,
}: {
  label: string;
  hint: string;
  required: boolean;
  uploaded: boolean;
  status: DocumentStatus;
  fileName: string | null;
  url: string | null;
  rejectionReason: string | null;
  uploading?: boolean;
  uploadProgress?: number;
  disabled?: boolean;
  onUpload: (file: File) => void;
  onDelete?: () => void;
}) {
  const triggerUpload = () => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onUpload(file);
    };
    input.click();
  };

  // Approved docs are always locked; a disabled wizard state locks everything else too.
  const isLocked = status === "approved" || disabled;

  return (
    <div
      className={clsx(
        "flex flex-col gap-3 p-4 border rounded-2xl w-full transition-colors",
        status === "approved" && "border-green-200 bg-green-50/30",
        status === "rejected" && "border-red-200 bg-red-50/20",
        status === "under_review" || status === "submitted"
          ? "border-blue-200 bg-blue-50/10"
          : "",
        !status && uploaded && "border-green-200 bg-green-50/20",
        !status && !uploaded && required && "border-amber-200 bg-amber-50/10",
        !status && !uploaded && !required && "border-gray-200 bg-background",
        disabled && "opacity-70",
      )}
    >
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-medium text-sm">{label}</p>
            <DocStatusBadge
              status={status}
              required={required}
              uploaded={uploaded}
            />
          </div>
          <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>

          {/* Rejection reason */}
          {status === "rejected" && rejectionReason && (
            <p className="text-[12px] text-red-600 mt-1.5 flex items-start gap-1">
              <XCircle size={12} className="shrink-0 mt-0.5" />
              {rejectionReason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {url && !uploading && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              title="View document"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {status !== "approved" && (
            <button
              type="button"
              onClick={triggerUpload}
              disabled={uploading || disabled}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border rounded-xl transition-colors whitespace-nowrap",
                status === "rejected"
                  ? "border-red-300 text-red-700 hover:bg-red-50"
                  : uploaded
                    ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                    : required
                      ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
              )}
            >
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              {uploading
                ? `${uploadProgress ?? 0}%`
                : uploaded
                  ? "Replace"
                  : "Upload"}
            </button>
          )}
        </div>
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${uploadProgress ?? 0}%` }}
          />
        </div>
      )}

      {/* Existing file */}
      {!uploading && uploaded && fileName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] text-gray-700">
          <CheckCircle size={12} className="text-green-500 shrink-0" />
          <span className="break-all min-w-0 flex-1">
            {decodeURIComponent(fileName)}
          </span>
          {!isLocked && onDelete && (
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
              title="Remove"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────
export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="w-full mb-8">
      {/* Mobile: just show current step */}
      <div className="flex sm:hidden items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-900">
          Step {currentStep + 1} of {steps.length}
        </p>
        <p className="text-sm text-gray-500">{steps[currentStep]}</p>
      </div>

      {/* Desktop: full step row */}
      <div className="hidden sm:flex items-center w-full">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  i < currentStep
                    ? "bg-green-500 text-white"
                    : i === currentStep
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-400",
                )}
              >
                {i < currentStep ? (
                  <CheckCircle size={16} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <p
                className={clsx(
                  "text-[11px] mt-1 text-center whitespace-nowrap",
                  i === currentStep
                    ? "font-semibold text-gray-900"
                    : i < currentStep
                      ? "text-green-600"
                      : "text-gray-400",
                )}
              >
                {step}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  "flex-1 h-0.5 mx-2 mb-5 transition-all",
                  i < currentStep ? "bg-green-400" : "bg-gray-200",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar (mobile) */}
      <div className="sm:hidden w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div
          className="bg-gray-900 h-1.5 rounded-full transition-all"
          style={{
            width: `${Math.round(((currentStep + 1) / steps.length) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Progress Ring
// ─────────────────────────────────────────────────────────
export function ProgressRing({
  percent,
  size = 64,
}: {
  percent: number;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  const color =
    percent === 100 ? "#22c55e" : percent > 50 ? "#3b82f6" : "#f59e0b";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#e5e7eb"
        strokeWidth={8}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Verification Status Banner
// ─────────────────────────────────────────────────────────
export function VerificationBanner({
  status,
  rejectionReason,
}: {
  status: string;
  rejectionReason?: string | null;
}) {
  const config: Record<
    string,
    { cls: string; icon: React.ReactNode; title: string; body: string }
  > = {
    under_review: {
      cls: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Clock size={16} className="text-blue-500 shrink-0" />,
      title: "Under Review",
      body: "Your documents are being reviewed. This usually takes 1–3 business days. Editing is disabled until a decision is made.",
    },
    verified: {
      cls: "bg-green-50 border-green-200 text-green-800",
      icon: <CheckCircle size={16} className="text-green-500 shrink-0" />,
      title: "Verified",
      body: "Your business is fully verified. You have access to all platform features.",
    },
    rejected: {
      cls: "bg-red-50 border-red-200 text-red-800",
      icon: <XCircle size={16} className="text-red-500 shrink-0" />,
      title: "Verification Rejected",
      body:
        rejectionReason ??
        "Your verification was rejected. Please review the feedback and resubmit.",
    },
  };

  const cfg = config[status];
  if (!cfg) return null;

  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-4 border rounded-xl mb-6",
        cfg.cls,
      )}
    >
      {cfg.icon}
      <div>
        <p className="font-semibold text-sm">{cfg.title}</p>
        <p className="text-sm mt-0.5">{cfg.body}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Nav Buttons
// ─────────────────────────────────────────────────────────
export function WizardNav({
  onBack,
  onNext,
  onSave,
  nextLabel = "Continue",
  backLabel = "Back",
  saving = false,
  isFirst = false,
  isLast = false,
  disabled = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  nextLabel?: string;
  backLabel?: string;
  saving?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-colors"
      >
        {backLabel}
      </button>

      <div className="flex items-center gap-3">
        {onSave && !isLast && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || disabled}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save & Continue Later
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={saving || disabled}
          className={clsx(
            "px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed",
            isLast
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-gray-900 hover:bg-gray-800",
          )}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
