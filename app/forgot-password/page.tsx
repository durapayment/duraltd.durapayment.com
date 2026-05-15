"use client";

import Link from "next/link";
import { useState } from "react";
import { Button as HeroButton, Modal } from "@heroui/react";
import { RiInformation2Line, RiCheckboxCircleLine } from "react-icons/ri";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { Button } from "../components/button";

// ─────────────────────────────────────────────────────────
// Password strength helper (matches register page logic)
// ─────────────────────────────────────────────────────────
function getPasswordStrength(pass: string): {
  label: string;
  color: string;
  width: string;
} {
  if (!pass) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
  if (score === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
  if (score === 3) return { label: "Good", color: "#3b82f6", width: "75%" };
  return { label: "Strong", color: "#22c55e", width: "100%" };
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  // ── Step 1: email form ──
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Modal / OTP ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  // ── New password fields (inside modal) ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Success state ──
  const [success, setSuccess] = useState(false);

  // ── Validators ──
  const validateEmail = (val: string) => {
    if (!val) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return "Enter a valid email address.";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required.";
    if (val.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(val)) return "Include at least one uppercase letter.";
    if (!/[0-9]/.test(val)) return "Include at least one number.";
    return "";
  };

  const validateOtp = (val: string) => {
    if (!val) return "OTP is required.";
    if (!/^\d{6}$/.test(val)) return "OTP must be exactly 6 digits.";
    return "";
  };

  const strength = getPasswordStrength(newPassword);

  // ── Step 1: Request OTP ──
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setEmailError(
          result.message || "Failed to send OTP. Please try again.",
        );
        return;
      }

      // OTP sent — open modal
      setOtp("");
      setOtpError("");
      setNewPassword("");
      setConfirmPassword("");
      setNewPasswordError("");
      setConfirmPasswordError("");
      setIsModalOpen(true);
    } catch {
      setEmailError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP + change password ──
  const handleVerifyOtp = async () => {
    // Validate all three fields before hitting the API
    const otpErr = validateOtp(otp);
    const pwErr = validatePassword(newPassword);
    const confirmErr = !confirmPassword
      ? "Please confirm your password."
      : confirmPassword !== newPassword
        ? "Passwords do not match."
        : "";

    setOtpError(otpErr);
    setNewPasswordError(pwErr);
    setConfirmPasswordError(confirmErr);

    if (otpErr || pwErr || confirmErr) return;

    setOtpVerifying(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          otp,
          password: newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // Map backend field errors if present
        if (result.errors) {
          if (result.errors.otp) setOtpError(result.errors.otp[0]);
          if (result.errors.password)
            setNewPasswordError(result.errors.password[0]);
        } else {
          setOtpError(
            result.message || "Verification failed. Please try again.",
          );
        }
        return;
      }

      setIsModalOpen(false);
      setSuccess(true);
    } catch {
      setOtpError("Network error. Please check your connection and try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setOtp("");
    setOtpError("");
    setNewPassword("");
    setConfirmPassword("");
    setNewPasswordError("");
    setConfirmPasswordError("");
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="px-5 md:px-20 flex flex-col flex-1 py-5 md:py-7 bg-cover bg-center bg-no-repeat">
      {/* ── Header ── */}
      <div className="flex items-center gap-15 justify-between mb-4">
        <Link href="/" className="flex min-w-max items-center gap-2">
          <img src="./logo.png" width={37} alt="logo" />
          <div className="flex flex-col">
            <p className="text-[18px] uppercase hidden md:flex font-bold text-accent-deep whitespace-nowrap">
              Dura Payment
            </p>
          </div>
        </Link>
        <Link href="/" className="font-semibold">
          Back to login
        </Link>
      </div>

      {/* ── Body ── */}
      <div className="flex mt-0 md:mt-10 flex-1 flex-col justify-between md:justify-start items-center">
        <div className="max-w-154 w-full flex flex-col gap-8 px-0 md:px-10 py-10">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <p className="text-[28px] leading-8 font-semibold">
              Forgot your password?
            </p>
            <p className="text-[13px]">
              Enter the email address linked to your Dura Payment account and
              we'll send you a one-time code.
            </p>
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <RiCheckboxCircleLine size={36} className="text-green-600" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-semibold">Password changed!</p>
                <p className="text-[13px] text-neutral-500 max-w-sm">
                  Your password has been updated successfully. You can now sign
                  in with your new password.
                </p>
              </div>
              <Link
                href="/"
                className="mt-2 px-8 py-3 bg-secondary hover:bg-tertiary text-white text-sm font-semibold rounded-md transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              {/* ── Email field ── */}
              <div className="flex flex-col gap-1 w-full">
                <p className="text-[13px]">Email address</p>
                <div
                  className={`flex items-center gap-2 rounded-md border bg-white px-3 py-3 ${
                    emailError
                      ? "border-danger ring-1 ring-red-200"
                      : "border-neutral-300 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/10"
                  }`}
                >
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError)
                        setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    placeholder="business@xyz.com"
                    autoComplete="email"
                    className="w-full text-sm text-black focus:outline-none"
                  />
                </div>
                {emailError && (
                  <p className="text-[12px] text-danger mt-1">{emailError}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Submit ── */}
        {!success && (
          <div className="flex max-w-154 px-0 md:px-10 w-full flex-col md:mb-0 md:mt-3 gap-2">
            <Button
              title="Send reset code"
              action={handleSubmit}
              isLoading={isLoading}
            />
            <p className="text-center text-sm">
              Remember your password?{" "}
              <Link
                href="/"
                className="text-secondary hover:text-tertiary font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* ── OTP + New Password Modal ── */}
      <Modal isOpen={isModalOpen}>
        <Modal.Backdrop>
          <Modal.Container className="w-full" size="lg" placement="top">
            <Modal.Dialog>
              <Modal.CloseTrigger onClick={handleCancelModal} />

              <Modal.Header>
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <RiInformation2Line size={24} />
                </Modal.Icon>
                <Modal.Heading className="font-black mt-2 text-[18px]">
                  Reset your password
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                <div className="flex flex-col mt-2 gap-5">
                  {/* Info text */}
                  <p className="text-[15px] text-black opacity-80">
                    If an account with <strong>{email}</strong> exists, a
                    6-digit code has been sent. Enter it below with your new
                    password.
                  </p>

                  {/* OTP input */}
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-black opacity-80">
                      Confirmation code
                    </p>
                    <div
                      className={`flex items-center gap-2 rounded-md border bg-white px-3 py-3 transition-all ${
                        otpError
                          ? "border-red-400 ring-1 ring-red-200"
                          : "border-neutral-300 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/10"
                      }`}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setOtp(val);
                          if (otpError) setOtpError(validateOtp(val));
                        }}
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="6-digit code"
                        className="w-full text-sm text-black focus:outline-none tracking-widest font-mono"
                      />
                      {/* Character counter */}
                      <span className="text-[11px] text-neutral-400 shrink-0 tabular-nums">
                        {otp.length}/6
                      </span>
                    </div>
                    {otpError && (
                      <p className="text-[12px] text-red-500 mt-0.5">
                        {otpError}
                      </p>
                    )}
                  </div>

                  {/* New password */}
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-black opacity-80">
                      New password
                    </p>
                    <div
                      className={`flex items-center gap-2 rounded-md border bg-white px-3 py-3 transition-all ${
                        newPasswordError
                          ? "border-red-400 ring-1 ring-red-200"
                          : "border-neutral-300 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/10"
                      }`}
                    >
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (newPasswordError)
                            setNewPasswordError(
                              validatePassword(e.target.value),
                            );
                        }}
                        onBlur={() =>
                          setNewPasswordError(validatePassword(newPassword))
                        }
                        placeholder="Min. 8 characters"
                        className="w-full text-sm text-black focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showPassword ? (
                          <HiEyeOff size={18} />
                        ) : (
                          <HiEye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Password strength bar */}
                    {newPassword && (
                      <div className="mt-1.5 flex flex-col gap-1">
                        <div className="h-1 w-full rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: strength.width,
                              backgroundColor: strength.color,
                            }}
                          />
                        </div>
                        <p
                          className="text-[11px]"
                          style={{ color: strength.color }}
                        >
                          {strength.label} password
                        </p>
                      </div>
                    )}

                    {newPasswordError && (
                      <p className="text-[12px] text-red-500 mt-0.5">
                        {newPasswordError}
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-black opacity-80">
                      Confirm new password
                    </p>
                    <div
                      className={`flex items-center gap-2 rounded-md border bg-white px-3 py-3 transition-all ${
                        confirmPasswordError
                          ? "border-red-400 ring-1 ring-red-200"
                          : "border-neutral-300 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/10"
                      }`}
                    >
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmPasswordError) {
                            setConfirmPasswordError(
                              e.target.value !== newPassword
                                ? "Passwords do not match."
                                : "",
                            );
                          }
                        }}
                        onBlur={() =>
                          setConfirmPasswordError(
                            confirmPassword !== newPassword
                              ? "Passwords do not match."
                              : "",
                          )
                        }
                        placeholder="Re-enter your password"
                        className="w-full text-sm text-black focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showConfirm ? (
                          <HiEyeOff size={18} />
                        ) : (
                          <HiEye size={18} />
                        )}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <p className="text-[12px] text-red-500 mt-0.5">
                        {confirmPasswordError}
                      </p>
                    )}
                  </div>

                  {/* Resend hint */}
                  <p className="text-[12px] text-neutral-400">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={async () => {
                        setOtpError("");
                        setIsLoading(true);
                        try {
                          await fetch("/api/auth/reset-password", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ email: email.trim() }),
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="text-secondary hover:text-tertiary font-medium transition-colors"
                    >
                      Resend code
                    </button>
                  </p>
                </div>
              </Modal.Body>

              <Modal.Footer className="mt-6">
                <HeroButton
                  className="rounded-sm px-8 py-5"
                  variant="outline"
                  onPress={handleCancelModal}
                >
                  Cancel
                </HeroButton>
                <HeroButton
                  isDisabled={otp.length !== 6 || otpVerifying}
                  isPending={otpVerifying}
                  className="rounded-sm text-white px-8 py-5"
                  onPress={handleVerifyOtp}
                >
                  Reset Password
                </HeroButton>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
