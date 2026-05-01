"use client";

import { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  PlayCircle,
  MessageCircle,
  Clock,
  Mail,
  Phone,
  Send,
  ChevronDown,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

interface Business {
  verification_status: "verified" | "pending" | "rejected";
  name: string;
}

interface ContactForm {
  subject: string;
  message: string;
}

// Sample FAQs
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
      "Payouts to Nigerian bank accounts are typically settled within 30 minutes during banking hours. International transfers may take 1-3 business days.",
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
      "You can submit a ticket via the form below. We aim to respond within 4-24 hours. For urgent issues, email support@yourcompany.com.",
    category: "Support",
  },
];

export default function HelpSupport() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<Business>({
    verification_status: "pending",
    name: "Acme Corp",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(FAQ_ITEMS);
  const [openFAQ, setOpenFAQ] = useState<number>(1); // First FAQ open by default

  const [contactForm, setContactForm] = useState<ContactForm>({
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Simulate authentication
  useEffect(() => {
    const checkAuth = async () => {
      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock authenticated user
      setUser({
        id: "user_123",
        name: "John Doe",
        email: "john@acmecorp.com",
      });

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Filter FAQs
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFAQs(FAQ_ITEMS);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const filtered = FAQ_ITEMS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q),
    );
    setFilteredFAQs(filtered);
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

    const trimmedSubject = contactForm.subject.trim();
    const trimmedMessage = contactForm.message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      showToast("Please fill in both subject and message fields.", "error");
      return;
    }

    setSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      showToast("Message sent successfully! We'll get back to you soon.");

      // Reset form
      setContactForm({ subject: "", message: "" });
    } catch {
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? 0 : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex mt-10 justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-accent" size={25} />
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Help &amp; Support
        </h1>
        <p className="text-gray-600 mt-2 max-w-md">
          Find answers, explore documentation, or reach out to our support team.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Documentation */}
          <div
            onClick={() => window.open("/docs", "_blank")}
            className="group bg-white border border-gray-200 rounded-3xl p-8 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="text-accent" size={28} />
            </div>
            <h3 className="font-semibold text-xl mb-2">Documentation</h3>
            <p className="text-gray-600">
              API references, integration guides, and SDKs
            </p>
            <div className="mt-6 text-accent text-sm font-medium flex items-center gap-2">
              Explore docs →
            </div>
          </div>

          {/* Video Tutorials */}
          <div
            onClick={() => alert("Video tutorials coming soon!")}
            className="group bg-white border border-gray-200 rounded-3xl p-8 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PlayCircle className="text-rose-600" size={28} />
            </div>
            <h3 className="font-semibold text-xl mb-2">Video Tutorials</h3>
            <p className="text-gray-600">
              Step-by-step walkthroughs and onboarding videos
            </p>
            <div className="mt-6 text-rose-600 text-sm font-medium flex items-center gap-2">
              Watch videos →
            </div>
          </div>

          {/* Live Chat */}
          <div
            onClick={() =>
              alert("Live chat would open here (available Mon–Fri 9AM–5PM)")
            }
            className="group bg-white border border-gray-200 rounded-3xl p-8 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 text-[10px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
              LIVE
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="text-emerald-600" size={28} />
            </div>
            <h3 className="font-semibold text-xl mb-2">Live Chat</h3>
            <p className="text-gray-600">
              Talk to our support team in real-time
            </p>
            <div className="mt-6 text-emerald-600 text-sm font-medium flex items-center gap-2">
              Start chat →
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 mt-1">
              Quick answers to common questions
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
              <p className="text-gray-500">No FAQs match your search…</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-accent hover:underline text-sm"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{faq.question}</p>
                    {faq.category && (
                      <span className="inline-block mt-1.5 text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-full">
                        {faq.category}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={clsx(
                      "text-gray-400 transition-transform",
                      openFAQ === faq.id && "rotate-180",
                    )}
                    size={22}
                  />
                </button>

                <div
                  className={clsx(
                    "overflow-hidden transition-all duration-300",
                    openFAQ === faq.id ? "max-h-96" : "max-h-0",
                  )}
                >
                  <div className="px-8 pb-8 text-gray-600 leading-relaxed border-t border-gray-100 pt-6">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact Support Form */}
      <div className="bg-white border border-gray-200 rounded-3xl p-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Contact Support
            </h2>
            <p className="text-gray-600 mt-1">
              Our team typically responds within 4–24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) =>
                  setContactForm({ ...contactForm, subject: e.target.value })
                }
                placeholder="e.g., Issue with webhook delivery"
                className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                placeholder="Please describe your issue in detail..."
                rows={6}
                className="w-full px-5 py-4 border border-gray-200 rounded-3xl focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none resize-y min-h-[140px]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-10 py-3.5 bg-gray-900 hover:bg-black text-white font-medium rounded-2xl flex items-center justify-center gap-3 disabled:opacity-70 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={25} />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Expected response time:{" "}
          <span className="font-medium text-gray-700">4–24 hours</span>
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 mt-3 text-xs">
          <a
            href="mailto:support@yourcompany.com"
            className="hover:text-gray-900 flex items-center gap-1.5"
          >
            <Mail size={15} /> support@yourcompany.com
          </a>
          <a
            href="https://wa.me/2348012345678"
            target="_blank"
            className="hover:text-gray-900 flex items-center gap-1.5"
          >
            <Phone size={15} /> WhatsApp: +234 801 234 5678
          </a>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium z-50",
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white",
          )}
        >
          {toast.message}
        </div>
      )}
    </section>
  );
}
