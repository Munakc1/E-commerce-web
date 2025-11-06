import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm",
          // File input normalization
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder and transitions
          "placeholder:text-muted-foreground transition-colors duration-200",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Focus/hover aligned to theme (thrift green)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thrift-green focus-visible:ring-offset-2 focus-visible:border-thrift-green ring-offset-background hover:border-thrift-green/50",
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
