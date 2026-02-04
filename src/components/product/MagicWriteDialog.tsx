
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { productsService } from "@/services/products.service";

interface MagicWriteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productName: string;
    targetName?: string; // e.g. "Red Ver." or "Main"
    imageUrl?: string;
    onSuccess: (text: string) => void;
}

export function MagicWriteDialog({ open, onOpenChange, productName, targetName, imageUrl, onSuccess }: MagicWriteDialogProps) {
    const [loading, setLoading] = useState(false);
    const [userContext, setUserContext] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const text = await productsService.generateAiDescription({
                productName,
                variantName: targetName,
                userContext: userContext,
                imageUrl: imageUrl
            });
            onSuccess(text);
            onOpenChange(false);
            setUserContext(""); // Reset after success
        } catch (error) {
            console.error(error);
            alert("Failed to generate description");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-600">
                        <Wand2 className="w-5 h-5" /> Magic Write
                    </DialogTitle>
                    <DialogDescription>
                        Generate a professional description for <strong>{targetName ? `${productName} (${targetName})` : productName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Image Preview */}
                    {imageUrl && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <img src={imageUrl} alt="AI Context" className="w-12 h-12 rounded object-cover border bg-white" />
                            <div>
                                <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> AI Analysis Enabled
                                </p>
                                <p className="text-[10px] text-blue-600 leading-tight mt-0.5">
                                    Gemini will analyze this image to write a more accurate description.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Textarea
                            placeholder="Add hints here (e.g. 'Red color, metal build, limited edition, comes with stand...')..."
                            value={userContext}
                            onChange={(e) => setUserContext(e.target.value)}
                            className="min-h-[150px] font-normal leading-relaxed"
                        />
                        <p className="text-xs text-neutral-500">
                            Provide key details, and our AI expert will write a compelling sales pitch for you.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
