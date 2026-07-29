import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctorById } from '../api/adminApi';
import { getAvailableSchedules } from '../api/appointmentApi';
import { getFeedbacksByDoctor } from '../api/feedbackApi';
import { AuthContext } from '../context/AuthContext';
import { Star, Clock, MapPin, Activity, Stethoscope, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';

const DoctorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

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

                <div style={{ backgroundColor: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: 'linear-gradient(to right, #4f46e5, #3b82f6)', height: '150px' }}></div>
                    
                    <div style={{ padding: '0 2rem 2rem 2rem', display: 'flex', flexDirection: 'row', gap: '3rem', alignItems: 'flex-start', marginTop: '-60px' }}>
                        
                        {/* LEFT COLUMN: Doctor Info */}
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '5px solid white', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                {doctor.avatar ? (
                                    <img src={doctor.avatar} alt={doctor.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '3rem', fontWeight: 'bold' }}>
                                        {doctor.fullName?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '1.5rem', width: '100%' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1f2937', marginBottom: '0.5rem' }}>
                                    {doctor.fullName}
                                </h1>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef3c7', padding: '0.25rem 1rem', borderRadius: '2rem' }}>
                                        <Star size={18} color="#d97706" fill="#d97706" />
                                        <span style={{ color: '#92400e', fontWeight: '700', fontSize: '1rem' }}>{doctor.averageRating?.toFixed(1) || '0.0'} Rating</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.125rem', color: '#6b7280', fontWeight: '500', marginBottom: '1.5rem' }}>
                                    {doctor.degree}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: '600', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                                    <Stethoscope size={20} />
                                    <span>{doctor.specialtyName}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e0e7ff', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                                        <Clock size={20} color="#4f46e5" />
                                        <span style={{ color: '#3730a3', fontWeight: '600', fontSize: '1rem' }}>{doctor.experience} Years Exp</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#d1fae5', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                                        <Activity size={20} color="#059669" />
                                        <span style={{ color: '#065f46', fontWeight: '600', fontSize: '1rem' }}>Fee: ${doctor.consultationFee}</span>
                                    </div>
                                </div>
                                
                                {doctor.biography && (
                                    <div style={{ backgroundColor: '#f9fafb', padding: '2rem', borderRadius: '0.75rem', textAlign: 'left', marginBottom: '2.5rem', border: '1px solid #f3f4f6' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>About Dr. {doctor.fullName}</h3>
                                        <p style={{ color: '#4b5563', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{doctor.biography}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Booking & Schedule */}
                        <div style={{ flex: '1', width: '100%', marginTop: '60px' }}>

                            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', textAlign: 'left', marginBottom: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CalendarIcon size={24} color="#4f46e5" /> Working Schedule
                                </h3>
                                
                                {Object.keys(schedulesByDate).length === 0 ? (
                                    <p style={{ color: '#ef4444' }}>This doctor currently has no available schedules.</p>
                                ) : (
                                    <div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>Select Date</label>
                                            <input 
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => {
                                                    setSelectedDate(e.target.value);
                                                    setSelectedSchedule(null);
                                                }}
                                                style={{
                                                    padding: '0.75rem', 
                                                    borderRadius: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    width: '100%',
                                                    maxWidth: '300px',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            {selectedDate && !schedulesByDate[selectedDate] && (
                                                <p style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                                    No time slots available on this date. Please select another date.
                                                </p>
                                            )}
                                        </div>

                                        {selectedDate && schedulesByDate[selectedDate] && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4b5563' }}>Available Time Slots</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                    {schedulesByDate[selectedDate].map(sched => (
                                                        <button key={sched.id} 
                                                            onClick={() => setSelectedSchedule(sched)}
                                                            style={{ 
                                                                padding: '0.75rem 1.5rem', 
                                                                backgroundColor: selectedSchedule?.id === sched.id ? '#4f46e5' : '#f0fdf4', 
                                                                border: `1px solid ${selectedSchedule?.id === sched.id ? '#4f46e5' : '#bbf7d0'}`, 
                                                                color: selectedSchedule?.id === sched.id ? 'white' : '#166534', 
                                                                borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' 
                                                            }}>
                                                            {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                                <button 
                                    className="btn-primary" 
                                    style={{ 
                                        width: '100%', padding: '1.25rem', fontSize: '1.125rem', borderRadius: '0.75rem', 
                                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)',
                                        opacity: !selectedSchedule ? 0.5 : 1,
                                        cursor: !selectedSchedule ? 'not-allowed' : 'pointer'
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
                                    {selectedSchedule ? 'Book Appointment Now' : 'Select a Time Slot to Book'}
                                </button>
                            </div>
                        </div>
                    </div>

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
