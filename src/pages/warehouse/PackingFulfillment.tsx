import { useState } from "react";
import { CheckSquare, Package, Camera, FileVideo, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

export default function PackingFulfillment() {
    // const [step, setStep] = useState(1); // Removed unused state
    const [checkedItems, setCheckedItems] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [videoUploaded, setVideoUploaded] = useState(false);

    const packingItems = [
        { id: 'i1', name: 'Wireless Headphones (WH-001)', qty: 1, location: 'A-12-03' },
        { id: 'i2', name: 'Protective Case (Black)', qty: 1, location: 'B-05-12' },
        { id: 'i3', name: 'Thank You Card', qty: 1, location: 'Pack-01' },
    ];

    const handleToggle = (id: string) => {
        if (checkedItems.includes(id)) {
            setCheckedItems(checkedItems.filter(i => i !== id));
        } else {
            setCheckedItems([...checkedItems, id]);
        }
    };

    const handleSimulateRecording = () => {
        setIsRecording(true);
        setTimeout(() => {
            setIsRecording(false);
            setVideoUploaded(true);
        }, 2000);
    };

    const allChecked = packingItems.every(i => checkedItems.includes(i.id));
    const progress = (checkedItems.length / packingItems.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Packing Station</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-neutral-500">Order</p>
                        <Badge variant="outline" className="font-mono text-blue-600 bg-blue-50 border-blue-200">#FC-1024</Badge>
                        <span className="text-neutral-300">•</span>
                        <div className="flex items-center gap-1 text-sm text-red-600 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Priority: High
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Checklist */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-neutral-900">1. Item Verification</h2>
                            <span className="text-xs font-medium text-neutral-500">{checkedItems.length}/{packingItems.length} Verified</span>
                        </div>
                        <div className="p-0">
                            <Progress value={progress} className="h-1 rounded-none bg-neutral-100" />
                        </div>
                        <div className="p-4 space-y-2">
                            {packingItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleToggle(item.id)}
                                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${checkedItems.includes(item.id)
                                        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                        : 'bg-white border-neutral-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`
                                        w-6 h-6 rounded-md border flex items-center justify-center transition-colors
                                        ${checkedItems.includes(item.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-neutral-300 group-hover:border-blue-400'}
                                    `}>
                                        {checkedItems.includes(item.id) && <CheckSquare className="w-4 h-4 text-white" />}
                                    </div>

                                    <div className="flex-1">
                                        <p className={`font-medium transition-colors ${checkedItems.includes(item.id) ? 'text-blue-900' : 'text-neutral-900'}`}>
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-neutral-500">Location: <span className="font-mono text-neutral-700">{item.location}</span></p>
                                    </div>

                                    <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-700">
                                        x{item.qty}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Step 2: Evidence */}
                    <Card className={`transition-opacity duration-300 ${allChecked ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                            <h2 className="font-bold text-neutral-900">2. Packing Evidence</h2>
                        </div>
                        <div className="p-6">
                            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 bg-neutral-50/50 flex flex-col items-center justify-center text-center">
                                {videoUploaded ? (
                                    <div className="flex flex-col items-center animate-in fade-in zoom-in">
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                            <FileVideo className="w-6 h-6" />
                                        </div>
                                        <p className="font-medium text-green-700">Video Recorded Successfully</p>
                                        <p className="text-xs text-green-600/80 mb-4">evidence_fc1024.mp4 (14.2 MB)</p>
                                        <Button variant="outline" size="sm" onClick={() => setVideoUploaded(false)} className="text-xs h-8">
                                            Re-record
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-neutral-200 text-neutral-500'}`}>
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-neutral-900 mb-1">
                                            {isRecording ? 'Recording...' : 'Record Packing Process'}
                                        </h3>
                                        <p className="text-sm text-neutral-500 max-w-xs mb-6">
                                            Required for insurance claims. Ensure the shipping label is visible in the video.
                                        </p>
                                        <Button
                                            onClick={handleSimulateRecording}
                                            disabled={isRecording}
                                            className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                        >
                                            {isRecording ? 'Stop Recording' : 'Start Camera'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-neutral-900 mb-4">Shipping Details</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between pb-2 border-b border-neutral-100">
                                <span className="text-neutral-500">Carrier</span>
                                <span className="font-medium">FedEx Express</span>
                            </div>
                            <div className="flex justify-between pb-2 border-b border-neutral-100">
                                <span className="text-neutral-500">Weight</span>
                                <span className="font-medium">1.2 kg</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-neutral-500 block mb-1">Shipping To:</span>
                                <p className="font-medium text-neutral-900">John Doe</p>
                                <p className="text-neutral-600">123 Main St, Apt 4B</p>
                                <p className="text-neutral-600">New York, NY 10001</p>
                            </div>
                        </div>
                    </Card>

                    <Button
                        className="w-full h-14 text-lg font-bold shadow-lg shadow-blue-900/10"
                        disabled={!allChecked || !videoUploaded}
                    >
                        <Package className="w-5 h-5 mr-2" />
                        Complete Order
                    </Button>

                    {!allChecked && (
                        <p className="text-xs text-center text-neutral-400">
                            Complete verification checklist to proceed
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
