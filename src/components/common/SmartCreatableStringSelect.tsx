
import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

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
    options: string[] // List of available strings (suggestions)
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    onCreate?: (value: string) => void // Optional callback if external action needed
}

export function SmartCreatableStringSelect({
    options = [],
    value,
    onChange,
    onCreate,
    placeholder = "Select item...",
    label = "Item",
}: SmartCreatableStringSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    // Current value might not be in options list if it was just created
    // So we display the value directly if it exists


    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue)
        setOpen(false)
        setInputValue("")
    }

    const handleCreate = () => {
        if (!inputValue.trim()) return
        const newValue = inputValue.trim()

        onChange(newValue)
        if (onCreate) {
            onCreate(newValue)
        }

        setOpen(false)
        setInputValue("")
    }

    // Exact match check to decide if we show "Create" button
    const exactMatch = options.some(
        (opt) => opt.trim().toLowerCase() === inputValue.trim().toLowerCase()
    )

    // Also check if current value matches input 
    const isCurrentValueMatch = value?.toLowerCase() === inputValue.trim().toLowerCase()

    const showCreateOption = inputValue.trim().length > 0 && !exactMatch && !isCurrentValueMatch

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className={cn(!value && "text-muted-foreground")}>
                        {value ? value : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={`Search ${label?.toLowerCase() || "item"}...`}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            {options.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={() => handleSelect(option)}
                                    className="cursor-pointer"
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

                        {showCreateOption && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Create New">
                                    <CommandItem
                                        onSelect={handleCreate}
                                        className="text-blue-600 font-medium cursor-pointer"
                                        value={`CREATE:${inputValue}`}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create "{inputValue}"
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
