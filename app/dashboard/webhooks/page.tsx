"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  type LucideProps,
  Paperclip,
} from "lucide-react";
import { ProgressCircle, Toast, toast } from "@heroui/react";
import clsx from "clsx";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button, Input, Spinner } from "@heroui/react";

// ────────────────────────────────────────────────
// Utility: generate a random webhook signing secret
// ────────────────────────────────────────────────
function generateSecret(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomPart = Array.from({ length: 24 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
  return `whsec_${randomPart}`;
}

// ────────────────────────────────────────────────
// Initial mock data
// ────────────────────────────────────────────────
const INITIAL_SECRET = generateSecret();

const MOCK_WEBHOOK = {
  url: "https://api.yourapp.com/webhook/payment",
  secret: INITIAL_SECRET,
  events: [
    "charge.success",
    "charge.failed",
    "transfer.success",
    "subscription.create",
    "subscription.cancel",
  ],
  last_delivery: {
    time: "Just now",
    status: "waiting",
  },
};

const COMMON_EVENTS = [
  { id: "charge.success", label: "Successful payment", critical: true },
  { id: "charge.failed", label: "Failed payment" },
  { id: "transfer.success", label: "Transfer completed" },
  { id: "transfer.failed", label: "Transfer failed" },
];

export default function WebhooksAndCallbacks() {
  const router = useRouter();

  // ── Auth / page state ──────────────────────────
  // loading is false from the start — fully simulated, no server
  const [loading, setLoading] = useState(false);
  const [user] = useState<any>({ name: "Demo User" }); // always "logged in"

  // ── Webhook URL ────────────────────────────────
  const [webhookUrl, setWebhookUrl] = useState(MOCK_WEBHOOK.url);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  // ── Signing Secret ─────────────────────────────
  const [showSecret, setShowSecret] = useState(false);
  const [secret, setSecret] = useState(MOCK_WEBHOOK.secret);
  const [regeneratingSecret, setRegeneratingSecret] = useState(false);

  // ── Events ─────────────────────────────────────
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    MOCK_WEBHOOK.events,
  );

  // ── Test Delivery ──────────────────────────────
  const [sendingTest, setSendingTest] = useState(false);
  const [lastDelivery, setLastDelivery] = useState(MOCK_WEBHOOK.last_delivery);

  // ── Helpers ────────────────────────────────────
  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith("https://");
    } catch {
      return false;
    }
  };

  // ── Handlers ───────────────────────────────────

  const handleSaveUrl = async () => {
    if (!webhookUrl.trim()) {
      setUrlError("Webhook URL is required");
      return;
    }
    if (!validateUrl(webhookUrl)) {
      setUrlError("Please enter a valid HTTPS URL");
      return;
    }

    setSavingUrl(true);
    setUrlError("");

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 900));

    toast.success("Webhook URL updated", {
      description: "Your webhook endpoint has been saved.",
    });
    setEditingUrl(false);
    setSavingUrl(false);
  };

  const handleRegenerateSecret = async () => {
    setRegeneratingSecret(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));

    const newSecret = generateSecret();
    setSecret(newSecret);
    setShowSecret(true); // auto-reveal so the user can see (and copy) the new secret

    toast.warning("Signing secret regenerated", {
      description: "Your old secret will no longer work. Copy the new one now.",
    });

    setRegeneratingSecret(false);
  };

  const handleTestDelivery = async () => {
    setSendingTest(true);
    setLastDelivery({ time: "Just now", status: "waiting" });

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1800));

    const simulatedSuccess = Math.random() > 0.25;
    const newStatus = simulatedSuccess ? "success" : "failed";

    setLastDelivery({ time: "Just now", status: newStatus });

    if (simulatedSuccess) {
      toast.success("Test webhook sent", {
        description: "Check your server logs for the payload.",
      });
    } else {
      toast.danger("Test delivery failed", {
        description: "Your endpoint did not respond correctly.",
      });
    }

    setSendingTest(false);
  };

  const copyToClipboard = async (text: string, successMsg = "Copied!") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.danger("Copy failed", { description: "Please try again." });
    }
  };

  // ── Render guards ──────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <ProgressCircle aria-label="Loading..." className="text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // ── Delivery status helpers ────────────────────

  const deliveryStatusColor: Record<string, string> = {
    waiting: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  const GetDeliveryIcon = ({
    status,
    ...props
  }: { status: string } & LucideProps) => {
    const Icon = (() => {
      switch (status) {
        case "success":
          return CheckCircle2;
        case "failed":
          return XCircle;
        default:
          return Clock;
      }
    })();
    return <Icon {...props} />;
  };

  // ── JSX ────────────────────────────────────────

  return (
    <section className="p-3.75 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] md:text-[28px] font-[600]">
          Webhooks & Callbacks
        </h1>
        <p className="text-gray-600 mt-1">
          Receive real-time notifications about payment events.
        </p>
      </div>

      {/* Webhook URL */}
      <div className="mb-8 p-5 rounded-lg bg-background border border-default-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-medium">Webhook Endpoint URL</h3>
          {!editingUrl ? (
            <Button
              size="sm"
              variant="outline"
              onPress={() => setEditingUrl(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onPress={() => {
                  setEditingUrl(false);
                  setUrlError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
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
              value={webhookUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setWebhookUrl(e.target.value);
                setUrlError("");
              }}
              placeholder="https://your-server.com/webhook"
              className="placeholder:text-default-500 border px-4 py-2 rounded-md w-full outline-none placeholder:opacity-80"
            />
            {urlError && (
              <p className="text-xs text-red-500 mt-1">{urlError}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-3 bg-content2 p-3 rounded-md font-mono text-[15px] break-all">
            <code className="flex-1">{webhookUrl || "Not configured yet"}</code>
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
          We'll send POST requests with event data to this URL.
        </p>
      </div>

      {/* Signing Secret */}
      <div className="mb-8 p-5 rounded-lg bg-background border border-default-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[17px] font-[500]">Webhook Signing Secret</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Use this to verify requests (recommended)
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
            {showSecret ? secret : "••••••••••••••••••••••••••••••••"}
          </code>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setShowSecret(!showSecret)}
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
        </div>

        <p className="text-xs text-gray-500 mt-2 italic">
          Never expose this secret in client-side code.
        </p>
      </div>

      {/* Recent Deliveries */}
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
            No deliveries yet. Try sending a test webhook.
          </p>
        )}
      </div>

      {/* Warning Banner */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-amber-800">Important</p>
          <p className="text-sm text-amber-700 mt-1">
            Your webhook must use <strong>https://</strong> and respond quickly
            with 2xx status. Process events asynchronously.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-sm text-gray-500">
        <p>
          Need help? See our{" "}
          <a href="/docs/webhooks" className="text-primary hover:underline">
            webhook{" "}
            <span className="text-accent font-semibold">documentation</span>
          </a>
          .
        </p>
      </div>
    </section>
  );
}
