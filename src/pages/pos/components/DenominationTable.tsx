import { useState } from 'react';
import { Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DENOMINATIONS = [
    { value: 500000, label: '500.000' },
    { value: 200000, label: '200.000' },
    { value: 100000, label: '100.000' },
    { value: 50000, label: '50.000' },
    { value: 20000, label: '20.000' },
    { value: 10000, label: '10.000' },
    { value: 5000, label: '5.000' },
    { value: 2000, label: '2.000' },
    { value: 1000, label: '1.000' },
];

interface DenominationTableProps {
    onChange: (total: number, breakdown: Record<number, number>) => void;
}

export default function DenominationTable({ onChange }: DenominationTableProps) {
    const [counts, setCounts] = useState<Record<number, string>>(
        DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.value]: '' }), {})
    );

    const handleCountChange = (value: number, countStr: string) => {
        const newCounts = { ...counts, [value]: countStr };
        setCounts(newCounts);

        // Calculate total and breakdown
        let total = 0;
        const breakdown: Record<number, number> = {};

        Object.entries(newCounts).forEach(([val, count]) => {
            const c = parseInt(count) || 0;
            const denominationValue = parseInt(val);
            total += c * denominationValue;
            if (c > 0) breakdown[denominationValue] = c;
        });

        onChange(total, breakdown);
    };

    return (
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                        <th className="px-4 py-2 font-bold text-neutral-500 uppercase text-[10px] tracking-wider">Mệnh giá (VND)</th>
                        <th className="px-4 py-2 font-bold text-neutral-500 uppercase text-[10px] tracking-wider w-24 text-center">Số lượng</th>
                        <th className="px-4 py-2 font-bold text-neutral-500 uppercase text-[10px] tracking-wider text-right">Thành tiền</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                    {DENOMINATIONS.map((d) => {
                        const count = parseInt(counts[d.value]) || 0;
                        const subtotal = count * d.value;

                        return (
                            <tr key={d.value} className="hover:bg-neutral-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-neutral-700">
                                    <div className="flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-indigo-400 opacity-60" />
                                        {d.label}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        className="h-8 text-center bg-transparent border-neutral-200 focus:border-indigo-500 font-mono text-xs"
                                        value={counts[d.value]}
                                        onChange={(e) => handleCountChange(d.value, e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-neutral-900">
                                    {subtotal > 0 ? subtotal.toLocaleString('vi-VN') : '0'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
