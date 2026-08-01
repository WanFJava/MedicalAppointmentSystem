import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Search, Star } from 'lucide-react';
import { getAllFeedbacks } from '../../api/feedbackApi';

const FeedbackManager = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [rating, setRating] = useState('ALL');

    useEffect(() => {
        const loadFeedbacks = async () => {
            try {
                setLoading(true);
                setFeedbacks(await getAllFeedbacks());
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Failed to load feedbacks.');
            } finally {
                setLoading(false);
            }
        };
        loadFeedbacks();
    }, []);

    const filteredFeedbacks = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return feedbacks.filter((feedback) => {
            const matchesRating = rating === 'ALL' || feedback.rating === Number(rating);
            const searchableText = [
                feedback.patientName,
                feedback.doctorName,
                feedback.comment,
                feedback.appointmentId
            ].join(' ').toLocaleLowerCase();
            return matchesRating && searchableText.includes(normalizedQuery);
        });
    }, [feedbacks, query, rating]);

    const averageRating = feedbacks.length
        ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length
        : 0;

    if (loading) {
        return <div>Loading feedbacks...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Patient Feedbacks</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Monitor feedback from every completed appointment.
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: '#fef3c7', color: '#92400e',
                    padding: '0.75rem 1rem', borderRadius: '0.75rem', fontWeight: 700
                }}>
                    <Star size={18} fill="currentColor" />
                    {averageRating.toFixed(1)} / 5 ({feedbacks.length})
                </div>
            </div>

            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#94a3b8' }}
                    />
                    <input
                        aria-label="Search feedbacks"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search patient, doctor, comment or appointment ID"
                        style={{
                            width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                            border: '1px solid var(--border-color)', borderRadius: '0.5rem'
                        }}
                    />
                </div>
                <select
                    aria-label="Filter by rating"
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                    style={{ padding: '0.65rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                >
                    <option value="ALL">All ratings</option>
                    {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{value} stars</option>
                    ))}
                </select>
            </div>

            {error && (
                <div style={{ color: '#b91c1c', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '0.5rem' }}>
                    {error}
                </div>
            )}

            {!error && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Appointment</th>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFeedbacks.map((feedback) => (
                                <tr key={feedback.id}>
                                    <td>#{feedback.appointmentId}</td>
                                    <td style={{ fontWeight: 600 }}>{feedback.patientName}</td>
                                    <td>{feedback.doctorName}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.15rem', color: '#f59e0b' }}>
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <Star
                                                    key={value}
                                                    size={16}
                                                    fill={value <= feedback.rating ? 'currentColor' : 'none'}
                                                    color={value <= feedback.rating ? '#f59e0b' : '#cbd5e1'}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '360px', whiteSpace: 'normal' }}>
                                        {feedback.comment || <span style={{ color: '#94a3b8' }}>No comment</span>}
                                    </td>
                                    <td>
                                        {feedback.createdAt
                                            ? new Date(feedback.createdAt).toLocaleString()
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            {filteredFeedbacks.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                        <MessageSquare size={32} style={{ margin: '0 auto 0.75rem' }} />
                                        No feedbacks match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeedbackManager;
