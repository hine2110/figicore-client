import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SmartCreatableStringSelectProps {
    options: string[]
    value?: string
    onChange: (value: string) => void
    onCreate?: (name: string) => Promise<string | null>
    placeholder?: string
    label?: string
}

export function SmartCreatableStringSelect({
    options,
    value,
    onChange,
    onCreate,
    placeholder = "Select item...",
    label = "Item",
}: SmartCreatableStringSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [creating, setCreating] = React.useState(false)

    const handleCreate = async () => {
        const trimmedInput = inputValue.trim()
        if (!trimmedInput) return
        
        if (onCreate) {
            setCreating(true)
            try {
                const newValue = await onCreate(trimmedInput)
                if (newValue) {
                    onChange(newValue)
                    setOpen(false)
                    setInputValue("")
                }
            } catch (error) {
                console.error("Failed to create item", error)
            } finally {
                setCreating(false)
            }
        } else {
            // If no onCreate provided, just use the string directly
            onChange(trimmedInput)
            setOpen(false)
            setInputValue("")
        }
    }

    // Check if current input matches any existing option (case insensitive)
    const exactMatch = options.some(
        (opt) => opt.trim().toLowerCase() === inputValue.trim().toLowerCase()
    )

    const showCreateOption = inputValue.trim().length > 0 && !exactMatch

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase())
    )

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0 z-[9999]" 
                align="start"
                onOpenAutoFocus={(e: Event) => e.preventDefault()}
                onWheel={(e: React.WheelEvent) => e.stopPropagation()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={`Search ${label?.toLowerCase() || "item"}...`}
                        value={inputValue}
                        onValueChange={setInputValue}
                        autoFocus
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                        {creating ? (
                            <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </div>
                        ) : (
                            <>
                                {filteredOptions.length === 0 && !showCreateOption && (
                                    <CommandEmpty>No {label?.toLowerCase()} found.</CommandEmpty>
                                )}

                                {filteredOptions.length > 0 && (
                                    <CommandGroup heading="Suggestions">
                                        {filteredOptions.map((option) => (
                                            <CommandItem
                                                key={option}
                                                value={option}
                                                onMouseDown={(e: React.MouseEvent) => {
                                                    // Winning the race against blur/Dialog focus trap
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onChange(option);
                                                    setOpen(false);
                                                    setInputValue("");
                                                }}
                                                onSelect={() => {
                                                    // Keep onSelect for keyboard support if needed, 
                                                    // but onMouseDown handles the mouse click robustly
                                                }}
                                                className="cursor-pointer py-2 px-3 !opacity-100 !pointer-events-auto aria-selected:bg-blue-50 aria-selected:text-blue-900 data-[selected=true]:bg-blue-50"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === option ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {option}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                {showCreateOption && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onMouseDown={(e: React.MouseEvent) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleCreate();
                                                }}
                                                className="text-blue-600 font-medium cursor-pointer !opacity-100 !pointer-events-auto"
                                                value={`CREATE:${inputValue}`} // Unique value for create item
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create "{inputValue}"
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </>
                        )}

                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
