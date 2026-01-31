import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Upload, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

export type MediaItem = {
    type: 'IMAGE' | 'VIDEO';
    source: 'CLOUDINARY' | 'YOUTUBE';
    url: string;
};

interface VariantMediaManagerProps {
    value?: MediaItem[];
    onChange: (items: MediaItem[]) => void;
}

export function VariantMediaManager({ value = [], onChange }: VariantMediaManagerProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        try {
            // Upload all files concurrently
            const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append("file", file);
                return axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/upload`, formData);
            });

            const results = await Promise.all(uploadPromises);

            const newMedia: MediaItem[] = results.map(res => {
                // Robust check for type
                const type = res.data.type?.toLowerCase().includes('video') ? 'VIDEO' : 'IMAGE';
                return {
                    type: type,
                    source: 'CLOUDINARY',
                    url: res.data.url
                };
            });

            onChange([...value, ...newMedia]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index: number) => {
        const next = [...value];
        next.splice(index, 1);
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {/* PREVIEW GRID */}
            <div className="grid grid-cols-4 gap-2">
                {value.map((item, idx) => (
                    <div key={idx} className="relative aspect-square bg-neutral-100 rounded-md overflow-hidden border group">
                        {item.type === 'IMAGE' ? (
                            <img src={item.url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400 bg-neutral-900">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                        )}

                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => handleRemove(idx)}>
                                <X className="w-3 h-3" />
                            </Button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate flex items-center justify-center gap-1">
                            {item.type === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                            Cloudinary
                        </div>
                    </div>
                ))}

                {/* EMPTY STATE */}
                {value.length === 0 && (
                    <div className="col-span-4 py-4 text-center text-sm text-neutral-400 border border-dashed rounded-md">
                        No media assets added.
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col items-center gap-2">
                <label className="cursor-pointer bg-white border border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-blue-50 transition w-full">
                    {uploading ? <Loader2 className="w-8 h-8 text-blue-600 animate-spin" /> : <Upload className="w-8 h-8 text-blue-600 mb-2" />}
                    <span className="text-sm font-medium text-blue-900">{uploading ? "Uploading..." : "Click to select file"}</span>
                    <span className="text-xs text-blue-400 mt-1">Supports Image & Video</span>
                    <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                </label>
            </div>
        </div>
    );
}
