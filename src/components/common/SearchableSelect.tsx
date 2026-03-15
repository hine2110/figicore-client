
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SearchableSelectProps {
    options: { value: string | number; label: string }[];
    value?: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    emptyMessage?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    disabled = false,
    emptyMessage = "No results found.",
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")

    const selectedOption = options.find((option) => String(option.value) === String(value))

    // Manual filtering for better control in nested modals
    const filteredOptions = React.useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    return (
        <Popover open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setSearchTerm("");
        }} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
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
                        placeholder={`Search...`} 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        autoFocus
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        {filteredOptions.length === 0 && (
                            <CommandEmpty className="py-6 text-center text-sm">{emptyMessage}</CommandEmpty>
                        )}
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    className="cursor-pointer py-2 px-3 !opacity-100 !pointer-events-auto"
                                    onMouseDown={(e: React.MouseEvent) => {
                                        // Winning the race against blur/Dialog focus trap
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange(String(option.value));
                                        setOpen(false);
                                        setSearchTerm("");
                                    }}
                                    onSelect={() => {
                                        // Keep onSelect for keyboard support if needed, 
                                        // but onMouseDown handles the mouse click robustly
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
