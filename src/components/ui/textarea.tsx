import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg px-3 py-2.5 text-[13px]",
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
          "transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
