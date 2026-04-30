"use client";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  action?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-tertiary",
  outline: "bg-transparent text-accent hover:bg-tertiary/5",
  ghost:
    "bg-transparent text-accent border border-transparent hover:bg-accent/5",
  danger: "bg-red-500 text-white hover:bg-red-600 border border-red-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-3 text-[15px]",
  lg: "px-6 py-4 text-[16px]",
};

export function Button({
  title,
  action,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  icon,
  iconPosition = "left",
  fullWidth = true,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={action}
      disabled={disabled || isLoading}
      className={[
        "flex items-center cursor-pointer justify-center gap-2 rounded-md font-semibold",
        "active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
        "transition-all duration-150",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "w-fit",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isLoading ? (
        <>
          <Spinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className="flex items-center">{icon}</span>
          )}
          <span>{title}</span>
          {icon && iconPosition === "right" && (
            <span className="flex items-center">{icon}</span>
          )}
        </>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" opacity={0.3} />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
