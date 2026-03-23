import { useEffect, useState } from 'react';

interface TimeLeft {
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

function calcTimeLeft(endTime: string): TimeLeft {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
        hours: Math.floor(diff / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
        expired: false,
    };
}

const Segment = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
        <div className="bg-black/30 backdrop-blur-xs rounded-lg px-2.5 py-1.5 min-w-[3rem] text-center shadow-inner border border-white/10">
            <span className="text-white font-extrabold text-2xl tabular-nums leading-none tracking-tight drop-shadow">
                {String(value).padStart(2, '0')}
            </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 mt-1">{label}</span>
    </div>
);

const Colon = () => (
    <span className="text-white/70 font-black text-xl pb-4 select-none">:</span>
);

/**
 * CountdownTimer — optimised, client-only, no hydration mismatch.
 * Uses a stable 1-second interval. All heavy DOM work happens inside
 * individual Segment components so parent components needn't re-render.
 */
export default function CountdownTimer({ endTime }: { endTime: string }) {
    // Defer first render to client so SSR-output matches initial client paint
    const [isMounted, setIsMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(endTime));

    useEffect(() => {
        setIsMounted(true);
        setTimeLeft(calcTimeLeft(endTime));

        const id = setInterval(() => {
            const next = calcTimeLeft(endTime);
            setTimeLeft(next);
            if (next.expired) clearInterval(id);
        }, 1_000);

        return () => clearInterval(id);
    }, [endTime]);

    if (!isMounted) {
        return <div className="h-12 w-36 rounded-lg bg-black/20 animate-pulse" />;
    }

    if (timeLeft.expired) {
        return (
            <div className="bg-black/20 rounded-lg px-4 py-2 text-white/60 text-sm font-semibold uppercase tracking-widest">
                Sale Ended
            </div>
        );
    }

    return (
        <div className="flex items-end gap-1.5">
            <Segment value={timeLeft.hours} label="HR" />
            <Colon />
            <Segment value={timeLeft.minutes} label="MIN" />
            <Colon />
            <Segment value={timeLeft.seconds} label="SEC" />
        </div>
    );
}
