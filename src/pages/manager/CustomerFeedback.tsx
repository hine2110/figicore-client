import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const REVIEWS = [
    { id: 1, user: 'John D.', rating: 5, date: '2 days ago', title: 'Amazing Quality!', comment: 'The blind box packaging was perfect and the figure is exquisite. Will buy again!', verified: true },
    { id: 2, user: 'Emily R.', rating: 4, date: '1 week ago', title: 'Good but slow shipping', comment: 'Loved the item but it took 5 days to arrive instead of 3.', verified: true },
    { id: 3, user: 'Anon', rating: 1, date: '2 weeks ago', title: 'Damaged Box', comment: 'Box was crushed. Collecting requires pristine condition.', verified: true },
];

export default function CustomerFeedback() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-neutral-900">Customer Feedback</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-neutral-200 md:col-span-1 h-fit">
                    <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-neutral-900 mb-2">4.8</div>
                        <div className="flex justify-center gap-1 text-yellow-400 mb-2">
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                            <Star className="w-5 h-5 fill-current" />
                        </div>
                        <div className="text-sm text-neutral-500">Based on 1,240 reviews</div>
                    </div>

                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-neutral-500">{star}</span>
                                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: star === 5 ? '80%' : star === 4 ? '15%' : '2%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="md:col-span-3 space-y-4">
                    {REVIEWS.map(review => (
                        <Card key={review.id} className="p-6 border-neutral-200">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-neutral-900">{review.user}</div>
                                    {review.verified && <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">Verified Purchase</Badge>}
                                </div>
                                <div className="text-sm text-neutral-400">{review.date}</div>
                            </div>
                            <div className="flex text-yellow-400 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-neutral-200'}`} />
                                ))}
                            </div>
                            <h3 className="font-bold text-neutral-900 mb-1">{review.title}</h3>
                            <p className="text-neutral-600 text-sm mb-4">{review.comment}</p>
                            <div className="flex items-center gap-4 border-t border-neutral-100 pt-3">
                                <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
                                    <MessageSquare className="w-3 h-3" /> Reply
                                </button>
                                <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
                                    <ThumbsUp className="w-3 h-3" /> Helpful
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
