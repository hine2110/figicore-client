import { GuestLayout } from '@/layouts/GuestLayout';
import { motion } from 'framer-motion';
import { 
    Lock, 
    Eye, 
    UserCheck, 
    Server, 
    Bell,
    Settings,
    Shield
} from 'lucide-react';

export default function Privacy() {
    const sections = [
        {
            icon: Lock,
            title: 'Data Collection',
            desc: 'We only collect essential information required for unique identification (Email, Phone Number) and order fulfillment. FigiCore ensures no unauthorized data collection.'
        },
        {
            icon: Eye,
            title: 'Information Usage',
            desc: 'Your data is used to personalize your shopping experience, manage auction participants, process loyalty points, and send order status notifications.'
        },
        {
            icon: Shield,
            title: 'Account Security',
            desc: 'We apply strict security standards, including a 3-OTP limit per 15 minutes, encrypted sessions, and complex password requirements to prevent unauthorized access.'
        },
        {
            icon: UserCheck,
            title: 'User Rights',
            desc: 'You have the right to modify your Avatar, Display Name, and Password. Sensitive identity information like Legal Name and DOB requires admin approval for changes.'
        },
        {
            icon: Server,
            title: 'Data Storage',
            desc: 'Your information is securely stored on FigiCore’s local and cloud servers, accessible only by authorized administrative personnel.'
        }
    ];

    return (
        <GuestLayout activePage="privacy">
             <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden font-sans">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-blue-400 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-purple-400 blur-[120px] rounded-full" />
                </div>

                <div className="container mx-auto px-4 pt-20 pb-24 relative z-10 max-w-4xl">
                    {/* Hero */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20 space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">
                            <Lock className="w-3 h-3" /> Data & Privacy
                        </div>
                        <h1 className="text-5xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
                        <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
                            Respecting your privacy and protecting your personal data is our primary priority across all FigiCore operations.
                        </p>
                    </motion.div>

                    {/* Timeline-like info */}
                    <div className="space-y-12">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex flex-col md:flex-row gap-8 items-start md:items-center group"
                            >
                                <div className="flex-shrink-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                    <section.icon className="w-7 h-7" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900">{section.title}</h3>
                                    <p className="text-slate-500 text-lg leading-relaxed font-light">{section.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Security Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-24 p-12 bg-white border border-slate-100 rounded-[3rem] shadow-xl text-center space-y-6"
                    >
                        <Shield className="w-16 h-16 text-blue-600 mx-auto" />
                        <h3 className="text-2xl font-bold text-slate-900">FigiCore Security Protocol</h3>
                        <p className="text-slate-500 max-w-lg mx-auto font-medium lead-relaxed">
                            We utilize advanced encryption technologies to protect all transactions and identity details across the entire platform.
                        </p>
                        <div className="flex justify-center gap-4 pt-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                <Settings className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                <Bell className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-slate-400" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </GuestLayout>
    );
}
