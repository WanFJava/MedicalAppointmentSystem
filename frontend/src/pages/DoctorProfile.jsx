import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctorById } from '../api/adminApi';
import { getAvailableSchedules } from '../api/appointmentApi';
import { getFeedbacksByDoctor } from '../api/feedbackApi';
import { AuthContext } from '../context/AuthContext';
import { Star, Clock, MapPin, Activity, Stethoscope, Calendar as CalendarIcon, MessageSquare, Heart } from 'lucide-react';

const DoctorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [schedulesByDate, setSchedulesByDate] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const doc = await getDoctorById(id);
                setDoctor(doc);

                // Fetch schedules
                const schedules = await getAvailableSchedules(id);
                const grouped = schedules.reduce((acc, curr) => {
                    if (!acc[curr.date]) acc[curr.date] = [];
                    acc[curr.date].push(curr);
                    return acc;
                }, {});
                
                setSchedulesByDate(grouped);
                const dates = Object.keys(grouped).sort();
                if (dates.length > 0) {
                    setSelectedDate(dates[0]);
                }

                // Fetch feedbacks
                const fbs = await getFeedbacksByDoctor(id);
                setFeedbacks(fbs.slice(0, 10)); // Top 10 recent

            } catch (error) {
                console.error("Error fetching doctor details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [id]);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#6b7280' }}>Loading doctor details...</div>;
    }

    if (!doctor) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>Doctor not found</h2>
                <button className="btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        if (Array.isArray(timeStr)) {
            return `${timeStr[0].toString().padStart(2, '0')}:${timeStr[1].toString().padStart(2, '0')}`;
        }
        return timeStr.substring(0, 5);
    };

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '3rem 1rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                <button 
                    onClick={() => {
                        if (window.history.state && window.history.state.idx > 0) {
                            navigate(-1);
                        } else {
                            navigate('/');
                        }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
                >
                    ← Back
                </button>

                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'row', position: 'relative', marginBottom: '2rem' }}>
                    
                    {/* LEFT COLUMN: Doctor Info */}
                    <div style={{ padding: '2rem', flex: '1 1 45%', display: 'flex', gap: '1.5rem', borderRight: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                                {doctor.avatar ? (
                                    <img src={doctor.avatar} alt={doctor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '3rem', color: '#9ca3af', fontWeight: 'bold' }}>{doctor.fullName?.charAt(0)}</span>
                                )}
                            </div>
                            
                            {user && user.role === 'PATIENT' && doctor && (
                                <button 
                                    onClick={() => toggleFavorite(doctor.id)}
                                    style={{
                                        background: favoriteDoctorIds?.has(doctor.id) ? '#fbbf24' : 'transparent', 
                                        border: `1px solid ${favoriteDoctorIds?.has(doctor.id) ? '#fbbf24' : '#d1d5db'}`, 
                                        borderRadius: '1rem',
                                        padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        color: favoriteDoctorIds?.has(doctor.id) ? 'white' : '#6b7280', 
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        fontSize: '0.85rem', fontWeight: '600'
                                    }}
                                >
                                    <Heart size={16} fill={favoriteDoctorIds?.has(doctor.id) ? 'white' : 'none'} color={favoriteDoctorIds?.has(doctor.id) ? 'white' : '#9ca3af'} />
                                    Yêu thích
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0ea5e9', margin: '0 0 0.5rem 0' }}>
                                {doctor.degree ? `${doctor.degree} ` : ''}{doctor.fullName}
                            </h1>
                            <div style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                                Bác sĩ có {doctor.experience} năm kinh nghiệm
                            </div>
                            <div style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                Chuyên khoa: {doctor.specialtyName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Star size={18} color="#d97706" fill="#d97706" />
                                <span style={{ color: '#92400e', fontWeight: '600', fontSize: '1rem' }}>{doctor.averageRating?.toFixed(1) || '0.0'} Rating</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Schedule & Clinic Info */}
                    <div style={{ padding: '2rem', flex: '1 1 55%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#4b5563', fontSize: '1rem', textTransform: 'uppercase' }}>
                                    <CalendarIcon size={18} /> Lịch khám
                                </div>
                                <input 
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedSchedule(null);
                                    }}
                                    style={{
                                        padding: '0.4rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #d1d5db',
                                        fontSize: '0.9rem', color: '#374151', cursor: 'pointer', outline: 'none'
                                    }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {Object.keys(schedulesByDate).length === 0 ? (
                                    <div style={{ color: '#ef4444', fontSize: '0.95rem' }}>Bác sĩ hiện chưa có lịch khám.</div>
                                ) : (!selectedDate || !schedulesByDate[selectedDate]) ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>Không có lịch vào ngày này. Vui lòng chọn ngày khác.</div>
                                ) : (
                                    schedulesByDate[selectedDate].map(sched => (
                                        <button key={sched.id} 
                                            onClick={() => setSelectedSchedule(sched)}
                                            style={{ 
                                                padding: '0.5rem 1rem', 
                                                backgroundColor: selectedSchedule?.id === sched.id ? '#0ea5e9' : '#f1f5f9', 
                                                border: 'none',
                                                color: selectedSchedule?.id === sched.id ? 'white' : '#334155', 
                                                borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' 
                                            }}>
                                            {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                                        </button>
                                    ))
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                Chọn một khung giờ và nhấn nút đặt lịch bên dưới
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                            <div>
                                <span style={{ fontWeight: '600', color: '#4b5563' }}>GIÁ KHÁM: </span>
                                <span style={{ fontWeight: '600', color: '#1f2937' }}>{doctor.consultationFee?.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>

                        <button 
                            style={{ 
                                width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '0.5rem', 
                                backgroundColor: !selectedSchedule ? '#cbd5e1' : '#0ea5e9',
                                color: 'white', fontWeight: '600', border: 'none',
                                transition: 'background-color 0.2s',
                                cursor: !selectedSchedule ? 'not-allowed' : 'pointer',
                                marginTop: 'auto'
                            }}
                            disabled={!selectedSchedule}
                            onClick={() => {
                                if (user) {
                                    navigate('/book', { state: { preselectDoctor: doctor.id, selectedDate, selectedSchedule } });
                                } else {
                                    navigate('/login');
                                }
                            }}
                        >
                            {selectedSchedule ? 'Đặt Lịch Khám' : 'Vui lòng chọn khung giờ'}
                        </button>
                    </div>
                </div>

                {doctor.biography && (
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', textAlign: 'left', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Giới thiệu về Bác sĩ</h3>
                        <p style={{ color: '#4b5563', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>{doctor.biography}</p>
                    </div>
                )}

                    {/* FEEDBACKS SECTION */}
                    <div style={{ marginTop: '3rem', backgroundColor: 'white', padding: '2.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <MessageSquare size={28} color="#4f46e5" /> 
                            Recent Patient Feedbacks ({feedbacks.length})
                        </h3>

                        {feedbacks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                No feedbacks available for this doctor yet.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                                {feedbacks.map(fb => (
                                    <div key={fb.id} style={{ 
                                        backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', 
                                        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' 
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{fb.patientName}</div>
                                                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                    {new Date(fb.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star 
                                                        key={star} 
                                                        size={16} 
                                                        fill={star <= fb.rating ? '#fbbf24' : 'none'} 
                                                        color={star <= fb.rating ? '#fbbf24' : '#cbd5e1'} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
                                            "{fb.comment}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
};

export default DoctorProfile;
