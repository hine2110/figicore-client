import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Copy } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface RemoteScannerModalProps {
    open: boolean;
    onClose: () => void;
    roomId: string;
}

const RemoteScannerModal: React.FC<RemoteScannerModalProps> = ({ open, onClose, roomId }) => {
    const { toast } = useToast();
    // Tạo link tương đối hoặc tuyệt đối tùy môi trường, để an toàn trong dev dùng window.location.origin
    const url = `${window.location.origin}/remote-scanner?room=${roomId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        toast({
            title: "Đã copy link",
            description: "Gửi link này qua Zalo/Mess cho điện thoại nếu không quét được QR",
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md bg-white border-neutral-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-indigo-600" />
                        Ghép nối Máy quét Điện thoại
                    </DialogTitle>
                    <DialogDescription>
                        Dùng ứng dụng Camera trên điện thoại của bạn quét mã QR dưới đây để biến điện thoại thành máy tít mã vạch không dây.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 gap-6">
                    <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center justify-center">
                        <QRCodeSVG value={url} size={200} />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <div className="flex-1 px-3 py-2 bg-neutral-100 rounded-lg text-xs text-neutral-600 truncate font-mono">
                            {url}
                        </div>
                        <Button size="icon" variant="outline" onClick={handleCopy} title="Copy link">
                            <Copy className="w-4 h-4 text-neutral-500" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RemoteScannerModal;
