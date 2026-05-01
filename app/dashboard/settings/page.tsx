"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Palette,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "react-hot-toast"; // Assuming you have react-hot-toast installed

interface UserData {
  id: string;
  fullName: string;
  businessId: string;
  companyName: string;
  email: string;
  phone: string;
}

interface SettingsData {
  contact: {
    alternative_email: string;
  };
  compliance: {
    registration_number: string;
    business_type: string;
    documents: {
      nin?: { name: string; url?: string };
      cac_certificate?: { name: string; url?: string };
      status_report?: { name: string; url?: string };
      memorandum?: { name: string; url?: string };
      board_resolution?: { name: string; url?: string };
    };
  };
  preferences: {
    receive_email_notifications: boolean;
    receive_sms_notifications: boolean;
    theme: "light" | "dark" | "system";
  };
}

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Private Limited Company",
  "Public Limited Company",
  "Partnership",
  "NGO",
  "Other",
];

export default function Settings() {
  const [user, setUser] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "contact" | "compliance" | "preferences"
  >("profile");
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Form states
  const [contactForm, setContactForm] = useState({ alternative_email: "" });
  const [complianceForm, setComplianceForm] = useState({
    registration_number: "",
    business_type: "",
  });

  // File states
  const [selectedFiles, setSelectedFiles] = useState<{
    nin: File | null;
    cac_certificate: File | null;
    status_report: File | null;
    memorandum: File | null;
    board_resolution: File | null;
  }>({
    nin: null,
    cac_certificate: null,
    status_report: null,
    memorandum: null,
    board_resolution: null,
  });

  // Preferences
  const [preferencesForm, setPreferencesForm] = useState({
    receive_email_notifications: true,
    receive_sms_notifications: true,
    theme: "system" as "light" | "dark" | "system",
  });

  // Mock auth check + data fetch
  useEffect(() => {
    const initialize = async () => {
      // Mock auth
      const mockUser: UserData = {
        id: "user_123",
        fullName: "John Doe",
        businessId: "BIZ-987654",
        companyName: "Acme Innovations Ltd",
        email: "john@acme.com",
        phone: "+234 803 123 4567",
      };
      setUser(mockUser);

      // Mock settings fetch
      const mockSettings: SettingsData = {
        contact: { alternative_email: "john.alt@acme.com" },
        compliance: {
          registration_number: "RC-1234567",
          business_type: "Private Limited Company",
          documents: {
            nin: { name: "john_nin.pdf" },
            cac_certificate: { name: "cac_cert_2025.pdf" },
          },
        },
        preferences: {
          receive_email_notifications: true,
          receive_sms_notifications: false,
          theme: "system",
        },
      };

      setSettings(mockSettings);
      setContactForm({
        alternative_email: mockSettings.contact.alternative_email,
      });
      setComplianceForm({
        registration_number: mockSettings.compliance.registration_number,
        business_type: mockSettings.compliance.business_type,
      });
      setPreferencesForm(mockSettings.preferences);

      // Handle URL param for verification complete
      const params = new URLSearchParams(window.location.search);
      if (params.get("completeVerification") === "true") {
        setActiveTab("compliance");
      }

      setLoading(false);
    };

    initialize();
  }, []);

  // Theme handler (mock - integrate next-themes in real app)
  const applyTheme = (theme: "light" | "dark" | "system") => {
    if (theme === "system") {
      document.documentElement.classList.remove("light", "dark");
    } else {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    }
  };

  const handleSaveContact = async () => {
    setSavingSection("contact");
    try {
      // Simulate API call: POST /api/settings/contact
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Contact information updated successfully");
    } catch (err) {
      toast.error("Failed to update contact information");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCompliance = async () => {
    setSavingSection("compliance");
    try {
      const formData = new FormData();
      formData.append(
        "registration_number",
        complianceForm.registration_number,
      );
      formData.append("business_type", complianceForm.business_type);

      // Append only selected files
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      // Simulate API call: POST /api/settings/compliance
      await new Promise((resolve) => setTimeout(resolve, 1200));

      toast.success("Compliance documents submitted successfully");

      // Clear selected files after success
      setSelectedFiles({
        nin: null,
        cac_certificate: null,
        status_report: null,
        memorandum: null,
        board_resolution: null,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save compliance information");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePreferences = async () => {
    setSavingSection("preferences");
    try {
      // Simulate API call: PATCH /api/settings/preferences
      await new Promise((resolve) => setTimeout(resolve, 600));
      applyTheme(preferencesForm.theme);
      toast.success("Preferences saved successfully");
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setSavingSection(null);
    }
  };

  const triggerFileInput = (type: keyof typeof selectedFiles) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFiles((prev) => ({ ...prev, [type]: file }));
      }
    };
    input.click();
  };

  const getDocumentDisplay = (
    type: keyof SettingsData["compliance"]["documents"],
    label: string,
  ) => {
    const existing = settings?.compliance.documents[type];
    const selected = selectedFiles[type];

    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
        <div className="flex items-center gap-3">
          <FileText className="text-acborder-accent" size={20} />
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-[12px] text-gray-500">
              {selected
                ? selected.name
                : existing
                  ? existing.name
                  : "No file uploaded"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => triggerFileInput(type)}
          className="px-4 py-2 text-sm font-medium text-acborder-accent hover:bg-violet-50 rounded-xl transition-colors flex items-center gap-2"
        >
          <Upload size={16} />
          {existing || selected ? "Update" : "Upload"}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-acborder-accent" size={32} />
          <p className="text-gray-500">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">Please log in to access settings.</div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Account Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your profile, business verification, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8 text-sm font-medium">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "contact", label: "Contact", icon: Mail },
            { id: "compliance", label: "Compliance", icon: Shield },
            { id: "preferences", label: "Preferences", icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "flex items-center flex-wrap gap-2 pb-4 border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {/* <tab.icon size={18} /> */}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-[18px] font-semibold mb-6 flex items-center gap-3">
            <User className="text-gray-400" /> Personal &amp; Business
            Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[12px] uppercase text-gray-500">
                Full Name
              </label>
              <p className="font-medium text-[16px]">{user.fullName}</p>
            </div>
            <div>
              <label className="block text-[12px] uppercase text-gray-500">
                Business ID
              </label>
              <p className="font-mono text-[16px] tracking-wide">
                {user.businessId}
              </p>
            </div>
            <div>
              <label className="block text-[12px] uppercase text-gray-500">
                Company Name
              </label>
              <p className="font-medium text-[16px]">{user.companyName}</p>
            </div>
            <div>
              <label className="block text-[12px] uppercase text-gray-500">
                Primary Email
              </label>
              <p className="font-medium text-[16px]">{user.email}</p>
            </div>
            <div>
              <label className="block text-[12px] uppercase text-gray-500">
                Phone Number
              </label>
              <p className="font-medium text-[16px]">{user.phone}</p>
            </div>
          </div>
          <p className="text-[12px] text-amber-600 mt-8 flex items-center gap-2">
            <AlertCircle size={16} /> Some fields are immutable. Contact support
            for changes.
          </p>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Contact Information</h2>

          <div className="space-y-8">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-2">
                Alternative Email
              </label>
              <input
                type="email"
                value={contactForm.alternative_email}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    alternative_email: e.target.value,
                  })
                }
                className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none"
                placeholder="alternate@email.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-2">
                Phone Number (Primary)
              </label>
              <div className="px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500 font-medium">
                {user.phone}
              </div>
              <p className="text-[12px] text-gray-400 mt-1">
                Cannot be changed here
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveContact}
            disabled={savingSection === "contact"}
            className="mt-10 w-full sm:w-auto px-8 py-3.5 bg-acborder-accent hover:bg-actext-accent disabled:opacity-70 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {savingSection === "contact" && (
              <Loader2 className="animate-spin" size={20} />
            )}
            Save Contact Info
          </button>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-2">
            Business Verification (KYC)
          </h2>
          <p className="text-gray-500 mb-8">
            Complete your business verification to unlock full platform
            features.
          </p>

          <div className="space-y-10">
            {/* Business Info */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-medium mb-2">
                    Registration Number (RC / BN)
                  </label>
                  <input
                    type="text"
                    value={complianceForm.registration_number}
                    onChange={(e) =>
                      setComplianceForm({
                        ...complianceForm,
                        registration_number: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2">
                    Business Type
                  </label>
                  <select
                    value={complianceForm.business_type}
                    onChange={(e) =>
                      setComplianceForm({
                        ...complianceForm,
                        business_type: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:border-violet-500 outline-none"
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Required Documents</h3>
              <div className="space-y-4">
                {getDocumentDisplay("nin", "National Identity Number (NIN)")}
                {getDocumentDisplay("cac_certificate", "CAC Certificate")}
                {getDocumentDisplay("status_report", "Company Status Report")}
                {getDocumentDisplay(
                  "memorandum",
                  "Memorandum & Articles of Association",
                )}
                {getDocumentDisplay("board_resolution", "Board Resolution")}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveCompliance}
            disabled={savingSection === "compliance"}
            className="mt-10 w-full sm:w-auto px-10 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {savingSection === "compliance" && (
              <Loader2 className="animate-spin" size={20} />
            )}
            Submit Compliance Documents
          </button>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-2xl">
          <h2 className="text-xl font-semibold mb-8">Preferences</h2>

          <div className="space-y-10">
            {/* Notifications */}
            <div>
              <h3 className="font-semibold mb-5 flex items-center gap-2">
                <Bell size={20} /> Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[15px]">Email Notifications</span>
                  <input
                    type="checkbox"
                    checked={preferencesForm.receive_email_notifications}
                    onChange={(e) =>
                      setPreferencesForm((prev) => ({
                        ...prev,
                        receive_email_notifications: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-acborder-accent"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[15px]">SMS Notifications</span>
                  <input
                    type="checkbox"
                    checked={preferencesForm.receive_sms_notifications}
                    onChange={(e) =>
                      setPreferencesForm((prev) => ({
                        ...prev,
                        receive_sms_notifications: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-acborder-accent"
                  />
                </label>
              </div>
            </div>

            {/* Appearance */}
            <div>
              <h3 className="font-semibold mb-5 flex items-center gap-2">
                <Palette size={20} /> Appearance
              </h3>
              <div className="flex gap-3">
                {(["light", "dark", "system"] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() =>
                      setPreferencesForm((prev) => ({ ...prev, theme }))
                    }
                    className={clsx(
                      "flex-1 py-2 rounded-2xl border text-sm font-medium transition-all",
                      preferencesForm.theme === theme
                        ? "border-accent bg-violet-50 text-accent"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    {theme === "system"
                      ? "System"
                      : theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={savingSection === "preferences"}
            className="mt-12 w-full sm:w-auto px-10 py-3.5 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {savingSection === "preferences" && (
              <Loader2 className="animate-spin" size={20} />
            )}
            Save Preferences
          </button>
        </div>
      )}
    </section>
  );
}
