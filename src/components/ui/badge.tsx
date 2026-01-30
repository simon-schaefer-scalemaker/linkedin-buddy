import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-neutral-950",
  {
    variants: {
      variant: {
        default: "border-transparent bg-white text-black",
        secondary: "border-neutral-700 bg-neutral-800 text-neutral-300",
        destructive: "border-red-500/30 bg-red-500/20 text-red-400",
        outline: "border-neutral-700 text-neutral-400 bg-transparent",
        success: "border-green-500/30 bg-green-500/20 text-green-400",
        warning: "border-amber-500/30 bg-amber-500/20 text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
