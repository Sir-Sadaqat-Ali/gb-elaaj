"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "border border-ge-border bg-white text-ge-ink shadow-md",
      }}
    />
  );
}
