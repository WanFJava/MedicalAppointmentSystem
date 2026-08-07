import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getDoctorByUserId } from '../../api/adminApi';
import { getDoctorAppointments, updateAppointmentStatus } from '../../api/appointmentApi';
import { getPatientProfile } from '../../api/patientApi';
import { CheckCircle, ClipboardList, Calendar, Info, X, Star, FileText, Check, XCircle, UserX, UserCheck, Clock, Home, Building, MapPin } from 'lucide-react';
import ScheduleManager from './ScheduleManager';
import DoctorDiagnoseModal from './DoctorDiagnoseModal';
import FeedbackModal from '../FeedbackModal';
import PatientRecordModal from '../PatientRecordModal';
import Swal from 'sweetalert2';

import { useLocation } from 'react-router-dom';

const DoctorDashboard = ({ tab = 'appointments' }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [doctor, setDoctor] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diagnosingApt, setDiagnosingApt] = useState(null);
    const [viewingPatient, setViewingPatient] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [viewingRecordApt, setViewingRecordApt] = useState(null);
    const [filterDate, setFilterDate] = useState(location.state?.selectedDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

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

    if (loading) return <div style={{ padding: '2rem' }}>Đang tải lịch khám...</div>;

    if (!doctor) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Không tìm thấy hồ sơ bác sĩ cho tài khoản này. Vui lòng liên hệ Quản trị viên.
            </div>
        );
    }

    // Filter appointments by selected date first
    const filteredAppointments = appointments.filter(a => a.scheduleDate === filterDate);

    // Then filter by status and visitType
    const homeVisitAppointments = filteredAppointments.filter(a => a.visitType === 'HOME_VISIT' && !['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW', 'NO_SHOW_BY_DOCTOR'].includes(a.status));
    const clinicWaitingAppointments = filteredAppointments.filter(a => a.visitType !== 'HOME_VISIT' && ['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'CHECKED_IN'].includes(a.status));
    const inProgressAppointments = filteredAppointments.filter(a => a.visitType !== 'HOME_VISIT' && a.status === 'IN_PROGRESS');
    const otherAppointments = filteredAppointments.filter(a => ['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW', 'NO_SHOW_BY_DOCTOR'].includes(a.status));

    const renderTable = (apts, title) => (
        <div className="table-container" style={{ marginBottom: '2.5rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <h3 style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e293b', fontSize: '1.1rem' }}>
                <ClipboardList size={22} color="var(--primary-color)" /> {title}
            </h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '1rem 1.5rem' }}>Bệnh nhân</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Loại hình</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Ngày & Giờ</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Triệu chứng</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Trạng thái</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Thao tác</th>
                        </tr>
                    </thead>
                <tbody>
                    {apts.map((apt) => {
                        const statusStyle = getStatusStyle(apt.status);
                        return (
                            <tr key={apt.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{apt.patientName}</div>
                                    {apt.visitType === 'HOME_VISIT' && apt.homeAddress && (
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={12}/> {apt.homeAddress}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    {apt.visitType === 'HOME_VISIT' ? (
                                        <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', fontWeight: '500' }}><Home size={14}/> Tại nhà</span>
                                    ) : (
                                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', fontWeight: '500' }}><Building size={14}/> Tại TT</span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ fontWeight: '500', color: '#334155' }}>{apt.scheduleDate}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>Ca: {apt.timeSlot}</div>
                                    {apt.visitType === 'HOME_VISIT' && (
                                        <>
                                            <div style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: 600, marginTop: '0.25rem' }}>
                                                Dự kiến: {apt.expectedTime || 'Chưa chốt'}
                                            </div>
                                            {apt.travelFee > 0 && (
                                                <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>
                                                    + Phí đi lại: {apt.travelFee.toLocaleString('vi-VN')}đ
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: '#475569' }}>{apt.symptom}</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{
                                        backgroundColor: statusStyle.bg, color: statusStyle.color,
                                        padding: '0.35rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block'
                                    }}>
                                        {apt.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#3b82f6', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
                                        onClick={() => handleViewPatient(apt.patientId)}
                                    >
                                        <Info size={14} /> Hồ sơ BN
                                    </button>

                                    {apt.status === 'PENDING' && (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#ef4444', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
                                            onClick={() => handleUpdateStatus(apt.id, 'CANCELLED_BY_DOCTOR')}
                                        >
                                            <XCircle size={14} /> Hủy
                                        </button>
                                    )}
                                    {apt.status === 'PENDING_CONFIRMATION' && apt.visitType === 'HOME_VISIT' && (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#10b981', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
                                            onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                        >
                                            <CheckCircle size={14} /> Xác nhận
                                        </button>
                                    )}
                                    {apt.status === 'CONFIRMED' && apt.visitType === 'HOME_VISIT' && (
                                        <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', backgroundColor: '#3b82f6', display: 'flex', gap: '0.35rem', alignItems: 'center', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(apt.id, 'ON_THE_WAY')}>
                                            Đang đi
                                        </button>
                                    )}
                                    {apt.status === 'ON_THE_WAY' && apt.visitType === 'HOME_VISIT' && (
                                        <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', backgroundColor: '#6366f1', display: 'flex', gap: '0.35rem', alignItems: 'center', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(apt.id, 'ARRIVED')}>
                                            Đã đến
                                        </button>
                                    )}
                                    {apt.status === 'ARRIVED' && apt.visitType === 'HOME_VISIT' && (
                                        <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', backgroundColor: '#8b5cf6', display: 'flex', gap: '0.35rem', alignItems: 'center', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }} onClick={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}>
                                            Khám bệnh
                                        </button>
                                    )}
                                    {apt.status === 'IN_PROGRESS' && (
                                        <>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#059669', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
                                                onClick={() => handleComplete(apt)}
                                            >
                                                <CheckCircle size={14} /> Khám xong
                                            </button>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#64748b', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
                                                onClick={() => handleUpdateStatus(apt.id, 'NO_SHOW')}
                                                title="Đánh dấu bệnh nhân không đến khám"
                                            >
                                                <UserX size={14} /> Không đến
                                            </button>
                                        </>
                                    )}
                                    {apt.status === 'COMPLETED' && apt.isReviewed && (
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '6px', fontSize: '0.85rem' }}
                                            onClick={() => setFeedbackApt(apt)}
                                            title="View Patient Feedback"
                                        >
                                            <Star size={14} /> Đánh giá
                                        </button>
                                    )}
                                    {['COMPLETED', 'PAID'].includes(apt.status) && (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 0.75rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#4f46e5', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
                                            onClick={() => setViewingRecordApt(apt)}
                                            title="View Medical Record"
                                        >
                                            <FileText size={14} /> Bệnh án
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {apts.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Không có lịch hẹn nào trong danh mục này.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: 'none' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', color: '#1e293b' }}>
                        <ClipboardList size={32} color="var(--primary-color)" /> Lịch trình Bác sĩ
                    </h2>
                    <div style={{ color: '#64748b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ color: '#334155' }}>{doctor.fullName}</strong> • {doctor.specialtyName}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {doctor.canClinicVisit && (
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <Building size={16}/> Nhận khám tại phòng khám
                        </span>
                    )}
                    {doctor.canHomeVisit && (
                        <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <Home size={16}/> Nhận khám tại nhà
                        </span>
                    )}
                </div>
            </div>

            {tab === 'appointments' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#eff6ff', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
                            <Calendar size={20} />
                        </div>
                        <label style={{ fontWeight: '600', fontSize: '0.95rem', color: '#334155' }}>Xem lịch ngày:</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="form-control"
                            style={{ width: 'auto', padding: '0.5rem 1rem', minWidth: '160px', fontWeight: '500' }}
                        />
                    </div>
                </div>
            )}

            {tab === 'appointments' ? (
                <>
                    {doctor.canClinicVisit && renderTable(inProgressAppointments, "Bệnh nhân đang khám tại trung tâm (IN_PROGRESS)")}
                    {doctor.canHomeVisit && renderTable(homeVisitAppointments, "Khám Tại Nhà (HOME_VISIT)")}
                    {doctor.canClinicVisit && renderTable(clinicWaitingAppointments, "Bệnh nhân đang chờ khám tại trung tâm")}
                    {renderTable(otherAppointments, "Các lịch hẹn khác (Đã hoàn thành / Đã hủy)")}
                </>
            ) : (
                <ScheduleManager doctorId={doctor.id} viewTab={tab} appointments={appointments} />
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

export default DoctorDashboard;
