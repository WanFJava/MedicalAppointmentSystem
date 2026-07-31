import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getDoctorByUserId } from '../../api/adminApi';
import { getDoctorAppointments, updateAppointmentStatus } from '../../api/appointmentApi';
import { getPatientProfile } from '../../api/patientApi';
import { CheckCircle, ClipboardList, Calendar, Info, X, Star, FileText, Check, XCircle, UserX, UserCheck, Clock } from 'lucide-react';
import ScheduleManager from './ScheduleManager';
import DoctorDiagnoseModal from './DoctorDiagnoseModal';
import FeedbackModal from '../FeedbackModal';
import PatientRecordModal from '../PatientRecordModal';

const DoctorDashboard = ({ tab = 'appointments' }) => {
    const { user } = useContext(AuthContext);
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diagnosingApt, setDiagnosingApt] = useState(null);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (user && user.role === 'DOCTOR') {
            fetchDoctorAndAppointments();
        }
    }, [user]);

    const fetchDoctorAndAppointments = async () => {
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
    };

    const handleUpdateStatus = async (id, status) => {
        if (window.confirm(`Are you sure you want to mark this as ${status}?`)) {
            try {
                await updateAppointmentStatus(id, status);
                fetchDoctorAndAppointments();
            } catch (error) {
                alert(`Failed to update status: ${error.response?.data || error.message}`);
            }
        }
    };

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
            case 'CANCELLED_BY_PATIENT': return { bg: '#fee2e2', color: '#dc2626' };
            case 'CANCELLED_BY_DOCTOR': return { bg: '#fee2e2', color: '#dc2626' };
            case 'NO_SHOW': return { bg: '#f3f4f6', color: '#6b7280' };
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

    // Filter appointments by selected date first
    const filteredAppointments = appointments.filter(a => a.scheduleDate === filterDate);

    // Then filter by status
    const waitingAppointments = filteredAppointments.filter(a => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(a.status));
    const inProgressAppointments = filteredAppointments.filter(a => a.status === 'IN_PROGRESS');
    const otherAppointments = filteredAppointments.filter(a => !['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status));

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
                                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button 
                                        className="btn-primary" 
                                        style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#3b82f6' }}
                                        onClick={() => handleViewPatient(apt.patientId)}
                                    >
                                        <Info size={16} /> Info
                                    </button>
                                    
                                    {apt.status === 'PENDING' && (
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#dc2626' }}
                                            onClick={() => handleUpdateStatus(apt.id, 'CANCELLED_BY_DOCTOR')}
                                        >
                                            <XCircle size={16} /> Cancel
                                        </button>
                                    )}

                                    {apt.status === 'IN_PROGRESS' && (
                                        <>
                                            <button 
                                                className="btn-primary" 
                                                style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#059669' }}
                                                onClick={() => handleComplete(apt)}
                                            >
                                                <CheckCircle size={16} /> Diagnose
                                            </button>
                                            <button 
                                                className="btn-primary" 
                                                style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#6b7280' }}
                                                onClick={() => handleUpdateStatus(apt.id, 'NO_SHOW')}
                                                title="Đánh dấu bệnh nhân không đến khám"
                                            >
                                                <UserX size={16} /> No Show
                                            </button>
                                        </>
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
            </div>

            {tab === 'appointments' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Xem theo ngày:</label>
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)} 
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
            )}

            {tab === 'appointments' ? (
                <>
                    {renderTable(inProgressAppointments, "In-Progress Patients (IN_PROGRESS)")}
                    {renderTable(waitingAppointments, "Waiting Patients (PENDING / CHECKED_IN / CONFIRMED)")}
                    {renderTable(otherAppointments, "Other Appointments (COMPLETED / CANCELLED)")}
                </>
            ) : (
                <ScheduleManager doctorId={doctor.id} viewTab={tab} />
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
