import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ge-primary text-white shadow-xs hover:bg-ge-primary-2 active:translate-y-px focus-visible:ring-2 focus-visible:ring-ge-primary focus-visible:ring-offset-2",
        secondary:
          "bg-white text-ge-ink border border-ge-border shadow-xs hover:border-ge-primary hover:text-ge-primary",
        ghost:
          "bg-transparent text-ge-ink hover:bg-ge-soft-bg",
        link: "text-ge-primary underline-offset-4 hover:underline px-0",
        dark:
          "bg-ge-navy text-white hover:bg-ge-ink",
        accent:
          "bg-ge-accent text-white shadow-xs hover:bg-[#F05A2E] active:translate-y-px focus-visible:ring-2 focus-visible:ring-ge-accent focus-visible:ring-offset-2",
        destructive:
          "bg-ge-danger text-white hover:opacity-90",
        "destructive-outline":
          "bg-white text-ge-danger border border-ge-danger/40 hover:bg-ge-danger/5",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
            <span>Working…</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
