"use client";

import { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  PlayCircle,
  MessageCircle,
  Mail,
  Phone,
  Send,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { siteConfig } from "@/config/site";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

interface ContactForm {
  subject: string;
  message: string;
}

// ─────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────
const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: "How do I generate an API key?",
    answer:
      "Navigate to Settings → API Keys. Click 'Create New Key', select the environment (test/live), and set optional IP restrictions. Copy the key immediately as it will only be shown once.",
    category: "API",
  },
  {
    id: 2,
    question: "What are the transaction limits for unverified businesses?",
    answer:
      "Unverified businesses are limited to ₦500,000 per day and ₦2,000,000 per month. Completing KYC raises these limits significantly.",
    category: "Account",
  },
  {
    id: 3,
    question: "How long does it take for funds to settle?",
    answer:
      "Payouts to Nigerian bank accounts are typically settled within 30 minutes during banking hours. International transfers may take 1–3 business days.",
    category: "Payments",
  },
  {
    id: 4,
    question: "Can I test webhooks in sandbox mode?",
    answer:
      "Yes. Use the test environment and our webhook simulator tool available in the developer dashboard.",
    category: "API",
  },
  {
    id: 5,
    question: "What payment methods are supported?",
    answer:
      "We support bank transfers, card payments, USSD, and mobile money (where available). More methods are being added regularly.",
    category: "Payments",
  },
  {
    id: 6,
    question: "How do I contact support outside business hours?",
    answer:
      "You can submit a ticket via the form below. We aim to respond within 4–24 hours. For urgent issues, email support@yourcompany.com.",
    category: "Support",
  },
];

