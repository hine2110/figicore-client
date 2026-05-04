import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2, Camera } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageUploadModal } from './ImageUploadModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface Message {
    role: 'user' | 'model';
    parts: string;
    timestamp: string;
}

interface ChatSession {
    id: string;
    date: string;
    messages: Message[];
}

interface ChatStorage {
    activeSession: Message[];
    archives: ChatSession[];
}

export const AIChatBox: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [view, setView] = useState<'chat' | 'history'>('chat');
    const [selectedArchive, setSelectedArchive] = useState<ChatSession | null>(null);

    // Create a unique key per user
    const storageKey = `figicore_chat_data_${user?.user_id || 'guest'}`;

    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [archives, setArchives] = useState<ChatSession[]>([]);

    const [isTyping, setIsTyping] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            // Add a small delay to ensure DOM is ready and animation has started
            setTimeout(scrollToBottom, 150);
        }
    }, [chatHistory, archives, isTyping, isOpen, view, selectedArchive]);

    // Initial load and switching user + Auto Archive logic
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        let activeMsgs: Message[] = [];
        let archivedSessions: ChatSession[] = [];

        if (saved) {
            const data: ChatStorage = JSON.parse(saved);
            activeMsgs = data.activeSession || [];
            archivedSessions = data.archives || [];

            // AUTO ARCHIVE LOGIC: If the last message was NOT from today, archive it
            if (activeMsgs.length > 1) { // 1 is just the welcome msg
                const lastMsg = activeMsgs[activeMsgs.length - 1];
                const lastDate = new Date(lastMsg.timestamp).toLocaleDateString();
                const today = new Date().toLocaleDateString();

                if (lastDate !== today) {
                    const newArchive: ChatSession = {
                        id: `session_${Date.now()}`,
                        date: lastDate,
                        messages: [...activeMsgs]
                    };
                    archivedSessions = [newArchive, ...archivedSessions].slice(0, 10); // Keep last 10
                    activeMsgs = []; // Reset for new day
                }
            }
        }

        if (activeMsgs.length === 0) {
            activeMsgs = [
                {
                    role: 'model',
                    parts: 'Xin chào! Mình là FigiCore Specialist ✨. Mình có thể giúp gì cho bạn về mô hình và đồ chơi sưu tầm hôm nay?',
                    timestamp: new Date().toISOString(),
                },
            ];
        }

        setChatHistory(activeMsgs);
        setArchives(archivedSessions);
    }, [user?.user_id, storageKey]);

    // Save data to user-specific localStorage
    useEffect(() => {
        if (chatHistory.length > 0) {
            const data: ChatStorage = {
                activeSession: chatHistory,
                archives: archives
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    }, [chatHistory, archives, storageKey]);

    const quickActionsRef = useRef<HTMLDivElement>(null);

    // Handle horizontal scroll with mouse wheel
    useEffect(() => {
        const el = quickActionsRef.current;
        if (el) {
            const onWheel = (e: WheelEvent) => {
                if (e.deltaY === 0) return;
                e.preventDefault();
                el.scrollTo({
                    left: el.scrollLeft + e.deltaY,
                    behavior: 'smooth'
                });
            };
            el.addEventListener('wheel', onWheel);
            return () => el.removeEventListener('wheel', onWheel);
        }
    }, []);

    useEffect(() => {
        const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.figicore.com';
        
        // Robust URL parsing for production (api.figicore.com)
        let socketOrigin = 'https://api.figicore.com';
        try {
            const url = new URL(rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`);
            socketOrigin = url.origin;
        } catch (e) {
            console.error("[Socket] URL parsing failed, using fallback:", e);
        }

        console.log(`[Socket] Connecting to origin: ${socketOrigin}, namespace: /chat`);
        const socket = io(`${socketOrigin}/chat`, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('receive_message', (msg: { text: string; role: 'model'; timestamp: string }) => {
            setChatHistory((prev) => [...prev, { role: 'model', parts: msg.text, timestamp: msg.timestamp }]);
            setIsTyping(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [chatHistory, isTyping]);

    const handleSendMessage = () => {
        if (!message.trim() || !socketRef.current) return;

        const userMsg: Message = {
            role: 'user',
            parts: message,
            timestamp: new Date().toISOString(),
        };

        setChatHistory((prev) => [...prev, userMsg]);
        setIsTyping(true);

        socketRef.current.emit('send_message', {
            message: message,
            history: chatHistory.map(h => ({ role: h.role, parts: h.parts })),
        });

        setMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg flex items-center justify-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <MessageCircle className="w-6 h-6 z-10" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9, transformOrigin: 'bottom right' }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="w-[380px] h-[550px] bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-white/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 leading-none">FigiCore AI Specialist</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện không?')) {
                                            const initialMsg: Message = {
                                                role: 'model',
                                                parts: 'Xin chào! Mình là FigiCore Specialist ✨. Mình có thể giúp gì cho bạn về mô hình và đồ chơi sưu tầm hôm nay?',
                                                timestamp: new Date().toISOString(),
                                            };
                                            setChatHistory([initialMsg]);
                                            setArchives([]);
                                            localStorage.removeItem(storageKey);
                                        }
                                    }}
                                    className="w-8 h-8 rounded-full hover:bg-red-100/50 group"
                                    title="Xóa tất cả dữ liệu"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (view === 'history') {
                                            setView('chat');
                                            setSelectedArchive(null);
                                        } else {
                                            setView('history');
                                        }
                                    }}
                                    className={`w-8 h-8 rounded-full ${view === 'history' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-indigo-100/50'}`}
                                    title="Lịch sử chat"
                                >
                                    <Bot className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-200/50">
                                    <X className="w-4 h-4 text-gray-500" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea ref={scrollRef} className="flex-1 p-4">
                            {view === 'history' && !selectedArchive ? (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lịch sử trò chuyện cũ</h4>
                                    {archives.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 text-sm">
                                            Chưa có phiên hội thoại cũ nào được lưu. ✨
                                        </div>
                                    ) : (
                                        archives.map((session) => (
                                            <button
                                                key={session.id}
                                                onClick={() => setSelectedArchive(session)}
                                                className="w-full p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-indigo-600">Phiên {session.date}</span>
                                                    <span className="text-[10px] text-gray-400">{session.messages.length} tin nhắn</span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-1 italic">
                                                    "{session.messages.find(m => m.role === 'user')?.parts || 'Không có tin nhắn người dùng'}"
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {view === 'history' && selectedArchive && (
                                        <div className="flex items-center gap-2 mb-6 p-2 rounded-2xl bg-indigo-50 border border-indigo-100">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-[10px] font-bold"
                                                onClick={() => setSelectedArchive(null)}
                                            >
                                                ← QUAY LẠI
                                            </Button>
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Đang xem lại ngày {selectedArchive.date}</span>
                                        </div>
                                    )}
                                    {(selectedArchive ? selectedArchive.messages : chatHistory).map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ scale: 0.95, opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                            animate={{ scale: 1, opacity: 1, x: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                                </div>
                                                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                    : 'bg-white/50 backdrop-blur-md border border-white/50 text-gray-700 rounded-tl-none prose prose-sm max-w-none'
                                                    }`}>
                                                    {msg.role === 'user' ? (
                                                        <div className="whitespace-pre-wrap">{msg.parts}</div>
                                                    ) : (
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                 p: ({ node, children, ...props }) => {
                                                                     const childrenArray = React.Children.toArray(children);
                                                                     const hasImage = childrenArray.some((child: any) => 
                                                                         child.type === 'img' || (child.props && child.props.node?.tagName === 'img')
                                                                     );

                                                                     if (hasImage) {
                                                                         // Find the image and the rest of content
                                                                         const img = childrenArray.find((child: any) => 
                                                                             child.type === 'img' || (child.props && child.props.node?.tagName === 'img')
                                                                         );
                                                                         const rest = childrenArray.filter(child => child !== img);

                                                                         return (
                                                                             <div className="flex gap-3 items-start w-full py-1" {...props}>
                                                                                 {img}
                                                                                 <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                                                     {rest}
                                                                                 </div>
                                                                             </div>
                                                                         );
                                                                     }

                                                                     return (
                                                                         <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
                                                                             {children}
                                                                         </p>
                                                                     );
                                                                 },
                                                                 ul: ({ node, ...props }) => <ul className="list-none m-0 p-0 space-y-3 mb-4 last:mb-0" {...props} />,
                                                                 ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                                 li: ({ node, children, ...props }) => {
                                                                     return (
                                                                         <li 
                                                                             className="group/item pb-3 border-b border-indigo-50/50 last:border-0 last:pb-0 list-none" 
                                                                             {...props}
                                                                         >
                                                                             {children}
                                                                         </li>
                                                                     );
                                                                 },
                                                                strong: ({ node, ...props }) => <strong className="font-bold text-indigo-900" {...props} />,
                                                                a: ({ node, ...props }) => {
                                                                    const href = props.href || '';
                                                                    const isInternal = href.startsWith('/');
                                                                    return (
                                                                        <a
                                                                            {...props}
                                                                            className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors cursor-pointer"
                                                                            onClick={(e) => {
                                                                                if (isInternal) {
                                                                                    e.preventDefault();
                                                                                    setIsOpen(false);
                                                                                    navigate(href);
                                                                                }
                                                                            }}
                                                                            target={isInternal ? undefined : '_blank'}
                                                                            rel={isInternal ? undefined : 'noopener noreferrer'}
                                                                        />
                                                                    );
                                                                },
                                                                 img: ({ node, ...props }) => (
                                                                     <div className="shrink-0">
                                                                         <img
                                                                             {...props}
                                                                             className="w-16 h-16 object-cover rounded-xl border border-indigo-100 shadow-sm transition-all duration-300 group-hover/item:shadow-md group-hover/item:scale-105"
                                                                             alt={props.alt || 'Product'}
                                                                         />
                                                                     </div>
                                                                 ),
                                                            }}
                                                        >
                                                            {msg.parts}
                                                        </ReactMarkdown>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isTyping && view === 'chat' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-white/50 backdrop-blur-md border border-white/50 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Quick Actions */}
                        <div
                            ref={quickActionsRef}
                            className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent cursor-grab active:cursor-grabbing select-none"
                        >
                            <style>{`
                                .scrollbar-thin::-webkit-scrollbar {
                                    height: 4px;
                                }
                                .scrollbar-thin::-webkit-scrollbar-thumb {
                                    background: rgba(0,0,0,0.1);
                                    border-radius: 10px;
                                }
                                .scrollbar-thin::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                            `}</style>
                            {[
                                { icon: '🎁', text: 'Blindbox là gì?' },
                                { icon: '🔥', text: 'Cho mình xem sản phẩm mới nhất' },
                                { icon: '💰', text: 'Sản phẩm giá rẻ nhất có gì?' },
                                { icon: '📦', text: 'Cách đặt hàng như thế nào?' },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setMessage(action.text);
                                        // Auto send after a short delay to let user see the text filled
                                        setTimeout(() => {
                                            const btn = document.getElementById('chat-send-button');
                                            btn?.click();
                                        }, 100);
                                    }}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white border border-white/50 text-[11px] font-medium text-gray-600 shadow-sm transition-all hover:scale-105 active:scale-95"
                                >
                                    <span>{action.icon}</span>
                                    {action.text}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <AnimatePresence>
                            {view === 'chat' && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-xl"
                                >
                                    <div className="relative">
                                        <Input
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Nhập câu hỏi của bạn..."
                                            className="pl-12 pr-12 h-12 bg-white/50 border-white/40 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                        <Button
                                            onClick={() => setIsImageModalOpen(true)}
                                            className="absolute left-1.5 top-1.5 w-9 h-9 p-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 shadow-sm transition-all active:scale-95"
                                            title="Tìm kiếm bằng hình ảnh"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            id="chat-send-button"
                                            onClick={handleSendMessage}
                                            disabled={!message.trim() || isTyping}
                                            className="absolute right-1.5 top-1.5 w-9 h-9 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-center text-gray-400 mt-3 font-medium uppercase tracking-tighter">Powered by FigiCore AI & Groq</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
            <ImageUploadModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />
        </div>
    );
};
