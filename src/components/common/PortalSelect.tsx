import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { optionsService } from "@/services/options.service";

interface PortalSelectProps {
    entity: 'brands' | 'categories' | 'series';
    value?: number;
    onChange: (id: number) => void;
    placeholder?: string;
}

export function PortalSelect({ entity, value, onChange, placeholder }: PortalSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const [items, setItems] = useState<{ id: number; name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const triggerRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Data
    useEffect(() => {
        const loadData = async () => {
            // Only load when open
            if (!isOpen) return;

            setLoading(true);
            try {
                let data: any[] = [];
                if (entity === 'brands') data = await optionsService.getBrands();
                else if (entity === 'categories') data = await optionsService.getCategories();
                else if (entity === 'series') data = await optionsService.getSeries();

                const normalized = Array.isArray(data) ? data.map((i: any) => ({
                    id: i.brand_id || i.category_id || i.series_id || i.id,
                    name: i.name
                })) : [];
                setItems(normalized);
            } catch (e) {
                console.error("Failed to load options", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [entity, isOpen]);

    // FIX 1: POSITIONING with useLayoutEffect
    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        } else {
            setCoords(null);
        }
    }, [isOpen]);

    // Handle Create Logic
    const handleCreate = async () => {
        if (!searchTerm.trim()) return;

        setCreating(true);
        try {
            let newItem = null;
            if (entity === 'brands') newItem = await optionsService.createBrand(searchTerm);
            else if (entity === 'categories') newItem = await optionsService.createCategory(searchTerm);
            else if (entity === 'series') newItem = await optionsService.createSeries(searchTerm);

            if (newItem) {
                const normalized = {
                    id: newItem.brand_id || newItem.category_id || newItem.series_id || newItem.id,
                    name: newItem.name
                };

                setItems(prev => [...prev, normalized]);
                onChange(normalized.id);
                setIsOpen(false);
                setSearchTerm("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const selectedItem = items.find(i => i.id === value);

    // NORMALIZE INPUT
    const normalizedInput = searchTerm.trim().toLowerCase();

    // FILTER LOGIC
    const filtered = items.filter(i => i.name.toLowerCase().includes(normalizedInput));

    // EXACT MATCH LOGIC
    const exists = items.some(
        opt => opt.name.trim().toLowerCase() === normalizedInput
    );

    // SHOW CREATE CONDITION 
    const showCreate = normalizedInput.length > 0 && !exists && !creating;

    return (
        <>
            {/* Trigger Div */}
            <div
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
            >
                <span className={selectedItem ? "text-neutral-900" : "text-neutral-500"}>
                    {selectedItem ? selectedItem.name : placeholder || `Select ${entity}...`}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>

            {/* PORTAL */}
            {isOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9999] pointer-events-auto" // FIX: High Z-Index + Explicit Pointer Events
                    onClick={() => setIsOpen(false)} // Click outside to close
                >
                    <div
                        className={cn(
                            "absolute bg-white rounded-md border shadow-xl overflow-hidden z-[10000]", // Child higher than wrapper
                            "animate-in fade-in zoom-in-95 duration-75"
                        )}
                        style={{
                            // Only show if coords exist to prevent jumping
                            display: coords ? 'block' : 'none',
                            top: coords?.top,
                            left: coords?.left,
                            width: coords?.width
                        }}
                        // Prevent click inside from closing
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-neutral-100">
                            <input
                                autoFocus
                                className="w-full text-sm outline-none placeholder:text-neutral-400 bg-transparent"
                                placeholder={`Type to search or create ${entity}...`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* List */}
                        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 pointer-events-auto">
                            {/* Create Button */}
                            {showCreate && (
                                <div
                                    onMouseDown={(e) => {
                                        // FIX: Prevent Blur + Stop Propagation
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCreate();
                                    }}
                                    className="flex w-full items-center rounded-sm px-2 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium transition-colors"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Create "{searchTerm}"
                                </div>
                            )}

                            {/* Items */}
                            {filtered.map(item => (
                                <div
                                    key={item.id}
                                    onMouseDown={(e) => {
                                        // FIX: Use onMouseDown to win race against blur
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors",
                                        value === item.id ? "bg-neutral-100 font-medium text-neutral-900" : "hover:bg-neutral-50 text-neutral-700"
                                    )}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                                    {item.name}
                                </div>
                            ))}

                            {/* Empty State */}
                            {filtered.length === 0 && !showCreate && (
                                <div className="py-4 text-center text-xs text-neutral-400">
                                    {loading ? "Loading data..." : "No results found"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}