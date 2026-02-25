import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
}

const CollapsibleContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
} | undefined>(undefined)

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
    ({ className, open: controlledOpen, onOpenChange: controlledOnOpenChange, defaultOpen = false, children, ...props }, ref) => {
        const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
        const isControlled = controlledOpen !== undefined
        const open = isControlled ? controlledOpen : uncontrolledOpen
        const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledOpen

        return (
            <CollapsibleContext.Provider value={{ open, onOpenChange: onOpenChange! }}>
                <div ref={ref} className={cn("", className)} {...props}>
                    {children}
                </div>
            </CollapsibleContext.Provider>
        )
    }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, onClick, ...props }, ref) => {
        const context = React.useContext(CollapsibleContext)
        if (!context) throw new Error("CollapsibleTrigger must be used within Collapsible")

        return (
            <button
                ref={ref}
                type="button"
                onClick={(e) => {
                    context.onOpenChange(!context.open)
                    onClick?.(e)
                }}
                className={cn("", className)}
                {...props}
            >
                {children}
            </button>
        )
    }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(CollapsibleContext)
        if (!context) throw new Error("CollapsibleContent must be used within Collapsible")

        if (!context.open) return null

        return (
            <div ref={ref} className={cn("overflow-hidden animate-in slide-in-from-top-1", className)} {...props}>
                {children}
            </div>
        )
    }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
