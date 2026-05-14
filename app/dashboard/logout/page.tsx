"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/lib/auth";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const handleLogout = async () => {
    setConfirming(true);
    try {
      await authService.logout();
      router.replace("/");
    } catch (err) {
      console.error(err);
      setConfirming(false);
    }
  };

  return (
    <div className="h-svh flex items-start justify-center px-4">
      <div className="w-full mt-10 max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <LogOut size={28} className="text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Log out?</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            You'll need to sign in again to access your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogout}
            disabled={confirming}
            className="w-full py-3 px-6 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {confirming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Logging out…
              </>
            ) : (
              <>
                <LogOut size={16} />
                Yes, log me out
              </>
            )}
          </button>

          <button
            onClick={() => router.back()}
            disabled={confirming}
            className="w-full py-3 px-6 border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
