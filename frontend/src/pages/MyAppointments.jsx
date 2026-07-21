import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPatientAppointments, updateAppointmentStatus } from '../api/appointmentApi';
import { Calendar, Clock, Stethoscope, FileText } from 'lucide-react';
import PatientRecordModal from './PatientRecordModal';

const MyAppointments = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);

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
                await updateAppointmentStatus(id, 'CANCELLED');
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
            case 'PAID': return { bg: '#fce7f3', color: '#be185d' };
            case 'CANCELLED': return { bg: '#fee2e2', color: '#dc2626' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your appointments...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>My Appointments</h1>
            
            {appointments.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '3rem', textAlign: 'center', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <Calendar size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '0.5rem' }}>No Appointments Found</h3>
                    <p style={{ color: '#6b7280' }}>You haven't booked any appointments yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {appointments.map(apt => {
                        const statusStyle = getStatusStyle(apt.status);
                        return (
                            <div key={apt.id} style={{ 
                                backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', 
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                            <Calendar size={14} /> Date
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{apt.scheduleDate}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                            <Clock size={14} /> Time
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{apt.timeSlot}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                            <Stethoscope size={14} /> Doctor
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{apt.doctorName}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</div>
                                        <span style={{ 
                                            backgroundColor: statusStyle.bg, color: statusStyle.color, 
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 
                                        }}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                                
                                {apt.status === 'PENDING' && (
                                    <button 
                                        onClick={() => handleCancel(apt.id)}
                                        style={{ 
                                            padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', 
                                            border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' 
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                                {['COMPLETED', 'PAID'].includes(apt.status) && (
                                    <button 
                                        onClick={() => setViewingRecordApt(apt)}
                                        style={{ 
                                            padding: '0.5rem 1rem', backgroundColor: '#e0e7ff', color: '#4f46e5', 
                                            border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <FileText size={16} /> View Record
                                    </button>
                                )}
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
        </div>
    );
};

export default MyAppointments;
