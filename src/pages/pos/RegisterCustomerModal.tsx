import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { registerCustomer } from '@/services/posService';
import { toast } from 'sonner';

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
            newErrors.full_name = 'Full name must be at least 2 characters';
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

            toast.success('✅ Customer registered successfully!');

            // Call success callback with customer data
            onSuccess(response.data);

            // Reset form and close
            setFormData({ full_name: '', phone: '', email: '' });
            setErrors({});
            onClose();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);

            // Set error on specific field if it's a duplicate error
            if (message.toLowerCase().includes('phone') || message.includes('điện thoại')) {
                setErrors({ phone: message });
            } else if (message.toLowerCase().includes('email')) {
                setErrors({ email: message });
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        Quick Customer Registration
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <Label htmlFor="full_name">
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="full_name"
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={(e) => {
                                setFormData({ ...formData, full_name: e.target.value });
                                if (errors.full_name) setErrors({ ...errors, full_name: '' });
                            }}
                            className={errors.full_name ? 'border-red-500' : ''}
                            disabled={loading}
                        />
                        {errors.full_name && (
                            <p className="text-xs text-red-500">{errors.full_name}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phone"
                            placeholder="0912345678"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                if (errors.phone) setErrors({ ...errors, phone: '' });
                            }}
                            className={errors.phone ? 'border-red-500' : ''}
                            disabled={loading}
                        />
                        {!errors.phone && (
                            <p className="text-xs text-neutral-500">Ex: 0912345678</p>
                        )}
                        {errors.phone && (
                            <p className="text-xs text-red-500">{errors.phone}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email <span className="text-neutral-400">(Optional)</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            className={errors.email ? 'border-red-500' : ''}
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Register
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
