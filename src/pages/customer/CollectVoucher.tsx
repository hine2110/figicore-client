import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VouchersService } from '@/services/vouchers.service';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, ShoppingBag, TicketPercent } from 'lucide-react';
import CustomerLayout from '@/layouts/CustomerLayout';

type State = 'loading' | 'success' | 'error';

export default function CollectVoucher() {
    const { promotionId } = useParams<{ promotionId: string }>();
    const navigate = useNavigate();

    const [state, setState] = useState<State>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [voucherCode, setVoucherCode] = useState<string>('');

    useEffect(() => {
        if (!promotionId) {
            setState('error');
            setErrorMessage('Liên kết voucher không hợp lệ.');
            return;
        }

        const collect = async () => {
            try {
                const res = await VouchersService.collect(Number(promotionId));
                // Backend returns { message, voucher } or similar
                setVoucherCode(res?.code || res?.voucher?.code || '');
                setState('success');
            } catch (err: any) {
                const msg = err?.response?.data?.message || 'Không thể lấy voucher. Vui lòng thử lại.';
                setErrorMessage(msg);
                setState('error');
            }
        };

        collect();
    }, [promotionId]);

    return (
        <CustomerLayout activePage="home">
            <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4">
                <div className="w-full max-w-md">

                    {/* ── Loading ── */}
                    {state === 'loading' && (
                        <div className="bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center gap-6 border border-violet-100">
                            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-800">Đang lấy voucher...</h2>
                                <p className="text-slate-500 mt-1 text-sm">Chỉ một giây thôi nhé!</p>
                            </div>
                        </div>
                    )}

                    {/* ── Success ── */}
                    {state === 'success' && (
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
                            {/* Header gradient */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 pt-10 pb-16 text-center relative">
                                <div className="absolute inset-0 opacity-10"
                                    style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-3 drop-shadow-lg" />
                                <h2 className="text-2xl font-black text-white drop-shadow">Lấy voucher thành công! 🎉</h2>
                                <p className="text-emerald-100 mt-1 text-sm">Voucher đã được thêm vào ví của bạn.</p>
                            </div>

                            {/* Ticket cutout */}
                            <div className="relative -mt-8 mx-6">
                                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-gradient-to-br from-violet-50 to-pink-50 rounded-r-full border-r border-emerald-100" />
                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-12 bg-gradient-to-br from-violet-50 to-pink-50 rounded-l-full border-l border-emerald-100" />
                                <div className="bg-white border border-emerald-200 rounded-2xl px-6 py-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TicketPercent className="w-5 h-5 text-emerald-500" />
                                            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Mã voucher</span>
                                        </div>
                                        <div className="border-b-2 border-dashed border-emerald-200 flex-1 mx-3" />
                                        <span className="font-black text-lg text-emerald-700 tracking-wider font-mono">
                                            {voucherCode || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-8 py-8 space-y-3">
                                <Button
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-white shadow-lg shadow-emerald-200"
                                    onClick={() => navigate('/customer/profile?tab=vouchers')}
                                >
                                    <TicketPercent className="w-4 h-4 mr-2" />
                                    Xem Ví Voucher
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-11 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                                    onClick={() => navigate('/customer/home')}
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Tiếp tục mua sắm
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Error ── */}
                    {state === 'error' && (
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-red-100">
                            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-8 pt-10 pb-14 text-center">
                                <AlertCircle className="w-16 h-16 text-white mx-auto mb-3 drop-shadow-lg" />
                                <h2 className="text-2xl font-black text-white drop-shadow">Không thể lấy voucher</h2>
                                <p className="text-red-100 mt-1 text-sm">Vui lòng kiểm tra lại điều kiện.</p>
                            </div>

                            <div className="px-8 py-6">
                                {/* Error detail box */}
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
                                    <p className="text-red-800 text-sm font-medium text-center">{errorMessage}</p>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        className="w-full h-12 bg-slate-900 hover:bg-black font-bold rounded-xl"
                                        onClick={() => navigate('/customer/profile?tab=vouchers')}
                                    >
                                        Xem Ví Voucher của tôi
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full h-11 text-slate-500 hover:text-slate-800 rounded-xl"
                                        onClick={() => navigate('/customer/home')}
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                        Về trang mua sắm
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CustomerLayout>
    );
}
