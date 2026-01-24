
import { User } from '@/types/auth.types';
import MembershipCard from '@/components/customer/MembershipCard';

interface MembershipTabProps {
    user: User | null;
}

export default function MembershipTab({ user }: MembershipTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h3 className="text-lg font-medium text-neutral-900">Membership Program</h3>
                <p className="text-sm text-neutral-500">View your tier progress and exclusive benefits.</p>
            </div>
            <MembershipCard user={user} />
        </div>
    );
}
