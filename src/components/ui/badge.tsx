import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Spec 3.4: Badge Component

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-neutral-900 text-white shadow hover:bg-neutral-900/80",
                secondary:
                    "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
                outline: "text-foreground",
            },
            size: {
                sm: "px-2 py-0.5 text-xs", // Spec 3.4: Small
                md: "px-2.5 py-1 text-xs", // Spec 3.4: Medium (Default)
                lg: "px-3 py-1.5 text-sm", // Spec 3.4: Large
            }
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
