import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-10 w-full rounded-lg px-3 text-[13px]",
          // Light mode
          "border border-neutral-200 bg-white text-neutral-900",
          "placeholder:text-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400",
          // Dark mode
          "dark:border-neutral-800 dark:bg-neutral-900 dark:text-white",
          "dark:placeholder:text-neutral-600",
          "dark:focus:ring-white/10 dark:focus:border-neutral-700",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:bg-neutral-50 dark:disabled:bg-neutral-950",
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
