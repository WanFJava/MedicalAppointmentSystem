import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getDoctorByUserId } from '../../api/adminApi';
import { getDoctorAppointments, updateAppointmentStatus } from '../../api/appointmentApi';
import { getPatientProfile } from '../../api/patientApi';
import { CheckCircle, ClipboardList, Info, X, Star, FileText, XCircle, UserX, Home, Building, MapPin, ArrowLeft } from 'lucide-react';
import DoctorDiagnoseModal from './DoctorDiagnoseModal';
import FeedbackModal from '../FeedbackModal';
import PatientRecordModal from '../PatientRecordModal';
import Swal from 'sweetalert2';

const ScheduleAppointmentsPage = () => {
    const { user } = useContext(AuthContext);
    const { scheduleId } = useParams();
    const navigate = useNavigate();
    
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diagnosingApt, setDiagnosingApt] = useState(null);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);

    useEffect(() => {
        if (user && user.role === 'DOCTOR') {
            fetchDoctorAndAppointments();
        }
    }, [user, scheduleId]);

    const fetchDoctorAndAppointments = async () => {
        try {
            setLoading(true);
            const docData = await getDoctorByUserId(user.id);
            setDoctor(docData);

            const aptData = await getDoctorAppointments(docData.id);
            // Lọc danh sách lịch hẹn theo scheduleId
            const filteredApt = aptData.filter(a => String(a.scheduleId) === String(scheduleId));
            setAppointments(filteredApt);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        let actionText = '';
        if (status === 'CANCELLED_BY_DOCTOR') actionText = 'hủy lịch khám này';
        else if (status === 'NO_SHOW') actionText = 'đánh dấu bệnh nhân không đến khám';
        else if (status === 'DECLINED') actionText = 'từ chối lịch khám này';

        if (actionText) {
            const result = await Swal.fire({
                title: 'Xác nhận',
                text: `Bạn có chắc chắn muốn ${actionText}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Đóng',
                confirmButtonColor: '#dc2626'
            });
            if (!result.isConfirmed) return;
        }

        try {
            await updateAppointmentStatus(id, status);
            fetchDoctorAndAppointments();
            if (actionText) {
                Swal.fire('Thành công', 'Đã cập nhật trạng thái thành công', 'success');
            }
        } catch (error) {
            Swal.fire('Lỗi', `Cập nhật trạng thái thất bại: ${error.response?.data?.message || error.response?.data || error.message}`, 'error');
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
            case 'PENDING_CONFIRMATION': return { bg: '#fef3c7', color: '#d97706' };
            case 'CONFIRMED': return { bg: '#dbeafe', color: '#2563eb' };
            case 'ON_THE_WAY': return { bg: '#ede9fe', color: '#8b5cf6' };
            case 'ARRIVED': return { bg: '#e0e7ff', color: '#4338ca' };
            case 'CHECKED_IN': return { bg: '#e0e7ff', color: '#4f46e5' };
            case 'COMPLETED': return { bg: '#d1fae5', color: '#059669' };
            case 'CANCELLED_BY_PATIENT': return { bg: '#fee2e2', color: '#dc2626' };
            case 'CANCELLED_BY_DOCTOR': return { bg: '#fee2e2', color: '#dc2626' };
            case 'NO_SHOW_BY_DOCTOR': return { bg: '#fee2e2', color: '#dc2626' };
            case 'DECLINED': return { bg: '#fee2e2', color: '#dc2626' };
            case 'NO_SHOW': return { bg: '#f3f4f6', color: '#6b7280' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Đang tải lịch hẹn...</div>;

    if (!doctor) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Không tìm thấy hồ sơ bác sĩ cho tài khoản này. Vui lòng liên hệ Quản trị viên.
            </div>
        );
    }



    const renderTable = (apts, title) => (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
            <h3 style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} /> {title}
            </h3>
            <table>
                <thead>
                    <tr>
                        <th>Bệnh nhân</th>
                        <th>Loại hình</th>
                        <th>Ngày & Giờ</th>
                        <th>Triệu chứng</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {apts.map((apt) => {
                        const statusStyle = getStatusStyle(apt.status);
                        return (
                            <tr key={apt.id}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{apt.patientName}</div>
                                    {apt.visitType === 'HOME_VISIT' && apt.homeAddress && (
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={12}/> {apt.homeAddress}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {apt.visitType === 'HOME_VISIT' ? (
                                        <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><Home size={14}/> Tại nhà</span>
                                    ) : (
                                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><Building size={14}/> Tại TT</span>
                                    )}
                                </td>
                                <td>
                                    <div>{apt.scheduleDate}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ca: {apt.timeSlot}</div>
                                    {apt.visitType === 'HOME_VISIT' && (
                                        <>
                                            <div style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: 600, marginTop: '0.25rem' }}>
                                                Dự kiến: {apt.expectedTime || 'Chưa chốt'}
                                            </div>
                                            {apt.travelFee > 0 && (
                                                <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>
                                                    + Phí di chuyển: {apt.travelFee.toLocaleString('vi-VN')}đ
                                                </div>
                                            )}
                                        </>
                                    )}
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
                                        <Info size={16} /> Thông tin
                                    </button>

                                    {apt.status === 'PENDING' && (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#dc2626' }}
                                            onClick={() => handleUpdateStatus(apt.id, 'CANCELLED_BY_DOCTOR')}
                                        >
                                            <XCircle size={16} /> Hủy
                                        </button>
                                    )}
                                    {apt.status === 'PENDING_CONFIRMATION' && apt.visitType === 'HOME_VISIT' && (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#059669' }}
                                            onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                        >
                                            <CheckCircle size={16} /> Xác nhận
                                        </button>
                                    )}
                                    {apt.status === 'CONFIRMED' && apt.visitType === 'HOME_VISIT' && (
                                        <button className="btn-primary" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#3b82f6', display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={() => handleUpdateStatus(apt.id, 'ON_THE_WAY')}>
                                            Đang di chuyển
                                        </button>
                                    )}
                                    {apt.status === 'ON_THE_WAY' && apt.visitType === 'HOME_VISIT' && (
                                        <button className="btn-primary" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#6366f1', display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={() => handleUpdateStatus(apt.id, 'ARRIVED')}>
                                            Đã đến nơi
                                        </button>
                                    )}
                                    {apt.status === 'ARRIVED' && apt.visitType === 'HOME_VISIT' && (
                                        <button className="btn-primary" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#8b5cf6', display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}>
                                            Bắt đầu khám
                                        </button>
                                    )}
                                    {apt.status === 'IN_PROGRESS' && (
                                        <>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#059669' }}
                                                onClick={() => handleComplete(apt)}
                                            >
                                                <CheckCircle size={16} /> Hoàn thành
                                            </button>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#6b7280' }}
                                                onClick={() => handleUpdateStatus(apt.id, 'NO_SHOW')}
                                                title="Đánh dấu bệnh nhân không đến khám"
                                            >
                                                <UserX size={16} /> Không đến
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
                                            <Star size={16} /> Đánh giá
                                        </button>
                                    )}
                                    {['COMPLETED', 'PAID'].includes(apt.status) && (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#4f46e5' }}
                                            onClick={() => setViewingRecordApt(apt)}
                                            title="View Medical Record"
                                        >
                                            <FileText size={16} /> Hồ sơ bệnh án
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {apts.length === 0 && (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Không có lịch hẹn nào trong danh mục này.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    onClick={() => navigate('/admin/my-shifts')}
                    style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                    title="Quay lại danh sách ca làm việc"
                >
                    <ArrowLeft size={20} color="#4b5563" />
                </button>
                <div>
                    <h2 style={{ margin: 0 }}>Lịch hẹn của Ca làm việc #{scheduleId}</h2>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Bác sĩ: {doctor.fullName} | Số lượng lịch hẹn: {appointments.length}
                    </div>
                </div>
            </div>

            {renderTable(appointments, "Danh sách tất cả Bệnh nhân trong ca làm việc")}

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
                    <div className="modal-content" style={{ maxWidth: '450px', padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
                        <div style={{ backgroundColor: '#f3f4f6', padding: '2rem 1.5rem', textAlign: 'center', position: 'relative' }}>
                            <button className="close-btn" onClick={() => setViewingPatient(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={24}/>
                            </button>
                            <div style={{ width: '80px', height: '80px', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto 1rem' }}>
                                {viewingPatient.fullName.charAt(0).toUpperCase()}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>{viewingPatient.fullName}</h3>
                            <div style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.9rem' }}>Bệnh nhân của phòng khám</div>
                        </div>
                        
                        <div style={{ padding: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Thông tin cá nhân</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                <strong style={{ color: '#6b7280' }}>Giới tính:</strong>
                                <span style={{ color: '#111827' }}>{viewingPatient.gender || 'N/A'}</span>

                                <strong style={{ color: '#6b7280' }}>Ngày sinh:</strong>
                                <span style={{ color: '#111827' }}>{viewingPatient.birthday || 'N/A'}</span>

                                <strong style={{ color: '#6b7280' }}>Số điện thoại:</strong>
                                <span style={{ color: '#111827' }}>{viewingPatient.phone || 'N/A'}</span>

                                <strong style={{ color: '#6b7280' }}>Địa chỉ:</strong>
                                <span style={{ color: '#111827' }}>{viewingPatient.address || 'N/A'}</span>
                            </div>

                            <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Hồ sơ y tế cơ bản</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                                <strong style={{ color: '#6b7280' }}>Nhóm máu:</strong>
                                <span style={{ color: '#111827', fontWeight: 'bold', color: '#dc2626' }}>{viewingPatient.bloodGroup || 'Chưa cập nhật'}</span>

                                <strong style={{ color: '#6b7280' }}>Dị ứng:</strong>
                                <span style={{ 
                                    color: viewingPatient.allergy ? '#b91c1c' : '#111827',
                                    backgroundColor: viewingPatient.allergy ? '#fee2e2' : 'transparent',
                                    padding: viewingPatient.allergy ? '0.15rem 0.4rem' : 0,
                                    borderRadius: '4px',
                                    fontWeight: viewingPatient.allergy ? 'bold' : 'normal'
                                }}>
                                    {viewingPatient.allergy || 'Không có báo cáo'}
                                </span>
                            </div>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
                            <button className="btn-secondary" onClick={() => setViewingPatient(null)} style={{ padding: '0.5rem 1.5rem' }}>Đóng lại</button>
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

export default ScheduleAppointmentsPage;
