import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/lib/axiosInstance';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function StationConfirmPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token || !action) {
            setStatus('error');
            setMessage('Invalid verification link. Token or action is missing.');
        } else {
            // Initial state: ready to confirm
            setMessage(
                action === 'approve'
                    ? "Do you want to APPROVE and Activate this station?"
                    : "Do you want to DENY and Remove this station request?"
            );
        }
    }, [token, action]);

    const handleConfirm = async () => {
        if (!token || !action) return;

        setStatus('loading');
        try {
            const response = await axiosInstance.get(`/check-in/confirm-station`, {
                params: { token, action }
            });

            setStatus('success');
            if (action === 'approve') {
                setMessage(`Success! Station "${response.data.station_name}" has been approved.`);
            } else {
                setMessage('The station registration request has been denied and removed.');
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to verify station.');
        } finally {
            // If success, we stay in success state. If error, we stay in error state.
            // Loading state is cleared by setting status above.
        }
    };

    const isApprove = action === 'approve';

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 px-4">
            <Card className="w-full max-w-md shadow-lg border-neutral-200">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        {status === 'idle' && <AlertTriangle className="w-12 h-12 text-yellow-500" />}
                        {status === 'loading' && <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />}
                        {status === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
                        {status === 'error' && <XCircle className="w-12 h-12 text-red-500" />}
                    </div>
                    <CardTitle className="text-xl">
                        {status === 'idle' && 'Confirmation Required'}
                        {status === 'loading' && 'Processing...'}
                        {status === 'success' && 'Operation Successful'}
                        {status === 'error' && 'Verification Failed'}
                    </CardTitle>
                    {message && <p className="text-center text-sm text-neutral-600 mt-2">{message}</p>}
                </CardHeader>
                <CardFooter className="flex flex-col gap-3 justify-center pt-2">
                    {status === 'idle' && token && action && (
                        <Button
                            className={`w-full ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            onClick={handleConfirm}
                        >
                            {isApprove ? 'Yes, Approve Station' : 'Yes, Deny Request'}
                        </Button>
                    )}

                    {(status === 'success' || status === 'error') && (
                        <Button variant="outline" onClick={() => navigate('/manager/shifts')}>
                            Return to Schedule
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div >
    );
}
