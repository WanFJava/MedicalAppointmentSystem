import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from '../../api/appointmentApi';
import { CheckCircle, XCircle, UserCheck, Trash2, Star, Home, Building, AlertTriangle } from 'lucide-react';
import BillModal from './BillModal';
import FeedbackModal from '../FeedbackModal';
import ChangeDoctorModal from './ChangeDoctorModal';
import AdminBookingModal from './AdminBookingModal';
import { Plus } from 'lucide-react';

const ReceptionistDashboard = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingApt, setBillingApt] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [changeDoctorApt, setChangeDoctorApt] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAllAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateAppointmentStatus(id, status);
            fetchAppointments();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to completely delete this appointment? This action cannot be undone.")) {
            try {
                await deleteAppointment(id);
                fetchAppointments();
            } catch (error) {
                alert("Failed to delete appointment");
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
            case 'NO_SHOW_BY_DOCTOR': return { bg: '#fee2e2', color: '#dc2626' };
            case 'NO_SHOW': return { bg: '#f3f4f6', color: '#6b7280' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

    const filteredAppointments = filterDate
        ? appointments.filter(apt => apt.scheduleDate === filterDate)
        : appointments;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Quản lý Lịch hẹn</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>Welcome, {user?.fullName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <button 
                        className="btn-primary" 
                        onClick={() => setShowBookingModal(true)} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', padding: '0.5rem 1rem' }}
                    >
                        <Plus size={16} /> Đặt lịch hộ
                    </button>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Xem lịch ngày:</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                    <button
                        onClick={() => setFilterDate('')}
                        style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        title="Xem tất cả ngày"
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Type</th>
                            <th>Doctor</th>
                            <th>Date & Time</th>
                            <th>Symptoms</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppointments.map((apt) => {
                            const statusStyle = getStatusStyle(apt.status);
                            return (
                                <tr key={apt.id}>
                                    <td style={{ fontWeight: 500 }}>{apt.patientName}</td>
                                    <td>
                                        {apt.visitType === 'HOME_VISIT' ? (
                                            <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><Home size={14}/> Tại nhà</span>
                                        ) : (
                                            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><Building size={14}/> Tại TT</span>
                                        )}
                                    </td>
                                    <td>{apt.doctorName}</td>
                                    <td>
                                        <div>{apt.scheduleDate}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{apt.timeSlot}</div>
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {apt.symptom}
                                    </td>
                                    <td>
                                        <span style={{
                                            backgroundColor: statusStyle.bg, color: statusStyle.color,
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            {apt.status}
                                        </span>
                                        {apt.note && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                                Ghi chú: {(apt.note === 'V\\u1EAFng b\\u00E1c s\\u0129' || apt.note === 'V?ng bác s?') ? 'Vắng bác sĩ' : apt.note}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {['COMPLETED', 'PAID'].includes(apt.status) ? (
                                            <span style={{
                                                backgroundColor: apt.paymentStatus === 'PAID' ? '#d1fae5' : '#fee2e2',
                                                color: apt.paymentStatus === 'PAID' ? '#059669' : '#dc2626',
                                                padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600
                                            }}>
                                                {apt.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {apt.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        title="Confirm Appointment"
                                                        onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                                        style={{ padding: '0.5rem', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        title="Cancel Appointment"
                                                        onClick={() => {
                                                            if (window.confirm("Are you sure you want to cancel this appointment?")) {
                                                                handleUpdateStatus(apt.id, 'CANCELLED_BY_DOCTOR');
                                                            }
                                                        }}
                                                        style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {apt.status === 'CONFIRMED' && apt.visitType !== 'HOME_VISIT' && (
                                                <button
                                                    title="Check In Patient"
                                                    onClick={() => handleUpdateStatus(apt.id, 'CHECKED_IN')}
                                                    style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                    <UserCheck size={16} /> Check In
                                                </button>
                                            )}
                                            {['CONFIRMED', 'CHECKED_IN'].includes(apt.status) && apt.visitType !== 'HOME_VISIT' && (
                                                <button
                                                    title="Đánh vắng bác sĩ"
                                                    onClick={() => {
                                                        if (window.confirm("Bác sĩ không khám bệnh nhân này? Lịch hẹn sẽ bị hủy với lý do Bác sĩ vắng.")) {
                                                            handleUpdateStatus(apt.id, 'NO_SHOW_BY_DOCTOR');
                                                        }
                                                    }}
                                                    style={{ padding: '0.5rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <AlertTriangle size={16} /> BS vắng
                                                </button>
                                            )}
                                            {apt.status === 'COMPLETED' && (
                                                <button
                                                    title="Generate Invoice / Confirm Payment"
                                                    onClick={() => setBillingApt(apt)}
                                                    style={{ padding: '0.5rem', backgroundColor: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    Bill & Pay
                                                </button>
                                            )}
                                            {apt.status === 'COMPLETED' && apt.isReviewed && (
                                                <button
                                                    title="View Patient Feedback"
                                                    onClick={() => setFeedbackApt(apt)}
                                                    style={{ padding: '0.5rem', backgroundColor: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                    <Star size={16} />
                                                </button>
                                            )}
                                            {/* Note: DOCTOR will change status to COMPLETED */}
                                            {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                                                <>
                                                    {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && apt.visitType !== 'HOME_VISIT' && (
                                                        <button
                                                            title="Change Doctor / Schedule"
                                                            onClick={() => setChangeDoctorApt(apt)}
                                                            style={{ padding: '0.5rem', backgroundColor: '#f3e8ff', color: '#7e22ce', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', marginLeft: '0.5rem' }}>
                                                            <UserCheck size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredAppointments.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No appointments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {billingApt && (
                <BillModal
                    appointment={billingApt}
                    onClose={() => setBillingApt(null)}
                    onSuccess={() => {
                        setBillingApt(null);
                        fetchAppointments();
                    }}
                />
            )}

            {feedbackApt && (
                <FeedbackModal
                    appointment={feedbackApt}
                    isReadOnly={true}
                    onClose={() => setFeedbackApt(null)}
                />
            )}

            {changeDoctorApt && (
                <ChangeDoctorModal
                    appointment={changeDoctorApt}
                    onClose={() => setChangeDoctorApt(null)}
                    onSuccess={() => {
                        setChangeDoctorApt(null);
                        fetchAppointments();
                    }}
                />
            )}

            {showBookingModal && (
                <AdminBookingModal
                    onClose={() => setShowBookingModal(false)}
                    onSuccess={() => {
                        setShowBookingModal(false);
                        fetchAppointments();
                    }}
                />
            )}
        </div>
    );
};

export default ReceptionistDashboard;