// Category color map — uses semantic opacity-based tints that work in both themes
const CATEGORY_STYLES: Record<string, string> = {
  API: "bg-accent/10 text-accent",
  Account: "bg-amber-500/10 text-amber-500",
  Payments: "bg-emerald-500/10 text-emerald-500",
  Support: "bg-blue-500/10 text-blue-500",
};

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function HelpSupport() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(FAQ_ITEMS);
  const [openFAQ, setOpenFAQ] = useState<number>(1);
  const [contactForm, setContactForm] = useState<ContactForm>({
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Simulate auth check
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Filter FAQs on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFAQs(FAQ_ITEMS);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    setFilteredFAQs(
      FAQ_ITEMS.filter(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q),
      ),
    );
  }, [searchQuery]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      showToast("Please fill in both subject and message fields.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showToast("Message sent! We'll get back to you soon.");
      setContactForm({ subject: "", message: "" });
    } catch {
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFAQ = (id: number) => setOpenFAQ(openFAQ === id ? 0 : id);

  // ── Loading ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  // ── Page ───────────────────────────────────────
  return (
    <section className="max-w-5xl mx-auto px-3 sm:px-4 pt-5 sm:pt-16 pb-5 sm:pb-8">
      {/* ── Header ── */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Help &amp; Support
        </h1>
        <p className="opacity-70 mt-1.5 text-sm sm:text-base max-w-md">
          Find answers, explore documentation, or reach out to our support team.
        </p>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-10 sm:mb-12">
        <h2 className="text-base sm:text-lg font-semibold mb-4 opacity-90">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Documentation */}
          <Link
            type="button"
            target="_blank"
            href={siteConfig.docUrl}
            className="group bg-background border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-left hover:border-accent/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <BookOpen className="text-accent" size={22} />
            </div>
            <p className="font-semibold text-base sm:text-lg mb-1">
              Documentation
            </p>
            <p className="text-sm opacity-60 leading-snug">
              API references, integration guides, and SDKs
            </p>
            <p className="mt-4 text-accent text-xs sm:text-sm font-medium">
              Explore docs →
            </p>
          </Link>

          {/* Video Tutorials */}
          <button
            type="button"
            onClick={() => alert("Video tutorials coming soon!")}
            className="group bg-background border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-left hover:border-rose-500/30 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
              <PlayCircle className="text-rose-500" size={22} />
            </div>
            <p className="font-semibold text-base sm:text-lg mb-1">
              Video Tutorials
            </p>
            <p className="text-sm opacity-60 leading-snug">
              Step-by-step walkthroughs and onboarding videos
            </p>
            <p className="mt-4 text-rose-500 text-xs sm:text-sm font-medium">
              Watch videos →
            </p>
          </button>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="mb-12 sm:mb-16">
        {/* FAQ header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">
              Frequently Asked Questions
            </h2>
            <p className="opacity-60 mt-1 text-sm">
              Quick answers to common questions
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search FAQs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border bg-background rounded-2xl focus:border-accent outline-none text-sm transition-colors placeholder:opacity-40"
            />
          </div>
        </div>

        {/* FAQ list */}
        <div className="space-y-2.5 sm:space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="bg-background border border-border rounded-2xl sm:rounded-3xl p-10 text-center">
              <p className="opacity-60 text-sm">No FAQs match your search…</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-accent hover:underline text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-background border border-border rounded-2xl sm:rounded-3xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-5 sm:px-8 py-4 sm:py-5 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-border/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base leading-snug">
                      {faq.question}
                    </p>
                    {faq.category && (
                      <span
                        className={clsx(
                          "inline-block mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium",
                          CATEGORY_STYLES[faq.category] ??
                            "bg-border/50 opacity-70",
                        )}
                      >
                        {faq.category}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={clsx(
                      "opacity-50 shrink-0 transition-transform duration-300 mt-0.5 sm:mt-0",
                      openFAQ === faq.id && "rotate-180",
                    )}
                    size={20}
                  />
                </button>

                <div
                  className={clsx(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openFAQ === faq.id ? "max-h-96" : "max-h-0",
                  )}
                >
                  <p className="px-5 sm:px-8 pb-5 sm:pb-7 pt-4 text-sm sm:text-[15px] opacity-75 leading-relaxed border-t border-border">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Contact Support Form ── */}
      <div className="bg-background border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Contact Support
            </h2>
            <p className="opacity-60 mt-1 text-sm">
              Our team typically responds within 4–24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-70 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) =>
                  setContactForm({ ...contactForm, subject: e.target.value })
                }
                placeholder="e.g., Issue with webhook delivery"
                className="w-full px-4 sm:px-5 py-3 border border-border bg-background rounded-2xl focus:border-accent outline-none text-sm transition-colors placeholder:opacity-40"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide opacity-70 mb-2">
                Message
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                placeholder="Please describe your issue in detail…"
                rows={5}
                className="w-full px-4 sm:px-5 py-3.5 border border-border bg-background rounded-2xl focus:border-accent outline-none text-sm transition-colors resize-y min-h-[130px] placeholder:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 bg-accent hover:bg-black disabled:opacity-60 text-white font-semibold rounded-2xl flex items-center justify-center gap-2.5 transition-colors text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Sending…
                </>
              ) : (
                <>
                  Send Message
                  <Send size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Footer Info ── */}
      <div className="mt-10 sm:mt-12 text-center">
        <p className="text-sm opacity-60">
          Expected response time:{" "}
          <span className="font-semibold opacity-100">4–24 hours</span>
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-3">
          <a
            href="mailto:support@durapayment.com"
            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1.5 transition-opacity"
          >
            <Mail size={13} />
            support@durapayment.com
          </a>
          <a
            href="https://wa.me/2348012345678"
            target="_blank"
            rel="noreferrer"
            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1.5 transition-opacity"
          >
            <Phone size={13} />
            WhatsApp: +234 801 234 5678
          </a>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={clsx(
            "fixed bottom-5 right-4 sm:right-6 left-4 sm:left-auto sm:max-w-sm",
            "px-4 py-3.5 rounded-2xl shadow-xl flex items-start gap-3 text-sm font-medium z-50",
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white",
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{toast.message}</span>
        </div>
      )}
    </section>
  );
}
