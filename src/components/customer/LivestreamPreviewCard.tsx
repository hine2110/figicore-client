import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    LiveKitRoom, 
    VideoTrack, 
    useTracks, 
    TrackReference 
} from '@livekit/components-react';
import { Track } from 'livekit-client';

interface LivestreamPreviewCardProps {
    session: {
        id: number;
        title: string;
        description?: string;
        thumbnail_url?: string;
        viewer_count?: number;
        status: string;
    }
}

const PreviewVideoStream = memo(() => {
    const videoTracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: false }],
        { onlySubscribed: true }
    );
    const adminVideoTrack = videoTracks.find(t => t.participant.identity !== "" && t.publication);

    if (!adminVideoTrack) return null;

    return (
        <VideoTrack
            trackRef={adminVideoTrack as TrackReference}
            className="w-full h-full object-cover scale-105"
        />
    );
});

export default function LivestreamPreviewCard({ session }: LivestreamPreviewCardProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL;

    useEffect(() => {
        let mounted = true;
        
        const fetchToken = async () => {
            if (session.status !== 'LIVE') return;
            try {
                // Determine a unique identifier for the preview connection to avoid conflicting with actual user sessions
                const previewUserId = `Preview-${user?.user_id || Math.floor(Math.random() * 10000)}`;
                const tokenRes = await api.get(`/livekit/token`, {
                    params: {
                        room: `LIVE-${session.id}`,
                        username: previewUserId,
                        isHost: 'false'
                    }
                });
                if (mounted) {
                    setLivekitToken(tokenRes.data.token);
                }
            } catch (error) {
                console.error("Failed to fetch preview token", error);
            }
        };

        fetchToken();

        return () => {
            mounted = false;
        };
    }, [session.id, session.status, user]);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/customer/live/${session.id}`)}
            className="group relative bg-[#1A1B23] rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-rose-500/30 transition-all duration-500 shadow-2xl"
        >
            {/* Thumbnail/Preview Container */}
            <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                
                {/* 1. Base Thumbnail (Fallback/Loading) */}
                <img
                    src={session.thumbnail_url || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800"} 
                    alt={session.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${livekitToken ? 'opacity-20 blur-md' : 'opacity-100'}`}
                />
                
                {/* 2. LiveKit Video Feed (Muted) */}
                {livekitToken && (
                    <div className="absolute inset-0 z-0">
                        <LiveKitRoom
                            token={livekitToken}
                            serverUrl={livekitUrl}
                            connect={true}
                            video={false} // Don't publish local video
                            audio={false} // Don't publish local audio
                            className="w-full h-full pointer-events-none"
                        >
                            <PreviewVideoStream />
                        </LiveKitRoom>
                    </div>
                )}
                
                {/* 3. Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-10 pointer-events-none" />
                
                {/* Live Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                    <div className="flex items-center gap-1.5 bg-rose-600 px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(225,29,72,0.4)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Live</span>
                    </div>
                </div>

                {/* Viewer Count */}
                <div className="absolute top-3 right-3 z-20">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white/90">
                        <Eye className="w-3 h-3" />
                        <span className="text-[9px] font-mono font-bold">{session.viewer_count || 0}</span>
                    </div>
                </div>

                {/* Center Play Icon on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform shadow-[0_0_20px_rgba(225,29,72,0.5)]">
                        <Play className="w-5 h-5 fill-current ml-1" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-2 relative z-20 bg-[#1A1B23]">
                <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-rose-400 transition-colors">
                    {session.title}
                </h3>
                <p className="text-neutral-500 text-[11px] line-clamp-2 leading-relaxed h-[2rem]">
                    {session.description || "Join our live session for exclusive deals and special figures!"}
                </p>
                
                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2 text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">
                        <span className="w-1 h-1 rounded-full bg-rose-500" />
                        Broadcast Active
                    </div>
                    <button className="text-[9px] font-black text-white/40 uppercase hover:text-white transition-colors">
                        Enter Room
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
