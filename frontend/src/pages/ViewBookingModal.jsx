import React from 'react';
import { X, Calendar, Clock, Stethoscope, User, FileText, Activity } from 'lucide-react';

const ViewBookingModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '600px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
            }}>
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                        Booking Information
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#64748b', padding: '0.25rem'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Stethoscope size={16} /> Doctor
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.doctorName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <User size={16} /> Patient
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.patientName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Calendar size={16} /> Date
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.scheduleDate}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Clock size={16} /> Time Slot
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.timeSlot}</div>
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Activity size={16} /> Status
                        </div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.status}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FileText size={16} /> Reason for Visit / Symptoms
                        </div>
                        <div style={{ 
                            backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', 
                            color: '#334155', minHeight: '60px', border: '1px solid #e2e8f0'
                        }}>
                            {appointment.symptom || 'No symptoms provided.'}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.25rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                    <button 
                        onClick={onClose}
                        style={{ 
                            padding: '0.5rem 1.25rem', backgroundColor: '#3b82f6', color: 'white', 
                            border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer' 
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewBookingModal;
