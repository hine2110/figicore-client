import { GuestLayout } from '@/layouts/GuestLayout';
import { motion } from 'framer-motion';
import { 
    Gavel, 
    ShieldCheck, 
    PackageSearch, 
    FileWarning, 
    Wallet, 
    RotateCcw, 
    Smartphone,
    Scale
} from 'lucide-react';

export default function Terms() {
    const sections = [
        {
            icon: Smartphone,
            title: '1. Account & Data Regulations',
            content: [
                'Unique Identity: Each customer account must be linked to a unique Email and Phone Number. Duplicate data is not permitted.',
                'Password Security: Minimum 8 characters, including at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.',
                'OTP Limits: A single phone number/email cannot receive more than 3 OTP codes within a 15-minute window to prevent spam.'
            ]
        },
        {
            icon: PackageSearch,
            title: '2. Special Purchase Mechanisms',
            content: [
                'Blind Box: When purchasing Blind Box products, the system will not display specific variants. Variants are randomly determined upon unboxing.',
                'Auctions: Bids must be equal to or greater than "Current Highest Bid + Minimum Increment". Confirmed bids cannot be cancelled.',
                'Pre-order: Customers must pay a Deposit immediately upon ordering. Orders without a deposit will be automatically cancelled after 30 minutes.'
            ]
        },
        {
            icon: FileWarning,
            title: '3. Cancellation & Inventory Policies',
            content: [
                'Cancellation Conditions: Customers can only cancel orders if both conditions are met: The order was created less than 12 hours ago and the status is not yet "Packed".',
                'Quantity Limits: FigiCore reserves the right to limit the maximum quantity of products per order for limited editions or rare Blind Boxes.',
                'Stock Management: Inventory is deducted immediately upon Online order confirmation or successful POS payment.'
            ]
        },
        {
            icon: ShieldCheck,
            title: '4. Operations & Evidence Requirements',
            content: [
                'Packing Protocol: All orders require a mandatory Packing Video by warehouse staff before the status is updated to "Shipped".',
                'Unboxing Requirement: To protect your rights during disputes, customers must record an Unboxing Video as primary evidence for any defects or missing items.'
            ]
        },
        {
            icon: Wallet,
            title: '5. Payment & Digital Wallet',
            content: [
                'Closed-Loop Wallet: Internal wallet funds can only be used for purchases within the FigiCore platform.',
                'Withdrawal Policy: For legal and security reasons, the system does not support withdrawing funds from the internal wallet to personal bank accounts.'
            ]
        },
        {
            icon: RotateCcw,
            title: '6. Returns & Disputes',
            content: [
                'Timeframe: Return requests must be submitted within 7 days of receiving the package.',
                'Approval Process: Requests are reviewed through a 2-layer process (Management and Warehouse) based on the provided video evidence.'
            ]
        },
        {
            icon: Scale,
            title: '7. Penalties & Enforcement',
            content: [
                'Auction Defaults: If an auction winner fails to pay the balance within 24 hours, the result is cancelled and the deposit is forfeited.',
                'Account Suspensions: Administrators reserve the right to ban accounts for fraudulent activities or serious violations of community rules.'
            ]
        }
    ];

    return (
        <GuestLayout activePage="terms">
            <div className="min-h-screen bg-[#F2F2F7] relative overflow-hidden font-sans">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] ambient-glow-blue rounded-full animate-breathe" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] ambient-glow-purple rounded-full animate-breathe" />
                </div>

                <div className="container mx-auto px-4 relative z-10 pt-16 pb-24 max-w-4xl space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center justify-center p-3 bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm mb-4"
                        >
                            <Gavel className="w-8 h-8 text-slate-900" />
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">Terms of Service</h1>
                        <p className="text-slate-500 font-medium tracking-wide border-y border-slate-200 py-4 max-w-lg mx-auto uppercase text-xs">
                            Last Updated: April 17, 2026
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-8">
                        {sections.map((section, idx) => (
                            <motion.section
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-slate-900 rounded-xl">
                                        <section.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                                </div>
                                <ul className="space-y-4">
                                    {section.content.map((item, i) => (
                                        <li key={i} className="flex gap-4 text-slate-600 leading-relaxed font-medium">
                                            <span className="text-slate-900 font-bold">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.section>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center text-white space-y-4 shadow-xl">
                        <h3 className="text-xl font-bold">Have questions about our terms?</h3>
                        <p className="text-slate-400 font-light max-w-md mx-auto">
                            Our support team is always here to help you understand our internal processes and community guidelines.
                        </p>
                        <button className="mt-4 px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-colors">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
