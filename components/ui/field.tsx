import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "./cn";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        {optional ? (
          <span className="text-xs text-muted-foreground">选填</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs leading-5 text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const controlStyles =
  "min-h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/3%)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/75 hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-3 focus:ring-[color:color-mix(in_srgb,var(--ring)_22%,transparent)] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-65 aria-invalid:border-danger aria-invalid:ring-danger/15";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlStyles, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlStyles, "min-h-28 resize-y py-3", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <span className="relative block">
    <select
      ref={ref}
      className={cn(controlStyles, "appearance-none pr-10", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </span>
));
Select.displayName = "Select";
