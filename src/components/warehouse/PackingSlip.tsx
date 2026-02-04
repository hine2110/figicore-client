import React from 'react';
import { format } from 'date-fns';

interface PackingSlipProps {
    order: any;
    trackingCode: string | null;
}

export const PackingSlip: React.FC<PackingSlipProps> = ({ order, trackingCode }) => {
    if (!order) return null;

    return (
        <div className="hidden print:block fixed inset-0 z-[100] bg-white p-8 text-black overflow-y-auto">
            <style type="text/css" media="print">
                {`
                    @page { size: A5; margin: 10mm; }
                    body { visibility: hidden; }
                    .print-content { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }
                `}
            </style>

            <div className="print-content space-y-4">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-4">
                    <h1 className="text-xl font-bold uppercase">Phiếu Kiểm Hàng / Packing List</h1>
                    <p className="text-sm text-gray-500">Figicore Warehouse System</p>
                </div>

                {/* Tracking Code Highlight */}
                <div className="text-center py-4 bg-gray-100 border border-gray-300 rounded mb-4">
                    <p className="text-sm text-gray-600 uppercase">Mã Vận Đơn (GHN)</p>
                    <h2 className="text-3xl font-black tracking-widest mt-1">{trackingCode || "N/A"}</h2>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                        <p className="font-bold text-gray-500">NGƯỜI NHẬN / RECIPIENT</p>
                        <p className="font-bold text-lg">{order.addresses?.recipient_name}</p>
                        <p>{order.addresses?.recipient_phone}</p>
                        <p>{order.addresses?.detail_address}</p>
                        <p>{order.addresses?.ward_code} - {order.addresses?.district_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-500">ĐƠN HÀNG / ORDER</p>
                        <p className="font-bold text-lg">#{order.order_id}</p>
                        <p>{format(new Date(order.created_at || new Date()), "dd/MM/yyyy HH:mm")}</p>
                        <p className="mt-2 font-bold text-gray-500">MÃ ĐƠN GHN</p>
                        <p>{order.order_code}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Sản Phẩm</th>
                            <th className="border border-gray-300 p-2 text-left">Phân Loại / SKU</th>
                            <th className="border border-gray-300 p-2 text-center w-20">SL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.order_items?.map((item: any) => (
                            <tr key={item.order_item_id}>
                                <td className="border border-gray-300 p-2">
                                    {item.product_variants.products.name}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <div className="font-bold">{item.product_variants.sku}</div>
                                    <div className="text-xs text-gray-500">{item.product_variants.option_name}</div>
                                </td>
                                <td className="border border-gray-300 p-2 text-center font-bold text-lg">
                                    {item.quantity}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                    <p>Ngày in: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                    <p>Nhân viên: _____________</p>
                    <p>Kiểm hàng: _____________</p>
                </div>
            </div>
        </div>
    );
};
