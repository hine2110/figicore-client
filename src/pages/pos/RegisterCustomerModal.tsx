import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Mail, Phone, User, CheckCircle2 } from 'lucide-react';
import { registerCustomer } from '@/services/posService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RegisterCustomerModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (customer: {
        user_id: number;
        full_name: string;
        phone: string;
        email: string | null;
        customers: {
            current_rank_code: string;
        };
    }) => void;
}

export default function RegisterCustomerModal({ open, onClose, onSuccess }: RegisterCustomerModalProps) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate full name
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        } else if (formData.full_name.trim().length < 2) {
            newErrors.full_name = 'Must be at least 2 characters';
        }

        // Validate phone
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^0\d{9}$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone number (10 digits starting with 0)';
        }

        // Validate email (optional)
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await registerCustomer({
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || undefined
            });

            toast.success('Customer registered successfully!');

            // Call success callback with customer data
            onSuccess(response.data);

            // Reset form and close
            setFormData({ full_name: '', phone: '', email: '' });
            setErrors({});
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';

            // Set error on specific field if it's a duplicate error
            if (message.toLowerCase().includes('phone') || message.includes('điện thoại')) {
                setErrors({ phone: message });
            } else if (message.toLowerCase().includes('email')) {
                setErrors({ email: message });
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ full_name: '', phone: '', email: '' });
            setErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px] bg-white p-0 overflow-hidden border-neutral-200 shadow-2xl rounded-2xl">
                <DialogHeader className="bg-neutral-50 px-6 py-4 border-b border-neutral-100">
                    <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-neutral-900">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        New Member
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <Input
                                id="full_name"
                                placeholder="e.g. Nguyen Van A"
                                value={formData.full_name}
                                onChange={(e) => {
                                    setFormData({ ...formData, full_name: e.target.value });
                                    if (errors.full_name) setErrors({ ...errors, full_name: '' });
                                }}
                                className={cn(
                                    "pl-9 bg-neutral-50 border-neutral-200 focus:bg-white transition-all",
                                    errors.full_name && "border-red-300 focus:ring-red-200"
                                )}
                                disabled={loading}
                            />
                        </div>
                        {errors.full_name && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span> {errors.full_name}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <Input
                                id="phone"
                                placeholder="0901234567"
                                value={formData.phone}
                                onChange={(e) => {
                                    setFormData({ ...formData, phone: e.target.value });
                                    if (errors.phone) setErrors({ ...errors, phone: '' });
                                }}
                                className={cn(
                                    "pl-9 bg-neutral-50 border-neutral-200 focus:bg-white transition-all",
                                    errors.phone && "border-red-300 focus:ring-red-200"
                                )}
                                disabled={loading}
                            />
                        </div>
                        {errors.phone ? (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span> {errors.phone}
                            </p>
                        ) : (
                            <p className="text-[10px] text-neutral-400">Used for membership tracking</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                            Email <span className="text-neutral-300 font-normal normal-case">(Optional)</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@email.com"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                className={cn(
                                    "pl-9 bg-neutral-50 border-neutral-200 focus:bg-white transition-all",
                                    errors.email && "border-red-300 focus:ring-red-200"
                                )}
                                disabled={loading}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-400 rounded-full"></span> {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-5 shadow-lg shadow-neutral-900/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Create Account
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
