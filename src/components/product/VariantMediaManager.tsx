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
    const [youtubeUrl, setYoutubeUrl] = useState("");

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

            const newMedia: MediaItem[] = results.map(res => ({
                type: res.data.type === 'IMAGE' ? 'IMAGE' : 'VIDEO',
                source: 'CLOUDINARY',
                url: res.data.url
            }));

            onChange([...value, ...newMedia]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console.");
        } finally {
            setUploading(false);
        }
    };

    const handleAddYoutube = () => {
        if (!youtubeUrl) return;

        // Basic Youtube ID Regex
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = youtubeUrl.match(regExp);

        if (match && match[2].length === 11) {
            const newItem: MediaItem = {
                type: 'VIDEO',
                source: 'YOUTUBE',
                url: youtubeUrl // Or store the ID if preferred, but URL is safer for hydration
            };
            onChange([...value, newItem]);
            setYoutubeUrl("");
        } else {
            alert("Invalid YouTube URL");
        }
    };

    const handleRemove = (index: number) => {
        const next = [...value];
        next.splice(index, 1);
        onChange(next);
    };

    const getThumbnail = (item: MediaItem) => {
        if (item.source === 'YOUTUBE') {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = item.url.match(regExp);
            const id = (match && match[2].length === 11) ? match[2] : "";
            return `https://img.youtube.com/vi/${id}/0.jpg`;
        }
        if (item.type === 'IMAGE') {
            return item.url; // Cloudinary auto-scales usually, or append transformation
        }
        return ""; // Video placeholder?
    };

    return (
        <div className="space-y-4">
            {/* PREVIEW GRID */}
            <div className="grid grid-cols-4 gap-2">
                {value.map((item, idx) => (
                    <div key={idx} className="relative aspect-square bg-neutral-100 rounded-md overflow-hidden border group">
                        {item.type === 'IMAGE' || item.source === 'YOUTUBE' ? (
                            <img src={getThumbnail(item)} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                <Video className="w-8 h-8" />
                            </div>
                        )}

                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => handleRemove(idx)}>
                                <X className="w-3 h-3" />
                            </Button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate flex items-center justify-center gap-1">
                            {item.source === 'YOUTUBE' ? <Video className="w-3 h-3" /> : (item.type === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />)}
                            {item.source}
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
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="p-4 border rounded-md mt-2 bg-neutral-50/50">
                    <div className="flex flex-col items-center gap-2">
                        <label className="cursor-pointer bg-white border border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-blue-50 transition w-full">
                            {uploading ? <Loader2 className="w-8 h-8 text-blue-600 animate-spin" /> : <Upload className="w-8 h-8 text-blue-600 mb-2" />}
                            <span className="text-sm font-medium text-blue-900">{uploading ? "Uploading..." : "Click to select file"}</span>
                            <span className="text-xs text-blue-400 mt-1">Supports Image & Video</span>
                            <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                </TabsContent>
                <TabsContent value="youtube" className="p-4 border rounded-md mt-2 bg-neutral-50/50 space-y-2">
                    <div className="flex gap-2">
                        <Input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                        <Button type="button" onClick={handleAddYoutube} disabled={!youtubeUrl}>Add</Button>
                    </div>
                    <p className="text-xs text-neutral-500">
                        Paste a full YouTube link. The video cover will be used as the preview.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
