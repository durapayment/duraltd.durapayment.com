"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { authService } from "@/app/lib/auth";

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
    <div className="min-h-screen flex mt-10 justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-3xl font-bold">Log Out</h1>
        <p className="text-gray-600">
          Are you sure you want to log out of your account?
        </p>

        <div className="flex  sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onPress={() => router.back()}
            isDisabled={confirming}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onPress={handleLogout}
            isPending={confirming}
          >
            Yes, Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
