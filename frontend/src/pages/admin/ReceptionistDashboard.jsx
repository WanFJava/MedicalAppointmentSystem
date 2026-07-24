import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from '../../api/appointmentApi';
import { CheckCircle, XCircle, UserCheck, Trash2 } from 'lucide-react';
import BillModal from './BillModal';

const ReceptionistDashboard = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingApt, setBillingApt] = useState(null);

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
            case 'PAID': return { bg: '#fce7f3', color: '#be185d' };
            case 'CANCELLED': return { bg: '#fee2e2', color: '#dc2626' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Receptionist Dashboard</h2>
                <div style={{ color: 'var(--text-secondary)' }}>Welcome, {user?.fullName}</div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Date & Time</th>
                            <th>Symptoms</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map((apt) => {
                            const statusStyle = getStatusStyle(apt.status);
                            return (
                                <tr key={apt.id}>
                                    <td style={{ fontWeight: 500 }}>{apt.patientName}</td>
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
                                                                handleUpdateStatus(apt.id, 'CANCELLED');
                                                            }
                                                        }}
                                                        style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {apt.status === 'CONFIRMED' && (
                                                <button 
                                                    title="Check In Patient"
                                                    onClick={() => handleUpdateStatus(apt.id, 'CHECKED_IN')}
                                                    style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                    <UserCheck size={16} /> Check In
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
                                            {/* Note: DOCTOR will change status to COMPLETED */}
                                            {user?.role === 'ADMIN' && (
                                                <button 
                                                    title="Delete Appointment Permanently"
                                                    onClick={() => handleDelete(apt.id)}
                                                    style={{ padding: '0.5rem', backgroundColor: '#fca5a5', color: '#991b1b', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', marginLeft: '0.5rem' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {appointments.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No appointments found.</td>
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
        </div>
    );
};

export default ReceptionistDashboard;
