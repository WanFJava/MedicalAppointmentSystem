import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { createFeedback, getFeedbackByAppointment } from '../api/feedbackApi';

const FeedbackModal = ({ appointment, isReadOnly, onClose, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(isReadOnly);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isReadOnly && appointment) {
            fetchExistingFeedback();
        }
    }, [isReadOnly, appointment]);

    const fetchExistingFeedback = async () => {
        try {
            setLoading(true);
            const data = await getFeedbackByAppointment(appointment.id);
            if (data) {
                setRating(data.rating);
                setComment(data.comment);
            } else {
                setError("Không tìm thấy đánh giá.");
            }
        } catch (err) {
            setError("Tải đánh giá thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Vui lòng chọn mức đánh giá.");
            return;
        }

        try {
            setLoading(true);
            await createFeedback({
                appointmentId: appointment.id,
                doctorId: appointment.doctorId,
                patientId: appointment.patientId,
                rating,
                comment
            });
            onFeedbackSubmitted();
            onClose();
        } catch (err) {
            setError("Gửi đánh giá thất bại. Vui lòng thử lại.");
            setLoading(false);
        }
    };

    if (!appointment) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '500px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
            }}>
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                        {isReadOnly ? 'Đánh giá của Bệnh nhân' : 'Gửi Đánh giá'}
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#64748b', padding: '0.25rem'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {loading && isReadOnly ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Đang tải đánh giá...</div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {error && <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</div>}

                            {!isReadOnly && (
                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    Trải nghiệm của bạn với <strong>{appointment.doctorName}</strong> vào ngày {appointment.scheduleDate} như thế nào?
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                    Đánh giá
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => !isReadOnly && setHoverRating(star)}
                                            onMouseLeave={() => !isReadOnly && setHoverRating(0)}
                                            style={{
                                                background: 'none', border: 'none', padding: 0, cursor: isReadOnly ? 'default' : 'pointer',
                                                color: star <= (hoverRating || rating) ? '#fbbf24' : '#e2e8f0',
                                                transition: 'color 0.2s'
                                            }}
                                        >
                                            <Star size={32} fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                    Bình luận
                                </label>
                                <textarea
                                    disabled={isReadOnly}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isReadOnly ? '' : "Cho chúng tôi biết về trải nghiệm của bạn..."}
                                    style={{
                                        width: '100%', minHeight: '100px', padding: '0.75rem',
                                        borderRadius: '0.5rem', border: '1px solid #cbd5e1',
                                        backgroundColor: isReadOnly ? '#f8fafc' : 'white',
                                        color: '#334155', resize: 'vertical'
                                    }}
                                />
                            </div>

                            {!isReadOnly && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        style={{
                                            padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569',
                                            border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer'
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            padding: '0.5rem 1.5rem', backgroundColor: '#3b82f6', color: 'white',
                                            border: 'none', borderRadius: '0.5rem', fontWeight: 500,
                                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        {loading ? 'Đang gửi...' : 'Gửi Đánh giá'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
