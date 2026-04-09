import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, Mail, Phone, User, CheckCircle2, Search, Edit3, AlertCircle } from 'lucide-react';
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

type ModalStep = 'form' | 'existing_found';

interface ExistingUser {
    user_id: number;
    full_name: string;
    phone: string;
    email: string | null;
    status_code: string;
    customers: { current_rank_code: string };
}

export default function RegisterCustomerModal({ open, onClose, onSuccess }: RegisterCustomerModalProps) {
    const [step, setStep] = useState<ModalStep>('form');
    const [formData, setFormData] = useState({ full_name: '', phone: '' });
    const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);
    const [editedName, setEditedName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const validatePhone = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        if (!phone.trim()) return 'Phone number is required';
        if (!/^0(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
            return 'Invalid VN mobile number (10 digits, starts with 03, 05, 07, 08, 09)';
        }
        return '';
    };

    const handlePhoneChange = (value: string) => {
        const cleanValue = value.replace(/\D/g, "").slice(0, 10);
        setFormData(prev => ({ ...prev, phone: cleanValue }));

        if (cleanValue.length === 10) {
            const error = validatePhone(cleanValue);
            setErrors(prev => ({ ...prev, phone: error }));
        } else if (errors.phone) {
            setErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const phoneError = validatePhone(formData.phone);

        if (phoneError) {
            setErrors({ phone: phoneError });
            return;
        }

        setLoading(true);
        try {
            const response = await registerCustomer({
                full_name: formData.full_name.trim() || 'Khách POS',
                phone: formData.phone.trim()
            });

            // Backend returns existing user if phone already found
            if (response.message?.includes('đã tồn tại') || response.message?.includes('existed')) {
                const existing = response.data as unknown as ExistingUser;
                setExistingUser(existing);
                setEditedName(existing.full_name || '');
                setStep('existing_found');
            } else {
                toast.success('New member registered successfully!');
                onSuccess(response.data);
                handleClose();
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            if (message.includes('phone') || message.includes('phone number')) {
                setErrors({ phone: message });
            } else if (message.includes('email')) {
                setErrors({ email: message });
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmExisting = async () => {
        if (!existingUser) return;
        setLoading(true);
        try {
            // Call register again with updated name — backend will update if GUEST_POS
            const response = await registerCustomer({
                full_name: editedName.trim() || existingUser.full_name,
                phone: existingUser.phone,
                email: existingUser.email || undefined
            });
            toast.success(`Selected customer: ${response.data.full_name}`);
            onSuccess(response.data);
            handleClose();
        } catch {
            toast.error('An error occurred, please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({ full_name: '', phone: '' });
            setErrors({});
            setStep('form');
            setExistingUser(null);
            setEditedName('');
            onClose();
        }
    };

    const getRankLabel = (code: string) => {
        const map: Record<string, string> = { BRONZE: '🥉 Member', SILVER: '🥈 Silver Member', GOLD: '🥇 Gold Member', DIAMOND: '💎 Diamond Member' };
        return map[code] || code;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px] bg-white p-0 overflow-hidden border-neutral-200 shadow-2xl rounded-2xl">
                <DialogHeader className="bg-neutral-50 px-6 py-4 border-b border-neutral-100">
                    <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-neutral-900">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        {step === 'form' ? 'Register Member' : 'Existing Customer Found'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'form' && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <Input
                                    id="phone"
                                    placeholder="Ex: 0901234567"
                                    value={formData.phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    onBlur={(e) => {
                                        const error = validatePhone(e.target.value);
                                        setErrors(prev => ({ ...prev, phone: error }));
                                    }}
                                    className={cn(
                                        "pl-9 h-11 bg-neutral-50 border-neutral-200 focus:bg-white transition-all text-base",
                                        errors.phone && "border-red-300 focus:ring-red-200"
                                    )}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            {errors.phone ? (
                                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 bg-red-400 rounded-full"></span> {errors.phone}
                                </p>
                            ) : (
                                <p className="text-[10px] text-neutral-400 italic"></p>
                            )}
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                Full Name <span className="text-neutral-300 font-normal normal-case">(Optional)</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <Input
                                    id="full_name"
                                    placeholder="Ex: John Doe"
                                    value={formData.full_name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, full_name: e.target.value });
                                        if (errors.full_name) setErrors({ ...errors, full_name: '' });
                                    }}
                                    className={cn(
                                        "pl-9 h-11 bg-neutral-50 border-neutral-200 focus:bg-white transition-all text-base",
                                        errors.full_name && "border-red-300 focus:ring-red-200"
                                    )}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100 mt-2">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 h-11 px-6 font-medium">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-neutral-900/20" disabled={loading}>
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</>
                                ) : (
                                    <><Search className="w-4 h-4 mr-2" />Check & Register</>
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {step === 'existing_found' && existingUser && (
                    <div className="p-6 space-y-5">
                        {/* Info Banner */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Phone number already exists</p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    {existingUser.status_code === 'GUEST_POS'
                                        ? 'This POS guest may not have an accurate name. You can update it below.'
                                        : 'This is an official account. You can only view the information.'}
                                </p>
                            </div>
                        </div>

                        {/* User Info Card */}
                        <div className="space-y-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                            <div className="flex items-center gap-2 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                <User className="w-3.5 h-3.5" />
                                Customer Information
                            </div>

                            {/* Phone (read-only) */}
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                                <span className="text-sm font-medium text-neutral-700">{existingUser.phone}</span>
                            </div>

                            {/* Email (read-only) */}
                            {existingUser.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                                    <span className="text-sm text-neutral-500">{existingUser.email}</span>
                                </div>
                            )}

                            {/* Rank */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                                    {getRankLabel(existingUser.customers?.current_rank_code || 'BRONZE')}
                                </span>
                            </div>
                        </div>

                        {/* Editable Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit_name" className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5" />
                                Display Name
                                {existingUser.status_code !== 'GUEST_POS' && (
                                    <span className="font-normal normal-case text-neutral-300">(Read-only)</span>
                                )}
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <Input
                                    id="edit_name"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="pl-9 h-11 bg-neutral-50 border-neutral-200 focus:bg-white transition-all text-base"
                                    disabled={loading || existingUser.status_code !== 'GUEST_POS'}
                                    placeholder="Enter customer name"
                                />
                            </div>
                            {existingUser.status_code === 'GUEST_POS' && (
                                <p className="text-[10px] text-indigo-500 italic">You can update the name for this POS guest.</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="outline" onClick={() => setStep('form')} disabled={loading} className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 h-11 px-5 font-medium">
                                ← Back
                            </Button>
                            <Button
                                onClick={handleConfirmExisting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-7 h-11 font-bold shadow-lg shadow-indigo-600/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-300" />Confirm Selection</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
