
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addressService, Province, District, Ward, Address } from '@/services/address.service';
import { Loader2 } from 'lucide-react';
import { User } from '@/types/auth.types';
import { useToast } from "@/components/ui/use-toast";

interface AddressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: Address | null;
    user?: User | null;
}

export default function AddressDialog({ open, onOpenChange, onSuccess, initialData, user }: AddressDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Master Data
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        recipient_name: '',
        recipient_phone: '',
        province_id: '',
        district_id: '',
        ward_code: '',
        detail_address: '',
        is_default: false,
    });

    // Reset or Load Data on Open
    useEffect(() => {
        if (open) {
            loadProvinces();
            if (initialData) {
                // Edit Mode
                setFormData({
                    recipient_name: initialData.recipient_name,
                    recipient_phone: initialData.recipient_phone,
                    province_id: String(initialData.province_id),
                    district_id: String(initialData.district_id),
                    ward_code: initialData.ward_code,
                    detail_address: initialData.detail_address,
                    is_default: initialData.is_default,
                });
                // Load dependent data immediately for Edit Mode
                loadDistricts(initialData.province_id);
                loadWards(initialData.district_id);
            } else {
                // Create Mode - Auto-fill from User Profile
                setFormData({
                    recipient_name: user?.full_name || '',
                    recipient_phone: user?.phone || '',
                    province_id: '',
                    district_id: '',
                    ward_code: '',
                    detail_address: '',
                    is_default: false,
                });
                setDistricts([]);
                setWards([]);
            }
        }
    }, [open, initialData, user]);

    const loadProvinces = async () => {
        try {
            const res = await addressService.getProvinces();
            // Check if res itself is array or inside data
            const data = Array.isArray(res) ? res : (res as any).data;
            if (data) setProvinces(data);
        } catch (error) {
            console.error('Failed to load provinces', error);
        }
    };

    const loadDistricts = async (provinceId: number) => {
        if (!provinceId) return;
        setLoading(true);
        try {
            const res = await addressService.getDistricts(provinceId);
            const data = Array.isArray(res) ? res : (res as any).data;
            if (data) setDistricts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadWards = async (districtId: number) => {
        if (!districtId) return;
        setLoading(true);
        try {
            const res = await addressService.getWards(districtId);
            const data = Array.isArray(res) ? res : (res as any).data;
            if (data) setWards(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProvinceChange = (val: string) => {
        setFormData(prev => ({ ...prev, province_id: val, district_id: '', ward_code: '' }));
        setDistricts([]);
        setWards([]);
        loadDistricts(Number(val));
    };

    const handleDistrictChange = (val: string) => {
        setFormData(prev => ({ ...prev, district_id: val, ward_code: '' }));
        setWards([]);
        loadWards(Number(val));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                province_id: Number(formData.province_id),
                district_id: Number(formData.district_id),
            };

            let message = "";
            let title = "";

            if (initialData) {
                await addressService.updateAddress(initialData.address_id, payload);
                title = "Address Updated";
                message = "The address has been successfully updated.";
            } else {
                await addressService.createAddress(payload);
                title = "Address Created";
                message = "New address has been added to your address book.";
            }

            toast({
                title: title,
                description: message,
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Failed to save address', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to save address. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update your shipping details below.' : 'Enter your shipping details below. We retrieve location data directly from GHN.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Recipient Name</Label>
                            <Input
                                required placeholder="e.g. Alice Chen"
                                value={formData.recipient_name}
                                onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                required placeholder="e.g. 0987654321"
                                value={formData.recipient_phone}
                                onChange={e => setFormData({ ...formData, recipient_phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Province / City</Label>
                        <Select
                            value={formData.province_id}
                            onValueChange={handleProvinceChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Province" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {provinces.map(p => (
                                    <SelectItem key={p.ProvinceID} value={String(p.ProvinceID)}>
                                        {p.ProvinceName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Select
                                value={formData.district_id}
                                onValueChange={handleDistrictChange}
                                disabled={!formData.province_id || loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select District" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {districts.map(d => (
                                        <SelectItem key={d.DistrictID} value={String(d.DistrictID)}>
                                            {d.DistrictName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Ward</Label>
                            <Select
                                value={formData.ward_code}
                                onValueChange={(val) => setFormData({ ...formData, ward_code: val })}
                                disabled={!formData.district_id || loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Ward" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {wards.map(w => (
                                        <SelectItem key={w.WardCode} value={w.WardCode}>
                                            {w.WardName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Detailed Address</Label>
                        <Input
                            required placeholder="House number, Street name..."
                            value={formData.detail_address}
                            onChange={e => setFormData({ ...formData, detail_address: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="default"
                            checked={formData.is_default}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked as boolean })}
                        />
                        <Label htmlFor="default" className="font-normal cursor-pointer">Set as default address</Label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Update Address' : 'Save Address'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
