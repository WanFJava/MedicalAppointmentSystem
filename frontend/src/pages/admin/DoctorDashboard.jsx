import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getDoctorByUserId } from '../../api/adminApi';
import { getDoctorAppointments } from '../../api/appointmentApi';
import { getPatientProfile } from '../../api/patientApi';
import { CheckCircle, ClipboardList, Calendar, Info, X, Star, FileText } from 'lucide-react';
import ScheduleManager from './ScheduleManager';
import DoctorDiagnoseModal from './DoctorDiagnoseModal';
import FeedbackModal from '../FeedbackModal';
import PatientRecordModal from '../PatientRecordModal';

const DoctorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diagnosingApt, setDiagnosingApt] = useState(null);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);
    const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'schedule'

    const fetchDoctorAndAppointments = useCallback(async () => {
        if (!user || user.role !== 'DOCTOR') return;
        try {
            setLoading(true);
            const docData = await getDoctorByUserId(user.id);
            setDoctor(docData);

            const aptData = await getDoctorAppointments(docData.id);
            setAppointments(aptData);
        } catch (error) {
            console.error("Failed to load doctor dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDoctorAndAppointments();
    }, [fetchDoctorAndAppointments]);

    const handleComplete = (apt) => {
        setDiagnosingApt(apt);
    };

    const handleViewPatient = async (patientId) => {
        try {
            const profile = await getPatientProfile(patientId);
            setViewingPatient(profile);
        } catch (error) {
            console.error("Failed to load patient profile", error);
            alert("Failed to load patient profile data.");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return { bg: '#fef3c7', color: '#d97706' };
            case 'CONFIRMED': return { bg: '#dbeafe', color: '#2563eb' };
            case 'CHECKED_IN': return { bg: '#e0e7ff', color: '#4f46e5' };
            case 'COMPLETED': return { bg: '#d1fae5', color: '#059669' };
            case 'CANCELLED': return { bg: '#fee2e2', color: '#dc2626' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading schedule...</div>;

    if (!doctor) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Doctor profile not found for this user account. Please contact Admin.
            </div>
        );
    }

    const activeAppointments = appointments.filter(a => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(a.status));
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED');
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED');

    const renderTable = (apts, title) => (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <h3 style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} /> {title}
            </h3>
            <table>
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Symptoms</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {apts.map((apt) => {
                        const statusStyle = getStatusStyle(apt.status);
                        return (
                            <tr key={apt.id}>
                                <td style={{ fontWeight: 500 }}>{apt.patientName}</td>
                                <td>
                                    <div>{apt.scheduleDate}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{apt.timeSlot}</div>
                                </td>
                                <td>{apt.symptom}</td>
                                <td>
                                    <span style={{ 
                                        backgroundColor: statusStyle.bg, color: statusStyle.color, 
                                        padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 
                                    }}>
                                        {apt.status}
                                    </span>
                                </td>
                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        className="btn-primary" 
                                        style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#3b82f6' }}
                                        onClick={() => handleViewPatient(apt.patientId)}
                                    >
                                        <Info size={16} /> Info
                                    </button>
                                    {apt.status === 'CHECKED_IN' && (
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#059669' }}
                                            onClick={() => handleComplete(apt)}
                                        >
                                            <CheckCircle size={16} /> Diagnose
                                        </button>
                                    )}
                                    {apt.status === 'COMPLETED' && apt.isReviewed && (
                                        <button 
                                            className="btn-secondary" 
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fef9c3', color: '#854d0e', border: 'none' }}
                                            onClick={() => setFeedbackApt(apt)}
                                            title="View Patient Feedback"
                                        >
                                            <Star size={16} /> Feedback
                                        </button>
                                    )}
                                    {['COMPLETED', 'PAID'].includes(apt.status) && (
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#4f46e5' }}
                                            onClick={() => setViewingRecordApt(apt)}
                                            title="View Medical Record"
                                        >
                                            <FileText size={16} /> Record
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {apts.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No appointments found in this category.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h2>Doctor Dashboard</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Doctor: {doctor.fullName} | {doctor.specialtyName}
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => setActiveTab('appointments')}
                        className={`btn-primary`}
                        style={{ backgroundColor: activeTab === 'appointments' ? 'var(--primary-color)' : 'white', color: activeTab === 'appointments' ? 'white' : 'var(--text-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ClipboardList size={18} /> Appointments
                    </button>
                    <button 
                        onClick={() => setActiveTab('schedule')}
                        className={`btn-primary`}
                        style={{ backgroundColor: activeTab === 'schedule' ? 'var(--primary-color)' : 'white', color: activeTab === 'schedule' ? 'white' : 'var(--text-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Calendar size={18} /> Working Schedule
                    </button>
                </div>
            </div>

            {activeTab === 'appointments' ? (
                <>
                    {renderTable(activeAppointments, "Active Appointments")}
                    {renderTable(completedAppointments, "Completed Appointments")}
                    {cancelledAppointments.length > 0 && renderTable(cancelledAppointments, "Cancelled Appointments")}
                </>
            ) : (
                <ScheduleManager doctorId={doctor.id} />
            )}

            {diagnosingApt && (
                <DoctorDiagnoseModal 
                    appointment={diagnosingApt}
                    doctorId={doctor.id}
                    onClose={() => setDiagnosingApt(null)}
                    onSuccess={() => {
                        setDiagnosingApt(null);
                        fetchDoctorAndAppointments();
                    }}
                />
            )}

            {/* Patient Info Modal */}
            {viewingPatient && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Patient Information</h3>
                            <button className="close-btn" onClick={() => setViewingPatient(null)}><X size={20}/></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                                <strong style={{ color: 'var(--text-secondary)' }}>Full Name:</strong>
                                <span>{viewingPatient.fullName}</span>
                                
                                <strong style={{ color: 'var(--text-secondary)' }}>Gender:</strong>
                                <span>{viewingPatient.gender || 'N/A'}</span>
                                
                                <strong style={{ color: 'var(--text-secondary)' }}>Birthday:</strong>
                                <span>{viewingPatient.birthday || 'N/A'}</span>
                                
                                <strong style={{ color: 'var(--text-secondary)' }}>Phone:</strong>
                                <span>{viewingPatient.phone || 'N/A'}</span>
                                
                                <strong style={{ color: 'var(--text-secondary)' }}>Address:</strong>
                                <span>{viewingPatient.address || 'N/A'}</span>
                                
                                <strong style={{ color: 'var(--text-secondary)' }}>Blood Group:</strong>
                                <span>{viewingPatient.bloodGroup || 'N/A'}</span>
                                
                                <strong style={{ color: 'var(--text-secondary)' }}>Allergies:</strong>
                                <span style={{ color: viewingPatient.allergy ? '#dc2626' : 'inherit' }}>
                                    {viewingPatient.allergy || 'None reported'}
                                </span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setViewingPatient(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackApt && (
                <FeedbackModal 
                    appointment={feedbackApt}
                    isReadOnly={true}
                    onClose={() => setFeedbackApt(null)}
                />
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

export default DoctorDashboard;
