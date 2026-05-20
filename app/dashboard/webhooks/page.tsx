"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Paperclip,
  type LucideProps,
} from "lucide-react";
import { ProgressCircle, Toast, toast } from "@heroui/react";
import clsx from "clsx";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
type DeliveryStatus = "waiting" | "success" | "failed";

interface DeliveryState {
  time: string;
  status: DeliveryStatus;
}

// ────────────────────────────────────────────────
// Delivery icon helper
// ────────────────────────────────────────────────
function GetDeliveryIcon({
  status,
  ...props
}: { status: DeliveryStatus } & LucideProps) {
  const Icon =
    status === "success" ? CheckCircle2 : status === "failed" ? XCircle : Clock;
  return <Icon {...props} />;
}

// ────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────
export default function WebhooksAndCallbacks() {
  // ── Page load state ───────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // ── Webhook URL ───────────────────────────────
  const [webhookUrl, setWebhookUrl] = useState("");
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  // ── Signing Secret ────────────────────────────
  const [secret, setSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [regeneratingSecret, setRegeneratingSecret] = useState(false);

  // ── Test Delivery ─────────────────────────────
  const [sendingTest, setSendingTest] = useState(false);
  const [lastDelivery, setLastDelivery] = useState<DeliveryState | null>(null);

  // ── Load business data on mount ───────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("Failed to load account data");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = await res.json();

        // Support both { data: { business: {...} } } and { data: { webhook_url, secrete_hash } }
        console.log("user API response:", json); // remove after debugging

        const business =
          json?.data?.business ?? json?.business ?? json?.data ?? json ?? {};

        console.log("business object:", business); // remove after debugging

        setWebhookUrl(business.webhook_url ?? "");
        setSecret(business.secrete_hash ?? null);
      } catch (err: unknown) {
        setPageError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  // ── Helpers ───────────────────────────────────
  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const copyToClipboard = async (text: string, msg = "Copied!") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.danger("Copy failed");
    }
  };

  // ── Handlers ──────────────────────────────────
  const handleStartEdit = () => {
    setUrlDraft(webhookUrl);
    setUrlError("");
    setEditingUrl(true);
  };

  const handleCancelEdit = () => {
    setEditingUrl(false);
    setUrlError("");
  };

  const handleSaveUrl = async () => {
    if (!urlDraft.trim()) {
      setUrlError("Webhook URL is required");
      return;
    }
    if (!validateUrl(urlDraft)) {
      setUrlError("Must be a valid HTTPS URL");
      return;
    }

    setSavingUrl(true);
    setUrlError("");

    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook: urlDraft }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save webhook URL");
      }

      setWebhookUrl(urlDraft);
      setEditingUrl(false);
      toast.success("Webhook URL saved");
    } catch (err: unknown) {
      setUrlError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingUrl(false);
    }
  };

  const handleRegenerateSecret = async () => {
    setRegeneratingSecret(true);
    try {
      const res = await fetch("/api/webhook/regenerate-secret", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to regenerate secret");
      }

      setSecret(data.secret_hash);
      setShowSecret(true);
      toast.warning("Signing secret regenerated — copy it now");
    } catch (err: unknown) {
      toast.danger(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setRegeneratingSecret(false);
    }
  };

  const handleTestDelivery = async () => {
    if (!webhookUrl) {
      toast.danger("Set a webhook URL first");
      return;
    }

    setSendingTest(true);
    setLastDelivery({ time: "Just now", status: "waiting" });

    try {
      const res = await fetch("/api/webhook/test", { method: "POST" });
      const data = await res.json();

      if (!res.ok || data.status === "error") {
        setLastDelivery({ time: "Just now", status: "failed" });
        toast.danger("Test delivery failed", {
          description:
            data.message || "Your endpoint did not respond correctly.",
        });
      } else {
        setLastDelivery({ time: "Just now", status: "success" });
        toast.success("Test webhook delivered", {
          description: "Check your server logs for the payload.",
        });
      }
    } catch {
      setLastDelivery({ time: "Just now", status: "failed" });
      toast.danger("Test delivery failed");
    } finally {
      setSendingTest(false);
    }
  };

  // ── Render guards ─────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <ProgressCircle isIndeterminate aria-label="Loading...">
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{pageError}</p>
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

  const deliveryStatusColor: Record<DeliveryStatus, string> = {
    waiting: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  // ── JSX ───────────────────────────────────────
  return (
    <section className="pt-5 sm:pt-14 pb-5 sm:pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] md:text-[28px] font-[600]">
          Webhooks & Callbacks
        </h1>
        <p className="text-gray-600 mt-1">
          Receive real-time notifications about payment events.
        </p>
      </div>

      {/* ── Webhook URL ── */}
      <div className="mb-8 p-5 rounded-lg bg-background border border-default-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-medium">Webhook Endpoint URL</h3>
          {!editingUrl ? (
            <Button size="sm" variant="outline" onPress={handleStartEdit}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onPress={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className={"text-white"}
                onPress={handleSaveUrl}
                isPending={savingUrl}
              >
                {({ isPending }: { isPending: boolean }) => (
                  <>
                    {isPending ? (
                      <Spinner color="current" size="sm" />
                    ) : (
                      <Paperclip size={16} />
                    )}
                    {isPending ? "Saving..." : "Save"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {editingUrl ? (
          <div>
            <input
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setUrlError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSaveUrl()}
              placeholder="https://your-server.com/webhook"
              className="placeholder:text-default-500 border px-4 py-2 rounded-md w-full outline-none placeholder:opacity-80"
            />
            {urlError && (
              <p className="text-xs text-red-500 mt-1">{urlError}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-3 bg-content2 p-3 rounded-md font-mono text-[15px] break-all">
            <code className="flex-1">
              {webhookUrl || (
                <span className="text-gray-400 italic not-italic font-sans text-sm">
                  No webhook URL configured yet
                </span>
              )}
            </code>
            {webhookUrl && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => copyToClipboard(webhookUrl)}
              >
                <Copy size={16} />
                Copy
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          We&apos;ll send POST requests with event data to this URL.
        </p>
      </div>

      {/* ── Signing Secret ── */}
      <div className="mb-8 p-5 rounded-lg bg-background border border-default-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[17px] font-[500]">Webhook Signing Secret</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Use this to verify incoming requests
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onPress={handleRegenerateSecret}
            isPending={regeneratingSecret}
          >
            {({ isPending }: { isPending: boolean }) => (
              <>
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {isPending ? "Regenerating..." : "Regenerate"}
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-3 bg-content2 p-3 rounded-md font-mono break-all text-[15px]">
          <code className="flex-1 select-none">
            {secret ? (
              showSecret ? (
                secret
              ) : (
                "•".repeat(Math.min(secret.length, 40))
              )
            ) : (
              <span className="text-gray-400 italic not-italic font-sans text-sm">
                No secret yet — click Regenerate
              </span>
            )}
          </code>
          {secret && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setShowSecret((v) => !v)}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                {showSecret ? "Hide" : "Reveal"}
              </Button>
              {showSecret && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => copyToClipboard(secret, "Secret copied!")}
                >
                  <Copy size={16} />
                  Copy
                </Button>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2 italic">
          Never expose this secret in client-side code.
        </p>
      </div>

      {/* ── Test Delivery ── */}
      <div className="mb-8 p-5 rounded-lg bg-background border border-default-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-medium">Recent Deliveries</h3>
          <Button
            size="sm"
            variant="outline"
            onPress={handleTestDelivery}
            isPending={sendingTest}
          >
            {({ isPending }: { isPending: boolean }) => (
              <>
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isPending ? "Sending..." : "Send Test"}
              </>
            )}
          </Button>
        </div>

        {lastDelivery ? (
          <div className="flex items-center justify-between bg-content2 p-4 rounded-md">
            <div className="flex items-center gap-3">
              <GetDeliveryIcon
                status={lastDelivery.status}
                className={clsx(
                  lastDelivery.status === "waiting" && "text-gray-500",
                  lastDelivery.status === "success" && "text-green-600",
                  lastDelivery.status === "failed" && "text-red-600",
                )}
                size={20}
              />
              <div>
                <p className="font-medium">Test webhook</p>
                <p className="text-sm text-gray-500">{lastDelivery.time}</p>
              </div>
            </div>
            <span
              className={clsx(
                "text-xs font-medium px-3 py-1 rounded-full capitalize",
                deliveryStatusColor[lastDelivery.status],
              )}
            >
              {lastDelivery.status}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-6">
            No deliveries yet. Send a test webhook to get started.
          </p>
        )}
      </div>

      {/* ── Warning Banner ── */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-medium text-amber-800">Important</p>
          <p className="text-sm text-amber-700 mt-1">
            Your webhook must use <strong>https://</strong> and respond quickly
            with a 2xx status. Process events asynchronously to avoid timeouts.
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-10 text-[14px] text-gray-400">
        Need help?{" "}
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href={siteConfig.docUrl}
          className="text-accent hover:underline"
        >
          Read the integration docs →
        </Link>
      </div>
    </section>
  );
}
