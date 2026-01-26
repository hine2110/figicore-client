
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
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { productsService } from "@/services/products.service"

interface SmartSelectProps {
    entity: 'brands' | 'categories' | 'series';
    value?: number;
    onChange: (id: number) => void;
    placeholder?: string;
}

export function SmartSelect({ entity, value, onChange, placeholder }: SmartSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [items, setItems] = React.useState<{ id: number; name: string }[]>([])
    const [loading, setLoading] = React.useState(false)
    const [query, setQuery] = React.useState("")

    React.useEffect(() => {
        fetchItems()
    }, [entity])

    const fetchItems = async () => {
        setLoading(true)
        try {
            const res = await productsService.getEntities(entity)
            setItems(res.data || [])
        } catch (error) {
            console.error(`Failed to fetch ${entity}`, error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!query) return
        try {
            setLoading(true)
            const res = await productsService.createEntity(entity, query)
            if (res.data) {
                // Assume backend returns the created object with { id, name }
                const newItem = res.data
                setItems((prev) => [...prev, newItem])
                onChange(newItem.id)
                setOpen(false)
                setQuery("")
            }
        } catch (error) {
            console.error(`Failed to create ${entity}`, error)
            alert(`Failed to create new item in ${entity}`)
        } finally {
            setLoading(false)
        }
    }

    const selectedItem = items.find((item) => item.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedItem ? selectedItem.name : (placeholder || `Select ${entity}...`)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput
                        placeholder={`Search ${entity}...`}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading ? (
                            <div className="py-6 text-center text-sm text-neutral-500">Loading...</div>
                        ) : (
                            <CommandEmpty className="py-2 px-2">
                                <p className="text-sm text-neutral-500 mb-2">No results found.</p>
                                {query && (
                                    <Button variant="secondary" size="sm" className="w-full" onClick={handleCreate}>
                                        <Plus className="w-3 h-3 mr-2" /> Create "{query}"
                                    </Button>
                                )}
                            </CommandEmpty>
                        )}
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item.name}
                                    onSelect={() => {
                                        onChange(item.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
