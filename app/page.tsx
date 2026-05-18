"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./components/button";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  // Router for navigationss
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error live once field has been touched
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setIsLoading(true);
    try {
      const loginData = {
        email: formData.email.trim(),
        password: formData.password,
      };

      // Call login API
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          password: result.message || "Login failed. Please try again.",
        }));
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      setSuccess(true);
    } catch {
      setErrors((prev) => ({
        ...prev,
        password: "Invalid email or password.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="px-5 md:px-20 flex flex-col flex-1 py-5 md:py-7  bg-cover bg-center bg-no-repeat"
      // style={{ backgroundImage: "url('./login-bg.png')" }}
    >
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
            <p className="text-[28px] leading-8 font-semibold">Welcome back</p>
            <p className="text-[13px]">
              Sign in to continue to your Dura Payment account.
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-300 px-4 py-3 text-sm text-green-800">
              You're logged in! Redirecting...
            </div>
          )}

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
              <p className="text-[12px] text-danger mt-1">{errors.password}</p>
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
            action={() => handleSubmit()}
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
