import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm text-ge-ink",
        "placeholder:text-ge-muted",
        "focus:border-ge-primary focus:outline-none focus:ring-2 focus:ring-ge-primary/20",
        "disabled:cursor-not-allowed disabled:bg-ge-soft-bg disabled:opacity-60",
        "file:border-0 file:bg-transparent file:text-sm",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-md border border-ge-border bg-white px-3 py-2 text-sm text-ge-ink",
        "placeholder:text-ge-muted",
        "focus:border-ge-primary focus:outline-none focus:ring-2 focus:ring-ge-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-60 resize-y",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
