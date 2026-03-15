
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { addressService, Province, District, Ward, Address } from '@/services/address.service';
import { Loader2 } from 'lucide-react';
import { User } from '@/types/auth.types';
import { useToast } from "@/components/ui/use-toast";
import { SearchableSelect } from '@/components/common/SearchableSelect';

export interface AddressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void; // Made optional to avoid strict requirement if not needed
    onSelect?: (addressId: number) => void;
    initialData?: Address | null;
    user?: User | null;
}

export default function AddressDialog({ open, onOpenChange, onSuccess, onSelect, initialData, user }: AddressDialogProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    // Master Data
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    const [formData, setFormData] = useState({
        recipient_name: '',
        recipient_phone: '',
        province_id: 0,
        province_name: '',
        district_id: 0,
        district_name: '',
        ward_code: '',
        ward_name: '',
        detail_address: '',
        is_default: false
    });

    // ... (UseEffect reset logic needs update too, doing via separate chunks if needed or all here if contiguous)
    // Actually, splitting into chunks might be safer given the file size and disjointed nature.
    // Let's do the state init first, then the handlers.

    // Wait, replace_file_content is for SINGLE CONTIGUOUS BLOCK.
    // The state init is at lines 33-41.
    // The handlers are at 115-128.
    // The submit is at 130+.
    // The selects are at 215+.

    // I should use multi_replace.

    // Reset Form on Open/InitialData Change
    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    recipient_name: initialData.recipient_name,
                    recipient_phone: initialData.recipient_phone,
                    province_id: initialData.province_id,
                    province_name: initialData.province_name || '',
                    district_id: initialData.district_id,
                    district_name: initialData.district_name || '',
                    ward_code: initialData.ward_code,
                    ward_name: initialData.ward_name || '',
                    detail_address: initialData.detail_address,
                    is_default: initialData.is_default
                });
                // Trigger cascading loads
                loadDistricts(initialData.province_id);
                loadWards(initialData.district_id);
            } else {
                setFormData({
                    recipient_name: user?.full_name || '',
                    recipient_phone: user?.phone || '',
                    province_id: 0,
                    province_name: '',
                    district_id: 0,
                    district_name: '',
                    ward_code: '',
                    ward_name: '',
                    detail_address: '',
                    is_default: false
                });
                setDistricts([]);
                setWards([]);
            }
        }
    }, [open, initialData, user]);

    // Load Provinces on Mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const res = await addressService.getProvinces();
                if (res.data) setProvinces(res.data);
            } catch (error) {
                console.error("Failed to load provinces", error);
            }
        };
        loadProvinces();
    }, []);

    const loadDistricts = async (provinceId: number) => {
        if (!provinceId) return;
        try {
            setLoading(true);
            const res = await addressService.getDistricts(provinceId);
            if (res.data) setDistricts(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadWards = async (districtId: number) => {
        if (!districtId) return;
        try {
            setLoading(true);
            const res = await addressService.getWards(districtId);
            if (res.data) setWards(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProvinceChange = (val: string) => {
        const pid = Number(val);
        const province = provinces.find(p => p.ProvinceID === pid);
        setFormData(prev => ({
            ...prev,
            province_id: pid,
            province_name: province?.ProvinceName || '',
            district_id: 0,
            district_name: '',
            ward_code: '',
            ward_name: ''
        }));
        setDistricts([]);
        setWards([]);
        loadDistricts(pid);
    };

    const handleDistrictChange = (val: string) => {
        const did = Number(val);
        const district = districts.find(d => d.DistrictID === did);
        setFormData(prev => ({
            ...prev,
            district_id: did,
            district_name: district?.DistrictName || '',
            ward_code: '',
            ward_name: ''
        }));
        setWards([]);
        loadWards(did);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let title = "";
            let message = "";

            // Validate required
            if (!formData.recipient_name || !formData.recipient_phone || !formData.province_id || !formData.district_id || !formData.ward_code || !formData.detail_address) {
                toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
                setSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                province_id: Number(formData.province_id),
                district_id: Number(formData.district_id)
            };

            if (initialData) {
                await addressService.updateAddress(initialData.address_id, payload);
                title = "Address Updated";
                message = "The address has been successfully updated.";
                onSelect?.(initialData.address_id);
            } else {
                const res: any = await addressService.createAddress(payload);
                title = "Address Created";
                message = "New address has been added to your address book.";
                if (res?.data?.address_id) {
                    onSelect?.(res.data.address_id);
                }
            }

            toast({
                title: title,
                description: message,
            });

            onSuccess?.();
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
                                onChange={e => setFormData({ ...formData, recipient_phone: e.target.value.replace(/[^0-9]/g, '') })}
                                maxLength={11}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Province / City</Label>
                        <SearchableSelect
                            options={provinces.map(p => ({ value: p.ProvinceID, label: p.ProvinceName }))}
                            value={formData.province_id}
                            onChange={handleProvinceChange}
                            placeholder="Search Province..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>District</Label>
                            <SearchableSelect
                                options={districts.map(d => ({ value: d.DistrictID, label: d.DistrictName }))}
                                value={formData.district_id}
                                onChange={handleDistrictChange}
                                placeholder="Search District..."
                                disabled={!formData.province_id || loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ward</Label>
                            <SearchableSelect
                                options={wards.map(w => ({ value: w.WardCode, label: w.WardName }))}
                                value={formData.ward_code}
                                onChange={(val) => {
                                    const ward = wards.find(w => w.WardCode === val);
                                    setFormData({ ...formData, ward_code: val, ward_name: ward?.WardName || '' });
                                }}
                                placeholder="Search Ward..."
                                disabled={!formData.district_id || loading}
                            />
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
