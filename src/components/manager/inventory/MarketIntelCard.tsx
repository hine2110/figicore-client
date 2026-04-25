import { ExternalLink, Calendar, Tag, Flame, CheckCircle, HelpCircle, Shield, Newspaper, FileQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MarketIntelCardProps {
    item: {
        id: number;
        brand: string;
        product_name: string;
        description?: string;
        category?: string;
        status: string;
        release_date?: string;
        source_url: string;
        source_title?: string;
        confidence: string;
        scanned_at: string;
    };
}

const BRAND_PALETTES: Record<string, { bg: string; text: string; dot: string }> = {
    'Bandai':              { bg: 'bg-red-600',    text: 'text-white', dot: 'bg-red-400' },
    'Moshow':              { bg: 'bg-purple-700', text: 'text-white', dot: 'bg-purple-400' },
    'Pop Mart':            { bg: 'bg-amber-500',  text: 'text-white', dot: 'bg-amber-300' },
    'Good Smile Company':  { bg: 'bg-sky-600',    text: 'text-white', dot: 'bg-sky-300' },
    'Kotobukiya':          { bg: 'bg-emerald-700',text: 'text-white', dot: 'bg-emerald-400' },
    'Hot Toys':            { bg: 'bg-slate-800',  text: 'text-white', dot: 'bg-slate-400' },
    'Aniplex':             { bg: 'bg-violet-700', text: 'text-white', dot: 'bg-violet-400' },
    'MegaHouse':           { bg: 'bg-blue-700',   text: 'text-white', dot: 'bg-blue-400' },
};

const DEFAULT_PALETTE = { bg: 'bg-zinc-700', text: 'text-white', dot: 'bg-zinc-400' };

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
    UPCOMING: {
        label: 'Upcoming',
        icon: <Flame className="w-2.5 h-2.5" />,
        pill: 'bg-orange-500/15 text-orange-600 border-orange-300/40',
    },
    RELEASED: {
        label: 'Released',
        icon: <CheckCircle className="w-2.5 h-2.5" />,
        pill: 'bg-emerald-500/15 text-emerald-600 border-emerald-300/40',
    },
    RUMORED: {
        label: 'Rumored',
        icon: <HelpCircle className="w-2.5 h-2.5" />,
        pill: 'bg-neutral-200/60 text-neutral-500 border-neutral-300/40',
    },
};

const CONFIDENCE_MAP: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    HIGH:   { label: 'Official',    icon: <Shield    className="w-2.5 h-2.5" />, cls: 'bg-emerald-100 text-emerald-700' },
    MEDIUM: { label: 'Media',       icon: <Newspaper className="w-2.5 h-2.5" />, cls: 'bg-blue-100 text-blue-700' },
    LOW:    { label: 'Unverified',  icon: <FileQuestion className="w-2.5 h-2.5" />, cls: 'bg-neutral-100 text-neutral-500' },
};

export function MarketIntelCard({ item }: MarketIntelCardProps) {
    const palette  = BRAND_PALETTES[item.brand] || DEFAULT_PALETTE;
    const status   = STATUS_MAP[item.status]     || STATUS_MAP.UPCOMING;
    const conf     = CONFIDENCE_MAP[item.confidence] || CONFIDENCE_MAP.LOW;
    const initial  = item.brand.charAt(0).toUpperCase();

    return (
        <div className="group flex flex-col h-full bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">

            {/* ── Brand bar ─────────────────────────────── */}
            <div className={cn('flex items-center justify-between px-4 py-3', palette.bg)}>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-xs shrink-0">
                        {initial}
                    </span>
                    <span className={cn('font-black text-xs tracking-wide truncate', palette.text)}>
                        {item.brand}
                    </span>
                </div>
                <Badge className={cn(
                    'flex items-center gap-1 text-[9px] font-black border uppercase tracking-wider shrink-0 ml-2',
                    status.pill
                )}>
                    {status.icon}
                    {status.label}
                </Badge>
            </div>

            {/* ── Body ──────────────────────────────────── */}
            <div className="flex flex-col flex-1 p-4 gap-3">

                {/* Category */}
                {item.category && (
                    <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-neutral-300 shrink-0" />
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                            {item.category}
                        </span>
                    </div>
                )}

                {/* Product name */}
                <h4 className="font-black text-neutral-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.product_name}
                </h4>

                {/* Description */}
                <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-3">
                    {item.description || 'No additional details available.'}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
                    {item.release_date && (
                        <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <Calendar className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                            <span className="text-[10px] font-bold text-neutral-600">{item.release_date}</span>
                        </div>
                    )}
                    <div className={cn('flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider', conf.cls)}>
                        {conf.icon}
                        {conf.label}
                    </div>
                </div>
            </div>

            {/* ── Footer ────────────────────────────────── */}
            <div className="px-4 pb-4">
                <button
                    onClick={() => window.open(item.source_url, '_blank')}
                    className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-neutral-200 text-[10px] font-bold text-neutral-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/60 transition-all"
                >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                        {item.source_title
                            ? item.source_title.length > 36
                                ? item.source_title.substring(0, 36) + '…'
                                : item.source_title
                            : 'View Source'}
                    </span>
                </button>
            </div>
        </div>
    );
}
