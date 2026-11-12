"use client";

import * as React from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { toast } from "sonner";

export function NotificationPromptButton({ className = "" }: { className?: string }) {
  const [permission, setPermission] = React.useState<NotificationPermission>("default");

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPushPermission() {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser.");
      return;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        toast.success("Notifications enabled! You will receive appointment and call updates.");
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "NOTIFICATION_ENABLED" });
        }
      } else if (res === "denied") {
        toast.info("Notifications are blocked in your browser settings.");
      }
    } catch (err) {
      console.warn("Notification request error:", err);
    }
  }

  if (permission === "granted") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 ${className}`}>
        <Check className="h-3.5 w-3.5" /> Notifications active
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={requestPushPermission}
      className={`inline-flex items-center gap-1.5 rounded-full border border-ge-primary/30 bg-ge-blue-tint/50 px-3 py-1 text-[11.5px] font-semibold text-ge-primary hover:bg-ge-primary hover:text-white transition shadow-2xs ${className}`}
    >
      <BellRing className="h-3.5 w-3.5" /> Enable Notifications
    </button>
  );
}
