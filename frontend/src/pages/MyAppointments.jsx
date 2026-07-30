import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPatientAppointments, updateAppointmentStatus } from '../api/appointmentApi';
import { Calendar, Clock, Stethoscope, FileText, Info, MessageSquare, Star } from 'lucide-react';
import PatientRecordModal from './PatientRecordModal';
import ViewBookingModal from './ViewBookingModal';
import FeedbackModal from './FeedbackModal';

const MyAppointments = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);
    const [viewingBookingApt, setViewingBookingApt] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (user) {
            fetchAppointments();
        }
    }, [user]);

    const fetchAppointments = async () => {
        try {
            const data = await getPatientAppointments(user.id);
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await updateAppointmentStatus(id, 'CANCELLED_BY_PATIENT');
                fetchAppointments();
            } catch (error) {
                alert("Failed to cancel appointment");
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return { bg: '#fef3c7', color: '#d97706' };
            case 'CONFIRMED': return { bg: '#dbeafe', color: '#2563eb' };
            case 'CHECKED_IN': return { bg: '#e0e7ff', color: '#4f46e5' };
            case 'COMPLETED': return { bg: '#d1fae5', color: '#059669' };
            case 'CANCELLED_BY_PATIENT': return { bg: '#fee2e2', color: '#dc2626' };
            case 'CANCELLED_BY_DOCTOR': return { bg: '#fee2e2', color: '#dc2626' };
            case 'NO_SHOW': return { bg: '#f3f4f6', color: '#6b7280' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your appointments...</div>;

    const displayedAppointments = showAll ? appointments : appointments.slice(0, 1);

    return (
        <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>My Appointments</h1>
                {appointments.length > 1 && !showAll && (
                    <button 
                        onClick={() => setShowAll(true)}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}
                    >
                        View All Appointment History
                    </button>
                )}
                {showAll && (
                    <button 
                        onClick={() => setShowAll(false)}
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Show Latest Only
                    </button>
                )}
            </div>
            
            {appointments.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '3rem', textAlign: 'center', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <Calendar size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '0.5rem' }}>No Appointments Found</h3>
                    <p style={{ color: '#6b7280' }}>You haven't booked any appointments yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {displayedAppointments.map(apt => {
                        const statusStyle = getStatusStyle(apt.status);
                        return (
                            <div key={apt.id} style={{ 
                                backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden',
                                boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                                display: 'flex', flexDirection: 'row', alignItems: 'stretch'
                            }}>
                                {/* LEFT COLUMN */}
                                <div style={{ padding: '1.5rem', flex: '1 1 45%', display: 'flex', gap: '1.5rem', borderRight: '1px solid #e2e8f0', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                        <div style={{ 
                                            width: '80px', height: '80px', borderRadius: '50%', 
                                            backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            border: '1px solid #e2e8f0', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '1.5rem', fontWeight: 'bold'
                                        }}>
                                            {apt.doctorName?.charAt(0)}
                                        </div>
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0ea5e9', margin: '0 0 0.5rem 0' }}>
                                            {apt.doctorName}
                                        </h3>
                                        <div style={{ fontSize: '0.9rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                            <Stethoscope size={16} /> Bác sĩ
                                        </div>
                                        <span style={{ 
                                            backgroundColor: statusStyle.bg, color: statusStyle.color, 
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block'
                                        }}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* RIGHT COLUMN */}
                                <div style={{ padding: '1.5rem', flex: '1 1 55%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                <Calendar size={16} /> Ngày khám
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.1rem' }}>{apt.scheduleDate}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                <Clock size={16} /> Giờ khám
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.1rem' }}>{apt.timeSlot}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                                        <button 
                                            onClick={() => setViewingBookingApt(apt)}
                                            style={{ 
                                                padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', 
                                                border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        >
                                            <Info size={16} /> Chi tiết
                                        </button>

                                        {apt.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleCancel(apt.id)}
                                                style={{ 
                                                    padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', 
                                                    border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                            >
                                                Hủy lịch
                                            </button>
                                        )}
                                        
                                        {['COMPLETED', 'PAID'].includes(apt.status) && (
                                            <button 
                                                onClick={() => setViewingRecordApt(apt)}
                                                style={{ 
                                                    padding: '0.5rem 1rem', backgroundColor: '#e0e7ff', color: '#4f46e5', 
                                                    border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                }}
                                            >
                                                <FileText size={16} /> Bệnh án
                                            </button>
                                        )}

                                        {['COMPLETED', 'PAID'].includes(apt.status) && (
                                            <button 
                                                onClick={() => setFeedbackApt(apt)}
                                                style={{ 
                                                    padding: '0.5rem 1rem', 
                                                    backgroundColor: apt.isReviewed ? '#f3f4f6' : '#fef9c3', 
                                                    color: apt.isReviewed ? '#6b7280' : '#854d0e', 
                                                    border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                }}
                                            >
                                                {apt.isReviewed ? <><Star size={16} /> Xem đánh giá</> : <><MessageSquare size={16} /> Viết đánh giá</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewingRecordApt && (
                <PatientRecordModal 
                    appointment={viewingRecordApt} 
                    onClose={() => setViewingRecordApt(null)} 
                />
            )}

            {viewingBookingApt && (
                <ViewBookingModal 
                    appointment={viewingBookingApt} 
                    onClose={() => setViewingBookingApt(null)} 
                />
            )}

            {feedbackApt && (
                <FeedbackModal 
                    appointment={feedbackApt}
                    isReadOnly={feedbackApt.isReviewed}
                    onClose={() => setFeedbackApt(null)}
                    onFeedbackSubmitted={() => {
                        fetchAppointments(); // refresh to show "View Feedback"
                    }}
                />
            )}
        </div>
    );
};

export default MyAppointments;
