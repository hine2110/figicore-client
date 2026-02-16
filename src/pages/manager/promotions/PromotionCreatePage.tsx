import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { PromotionsService } from '@/services/promotions.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, "Tên khuyến mãi phải có ít nhất 2 ký tự."),
    type_code: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.coerce.number().min(0, "Giá trị phải lớn hơn hoặc bằng 0."),
    start_date: z.string(),
    end_date: z.string(),
    min_price: z.coerce.number().default(0),
    max_price: z.coerce.number().default(1000000000),
});

type FormValues = z.infer<typeof formSchema>;

export default function PromotionCreatePage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Security Check
    useEffect(() => {
        if (user?.role_code !== 'MANAGER') {
            toast({ title: "Truy cập bị từ chối", description: "Chỉ quản lý mới có quyền tạo khuyến mãi.", variant: "destructive" });
            navigate('/manager/promotions');
        }
    }, [user, navigate, toast]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            type_code: "PERCENTAGE",
            value: 0,
            start_date: "",
            end_date: "",
            min_price: 0,
            max_price: 1000000000,
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        if (new Date(values.start_date) >= new Date(values.end_date)) {
            form.setError("end_date", { message: "Ngày kết thúc phải sau ngày bắt đầu" });
            return;
        }

        try {
            // 1. Tạo khuyến mãi
            const newPromo = await PromotionsService.create({
                name: values.name,
                type_code: values.type_code,
                value: values.value,
                start_date: values.start_date,
                end_date: values.end_date,
                min_apply_price: values.min_price,
                max_apply_price: values.max_price,
            });

            // 2. Tự động áp dụng theo khoảng giá
            if (values.min_price !== undefined && values.max_price !== undefined) {
                toast({ title: "Đang xử lý...", description: "Hệ thống đang quét và áp dụng tự động..." });

                const result = await PromotionsService.applyByPriceRange(newPromo.promotion_id, {
                    minPrice: values.min_price,
                    maxPrice: values.max_price
                });

                if (result.count > 0) {
                    toast({ 
                        title: "Thành công!", 
                        description: `Đã tạo và tự động áp dụng cho ${result.count} sản phẩm.` 
                    });
                } else {
                    toast({ 
                        title: "Chú ý", 
                        description: "Đã tạo, nhưng không có sản phẩm nào trong khoảng giá này.", 
                        variant: "default" 
                    });
                }
            } else {
                toast({ title: "Thành công", description: "Đã tạo khuyến mãi!" });
            }

            // 3. Điều hướng
            queryClient.invalidateQueries({ queryKey: ['promotions'] });
            navigate('/manager/promotions');

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Lỗi", description: "Không thể tạo khuyến mãi." });
        }
    }

    if (user?.role_code !== 'MANAGER') return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Tạo Khuyến Mãi Mới</h2>
                <Button variant="outline" onClick={() => navigate('/manager/promotions')}>Hủy bỏ</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin khuyến mãi & Phạm vi áp dụng</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên chương trình</FormLabel>
                                        <FormControl>
                                            <Input placeholder= "Ví dụ: Sale Mùa Hè" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loại giảm giá</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                                                    <SelectItem value="FIXED_AMOUNT">Số tiền cố định (VND)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Giá trị giảm</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                {form.watch("type_code") === 'PERCENTAGE' ? "Nhập số % (ví dụ: 20)" : "Nhập số tiền (VND)"}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày bắt đầu</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày kết thúc</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Auto-Apply Price Range Section */}
                            <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                                <h3 className="font-semibold text-lg">Phạm vi áp dụng (Tuyên bố giá)</h3>
                                <p className="text-sm text-slate-500">
                                    Hệ thống sẽ tự động tìm và áp dụng khuyến mãi cho tất cả sản phẩm nằm trong khoảng giá này.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="min_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Giá thấp nhất (VND)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="0" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="max_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Giá cao nhất (VND)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="1000000000" {...field} />
                                                </FormControl>
                                                <FormDescription>Mặc định: 1 tỷ VND</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {form.formState.isSubmitting ? "Đang tạo & Áp dụng..." : "Tạo Khuyến Mãi"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
