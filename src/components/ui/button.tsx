import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-foreground)] text-[var(--color-background)] hover:bg-[var(--color-foreground)]/90 active:scale-[0.98]",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:brightness-110 active:scale-[0.98] shadow-[var(--shadow-glow)]",
        outline:
          "border border-[var(--color-border-strong)] bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-foreground)]",
        ghost:
          "bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-foreground)]",
        subtle:
          "bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-elevated)]/80 text-[var(--color-foreground)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
