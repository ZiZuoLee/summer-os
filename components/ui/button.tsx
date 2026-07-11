import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

import { cn } from "./cn";

const buttonVariants = cva(
  "relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl border text-sm font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[color:color-mix(in_srgb,var(--ring)_35%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-[#041317] shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_22%,transparent)] hover:border-primary-strong hover:bg-primary-strong hover:text-white",
        secondary:
          "border-border-strong bg-surface-raised text-foreground shadow-soft hover:border-primary/45 hover:bg-primary-soft",
        soft: "border-transparent bg-primary-soft text-primary-strong hover:border-primary/20 hover:bg-primary/15",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        danger:
          "border-danger/20 bg-danger-soft text-danger hover:border-danger/35 hover:bg-danger/15",
      },
      size: {
        sm: "min-h-10 rounded-[0.7rem] px-3.5 text-xs",
        md: "px-4",
        lg: "min-h-12 rounded-[0.9rem] px-5 text-base",
        icon: "size-11 p-0",
      },
      width: {
        auto: "",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      width: "auto",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      disabled,
      loading = false,
      type = "button",
      variant,
      size,
      width,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, width }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : null}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export { buttonVariants };
