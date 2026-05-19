"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Button } from "./components/button";
import { useRouter } from "next/navigation";
import {
  RiRefreshLine,
  RiShieldCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";

export default function LoginPage() {
  const router = useRouter();

  // ── Step state ──────────────────────────────────────────
  const [step, setStep] = useState<"login" | "2fa">("login");

  // ── Login form ──────────────────────────────────────────
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── 2FA state ───────────────────────────────────────────
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup cooldown on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const validateEmail = (val: string) => {
    if (!val) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return "Enter a valid email address.";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required.";
    if (val.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Login form handlers ──────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]:
          name === "email" ? validateEmail(value) : validatePassword(value),
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors((prev) => ({
      ...prev,
      [name]: name === "email" ? validateEmail(value) : validatePassword(value),
    }));
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          password: result.message || "Login failed. Please try again.",
        }));
        return;
      }

      // Login succeeded — move to 2FA
      setOtp(["", "", "", "", "", ""]);
      setOtpError(null);
      setStep("2fa");
      startCooldown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setErrors((prev) => ({
        ...prev,
        password: "Invalid email or password.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP handlers ────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError(null);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      // Re-trigger login to resend the 2FA code
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      if (!response.ok) throw new Error("Could not resend code.");
      startCooldown();
    } catch (err: unknown) {
      setOtpError(
        err instanceof Error ? err.message : "Failed to resend code.",
      );
    }
  };

  const handleVerify2FA = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Please enter the full 6-digit code.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const response = await fetch("/api/verify/twofactorauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ otp: code, email: formData.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Invalid code. Please try again.");
      }

      // 2FA verified — go to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  const otpFilled = otp.every((d) => d !== "");

  // ── Render: Login ────────────────────────────────────────
  if (step === "login") {
    return (
      <div className="px-5 md:px-20 flex flex-col flex-1 py-5 md:py-7 bg-cover bg-center bg-no-repeat">
        {/* Header */}
        <div className="flex items-center gap-15 justify-between mb-4">
          <Link href={"/"} className="flex min-w-max items-center gap-2">
            <img src="./logo.png" width={37} alt="logo" />
            <div className="flex flex-col">
              <p className="text-[18px] uppercase hidden md:flex font-bold text-accent-deep whitespace-nowrap">
                Dura Payment
              </p>
            </div>
          </Link>
          <Link href="/register" className="font-semibold">
            Create account
          </Link>
        </div>

        <div className="flex mt-0 md:mt-10 flex-1 flex-col justify-between md:justify-start items-center">
          <div className="max-w-154 w-full flex flex-col gap-8 px-0 md:px-10 py-10">
            <div className="flex flex-col gap-1">
              <p className="text-[28px] leading-8 font-semibold">
                Welcome back
              </p>
              <p className="text-[13px]">
                Sign in to continue to your Dura Payment account.
              </p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1 w-full">
              <p className="text-[13px]">Enter a valid email address</p>
              <div
                className={`flex items-center gap-2 rounded-md border bg-white px-3 py-3 ${
                  errors.email
                    ? "border-danger ring-1 ring-red-200"
                    : "border-neutral-300 focus-within:border-stext-secondary focus-within:ring-1 focus-within:ring-stext-secondary/10"
                }`}
              >
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="business@xyz.com"
                  autoComplete="email"
                  className="w-full text-sm text-black focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[12px] text-danger mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <p className="text-[13px]">Enter your password</p>
              </div>
              <div
                className={`flex items-center gap-2 rounded-md border bg-white px-3 py-3 ${
                  errors.password
                    ? "border-danger ring-1 ring-red-200"
                    : "border-neutral-300 focus-within:border-stext-secondary focus-within:ring-1 focus-within:ring-stext-secondary/10"
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full text-sm text-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={22}
                      height={22}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M10.5 6.1A9 9 0 0 1 12 6c7 0 11 6 11 6a18.1 18.1 0 0 1-2.5 3.1M6.8 6.8A18 18 0 0 0 1 12s4 6 11 6a9 9 0 0 0 4.7-1.3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={22}
                      height={22}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-danger mt-1">
                  {errors.password}
                </p>
              )}
              <Link
                href="/forgot-password"
                className="text-[13px] mt-1 text-end font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <div className="flex max-w-154 px-0 md:px-10 w-full flex-col md:mb-0 md:mt-3 gap-2">
            <Button
              title="Login"
              action={() => handleLoginSubmit()}
              isLoading={isLoading}
            />
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-secondary hover:text-tertiary font-medium"
              >
                Create account
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: 2FA ──────────────────────────────────────────
  return (
    <div className="px-5 md:px-20 flex flex-col flex-1 py-5 md:py-7">
      {/* Header */}
      <div className="flex items-center gap-15 justify-between mb-4">
        <Link href={"/"} className="flex min-w-max items-center gap-2">
          <img src="./logo.png" width={37} alt="logo" />
          <div className="flex flex-col">
            <p className="text-[18px] uppercase hidden md:flex font-bold text-accent-deep whitespace-nowrap">
              Dura Payment
            </p>
          </div>
        </Link>
      </div>

      <div className="flex mt-0 md:mt-10 flex-1 flex-col justify-between md:justify-start items-center">
        <div className="max-w-154 w-full flex flex-col gap-8 px-0 md:px-10 py-10">
          {/* Icon + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center">
              <RiShieldCheckLine size={26} className="text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[24px] leading-8 font-semibold">
                Two-factor authentication
              </p>
              <p className="text-[13px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                A 6-digit verification code has been sent to{" "}
                <span className="font-medium text-gray-800">
                  {formData.email}
                </span>
                . Enter it below to continue.
              </p>
            </div>
          </div>

          {/* OTP inputs */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className={`w-12 h-13 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all ${
                    otpError
                      ? "border-red-300 bg-red-50 text-red-700"
                      : digit
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-neutral-300 bg-white focus:border-gray-600 text-gray-900"
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-[12px] text-danger text-center">{otpError}</p>
            )}

            {/* Resend */}
            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-gray-400">
                  Resend code in{" "}
                  <span className="font-semibold text-gray-600">
                    {resendCooldown}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-gray-600 underline underline-offset-2 hover:text-gray-900 transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex max-w-154 px-0 md:px-10 w-full flex-col md:mb-0 md:mt-3 gap-2">
          <button
            onClick={handleVerify2FA}
            disabled={!otpFilled || otpLoading}
            className="w-full py-3.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {otpLoading ? (
              <>
                <RiRefreshLine size={15} className="animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify & Continue"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("login");
              setOtp(["", "", "", "", "", ""]);
              setOtpError(null);
            }}
            className="w-full py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RiArrowLeftLine size={14} />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
