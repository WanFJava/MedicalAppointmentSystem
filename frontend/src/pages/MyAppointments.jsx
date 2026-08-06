import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import { getPatientAppointments, updateAppointmentStatus } from '../api/appointmentApi';
import { createComplaint } from '../api/complaintApi';
import { Calendar, Clock, Stethoscope, FileText, Info, MessageSquare, Star, Home, Building, CreditCard, Activity } from 'lucide-react';
import { getBillByAppointment, payBill } from '../api/billApi';
import PatientRecordModal from './PatientRecordModal';
import PatientBillModal from './PatientBillModal';
import ViewBookingModal from './ViewBookingModal';
import FeedbackModal from './FeedbackModal';
import ComplaintViewModal from './ComplaintViewModal';

const MyAppointments = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);
    const [viewingBillApt, setViewingBillApt] = useState(null);
    const [viewingBookingApt, setViewingBookingApt] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [viewingComplaintApt, setViewingComplaintApt] = useState(null);
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

    const handleQuickPay = (apt) => {
        setViewingBillApt(apt);
    };

    const handleCancel = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) {
            try {
                await updateAppointmentStatus(id, 'CANCELLED_BY_PATIENT');
                alert("Hủy lịch hẹn thành công!");
                fetchAppointments();
            } catch (error) {
                console.error("Failed to cancel appointment", error);
                const errMsg = typeof error.response?.data === 'string'
                    ? error.response.data
                    : (error.response?.data?.message || error.message);
                alert("Hủy lịch hẹn thất bại: " + errMsg);
            }
        }
    };

    const handleComplaint = async (apt) => {
        const { value: reason } = await Swal.fire({
            title: 'Gửi phản hồi / khiếu nại',
            input: 'textarea',
            inputLabel: 'Nội dung',
            inputPlaceholder: 'Nhập nội dung phản hồi / khiếu nại của bạn...',
            inputAttributes: {
                'aria-label': 'Nội dung phản hồi'
            },
            showCancelButton: true,
            confirmButtonText: 'Gửi',
            cancelButtonText: 'Hủy'
        });

        if (reason) {
            try {
                await createComplaint(user.id, {
                    appointmentId: apt.id,
                    reason: reason
                });
                Swal.fire('Thành công!', 'Gửi phản hồi/khiếu nại thành công. Chúng tôi sẽ tiếp nhận và xử lý.', 'success');
                fetchAppointments(); // Refresh to update hasComplaint status
            } catch (error) {
                console.error("Failed to submit complaint", error);
                const errMsg = typeof error.response?.data === 'string'
                    ? error.response.data
                    : (error.response?.data?.message || error.message);
                Swal.fire('Lỗi', "Gửi thất bại: " + errMsg, 'error');
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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải lịch hẹn của bạn...</div>;

    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const displayedAppointments = showAll
        ? appointments
        : appointments.filter(apt => apt.scheduleDate >= today);

    return (
        <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Lịch hẹn của tôi</h1>
                {!showAll ? (
                    <button
                        onClick={() => setShowAll(true)}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}
                    >
                        Xem lịch sử hẹn (Tất cả)
                    </button>
                ) : (
                    <button
                        onClick={() => setShowAll(false)}
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Chỉ xem lịch sắp tới
                    </button>
                )}
            </div>

            {appointments.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '3rem', textAlign: 'center', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <Calendar size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '0.5rem' }}>Không tìm thấy lịch hẹn</h3>
                    <p style={{ color: '#6b7280' }}>Bạn chưa đặt lịch hẹn nào.</p>
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
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                                backgroundColor: statusStyle.bg, color: statusStyle.color,
                                                padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block'
                                            }}>
                                                {apt.status}
                                            </span>
                                            {apt.visitType === 'HOME_VISIT' ? (
                                                <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Home size={14}/> Khám tại nhà
                                                </span>
                                            ) : (
                                                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Building size={14}/> Tại phòng khám
                                                </span>
                                            )}
                                            {['COMPLETED', 'PAID'].includes(apt.status) && (
                                                <span style={{
                                                    backgroundColor: apt.paymentStatus === 'PAID' ? '#d1fae5' : '#fee2e2',
                                                    color: apt.paymentStatus === 'PAID' ? '#059669' : '#dc2626',
                                                    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block'
                                                }}>
                                                    {apt.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                </span>
                                            )}
                                        </div>
                                        {apt.note && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#b91c1c', fontWeight: 500 }}>
                                                Ghi chú: {(apt.note === 'V\\u1EAFng b\\u00E1c s\\u0129' || apt.note === 'V?ng bác s?') ? 'Vắng bác sĩ' : apt.note}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div style={{ padding: '1.5rem', flex: '1 1 55%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                <Calendar size={16} /> Ngày khám
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.1rem' }}>{apt.scheduleDate}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                <Clock size={16} /> {apt.visitType === 'HOME_VISIT' ? 'Dự kiến' : 'Giờ khám'}
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '1.1rem' }}>
                                                {apt.visitType === 'HOME_VISIT' ? (apt.expectedTime || 'Chưa chốt') : apt.timeSlot}
                                            </div>
                                        </div>
                                        
                                        {/* Hiển thị phí trực tiếp trên thẻ nếu là Khám tại nhà và đã có phí */}
                                        {apt.visitType === 'HOME_VISIT' && apt.travelFee !== undefined && apt.travelFee !== null && apt.consultationFee !== undefined && apt.consultationFee !== null && (
                                            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569' }}>
                                                    <span>Phí khám:</span>
                                                    <span>{apt.consultationFee.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569' }}>
                                                    <span>Phí di chuyển:</span>
                                                    <span>{apt.travelFee.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                                                    <div style={{ color: '#166534', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                                                        <Activity size={16} /> Tổng tạm tính
                                                    </div>
                                                    <div style={{ fontWeight: 'bold', color: '#14532d', fontSize: '1.1rem' }}>
                                                        {(apt.consultationFee + apt.travelFee).toLocaleString('vi-VN')} đ
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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

                                        {['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED'].includes(apt.status) && (
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

                                        {apt.status === 'COMPLETED' && apt.paymentStatus === 'UNPAID' && (
                                            <button
                                                onClick={() => handleQuickPay(apt)}
                                                style={{
                                                    padding: '0.5rem 1rem', backgroundColor: '#0ea5e9', color: 'white',
                                                    border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
                                            >
                                                <CreditCard size={16} /> Thanh toán
                                            </button>
                                        )}

                                        {['CANCELLED_BY_DOCTOR', 'NO_SHOW_BY_DOCTOR', 'CANCELLED_BY_PATIENT', 'COMPLETED', 'PAID', 'CONFIRMED'].includes(apt.status) && (
                                            !apt.hasComplaint ? (
                                                <button
                                                    onClick={() => handleComplaint(apt)}
                                                    style={{
                                                        padding: '0.5rem 1rem', backgroundColor: '#fef2f2', color: '#ef4444',
                                                        border: '1px solid #fca5a5', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                    title="Gửi phản hồi / khiếu nại"
                                                >
                                                    Phản hồi / Khiếu nại
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setViewingComplaintApt(apt)}
                                                    style={{
                                                        padding: '0.5rem 1rem', backgroundColor: '#eff6ff', color: '#2563eb',
                                                        border: '1px solid #bfdbfe', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                >
                                                    Xem phản hồi / khiếu nại
                                                </button>
                                            )
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

            {viewingBillApt && (
                <PatientBillModal 
                    appointment={viewingBillApt} 
                    onClose={() => {
                        setViewingBillApt(null);
                        fetchAppointments(); // Refresh in case they paid
                    }} 
                />
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

            {viewingComplaintApt && (
                <ComplaintViewModal
                    appointment={viewingComplaintApt}
                    onClose={() => setViewingComplaintApt(null)}
                />
            )}
        </div>
    );
};

export default MyAppointments;
