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

interface Option {
    label: string
    value: number
}

interface SmartCreatableSelectProps {
    options: Option[]
    value?: number
    onChange: (value: number) => void
    onCreate: (name: string) => Promise<number | null>
    placeholder?: string
    label?: string
}

export function SmartCreatableSelect({
    options,
    value,
    onChange,
    onCreate,
    placeholder = "Select item...",
    label = "Item",
}: SmartCreatableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [creating, setCreating] = React.useState(false)

    const selectedOption = options.find((opt) => opt.value === value)

    const handleCreate = async () => {
        if (!inputValue.trim()) return
        setCreating(true)
        try {
            const newId = await onCreate(inputValue)
            if (newId) {
                onChange(newId)
                setOpen(false)
                setInputValue("")
            }
        } catch (error) {
            console.error("Failed to create item", error)
        } finally {
            setCreating(false)
        }
    }

    // Check if current input matches any existing option (case insensitive)
    const exactMatch = options.some(
        (opt) => opt.label.trim().toLowerCase() === inputValue.trim().toLowerCase()
    )

    const showCreateOption = inputValue.trim().length > 0 && !exactMatch

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {selectedOption ? selectedOption.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={`Search ${label?.toLowerCase() || "item"}...`}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                        {creating ? (
                            <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </div>
                        ) : (
                            <>
                                {options.filter(opt => opt.label.toLowerCase().includes(inputValue.toLowerCase())).length === 0 && !showCreateOption && (
                                    <CommandEmpty>No {label?.toLowerCase()} found.</CommandEmpty>
                                )}

                                <CommandGroup heading="Suggestions">
                                    {options
                                        .filter(opt => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
                                        .map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onPointerDown={(e) => e.preventDefault()}
                                                onSelect={() => {
                                                    onChange(option.value)
                                                    setOpen(false)
                                                    // setInputValue("") // Optional: decided not to clear to keep context if re-opened, or clear it. User request didn't specify. I'll stick to clearing it or simpler:
                                                    setInputValue("")
                                                }}
                                                className="cursor-pointer py-2 px-3 aria-selected:bg-blue-50 aria-selected:text-blue-900 data-[selected=true]:bg-blue-50"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === option.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {option.label}
                                            </CommandItem>
                                        ))}
                                </CommandGroup>

                                {showCreateOption && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={handleCreate}
                                                onPointerDown={(e) => e.preventDefault()}
                                                className="text-blue-600 font-medium cursor-pointer"
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
