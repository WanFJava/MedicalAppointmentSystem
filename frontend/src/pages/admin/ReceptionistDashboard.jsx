import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment, confirmHomeVisit } from '../../api/appointmentApi';
import { CheckCircle, XCircle, UserCheck, Trash2, Star, Home, Building, AlertTriangle } from 'lucide-react';
import BillModal from './BillModal';
import FeedbackModal from '../FeedbackModal';
import ChangeDoctorModal from './ChangeDoctorModal';
import AdminBookingModal from './AdminBookingModal';
import { Plus } from 'lucide-react';
import Swal from 'sweetalert2';

const ReceptionistDashboard = () => {
    const { user } = useContext(AuthContext);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingApt, setBillingApt] = useState(null);
    const [feedbackApt, setFeedbackApt] = useState(null);
    const [changeDoctorApt, setChangeDoctorApt] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [visitTypeFilter, setVisitTypeFilter] = useState('ALL');

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
            Swal.fire('Thành công', 'Đã cập nhật trạng thái thành công', 'success');
        } catch (error) {
            Swal.fire('Lỗi', "Cập nhật trạng thái thất bại", 'error');
        }
    };

    const handleConfirmHomeVisit = async (apt) => {
        const { value: exactTime } = await Swal.fire({
            title: 'Xác nhận Khám tại nhà',
            text: `Bệnh nhân mong muốn: ${apt.expectedTime || 'Không rõ'}\nVui lòng nhập Giờ đến dự kiến chính xác:`,
            input: 'time',
            inputPlaceholder: 'VD: 14:30',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Đóng',
            inputValidator: (value) => {
                if (!value) {
                    return 'Bạn cần nhập Giờ đến dự kiến!'
                }
            }
        });

        if (exactTime) {
            try {
                await confirmHomeVisit(apt.id, exactTime);
                fetchAppointments();
                Swal.fire('Thành công', `Đã xác nhận giờ đến lúc ${exactTime}`, 'success');
            } catch (error) {
                Swal.fire('Lỗi', `Xác nhận thất bại: ${error.response?.data?.message || error.message}`, 'error');
            }
        }
    };

    const confirmAndUpdateStatus = async (id, status, message) => {
        const result = await Swal.fire({
            title: 'Xác nhận',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Đóng',
            confirmButtonColor: '#dc2626'
        });
        if (result.isConfirmed) {
            handleUpdateStatus(id, status);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa',
            text: "Bạn có chắc chắn muốn xoá hoàn toàn lịch hẹn này không? Hành động này không thể hoàn tác.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#dc2626'
        });
        
        if (result.isConfirmed) {
            try {
                await deleteAppointment(id);
                fetchAppointments();
                Swal.fire('Đã xóa!', 'Lịch hẹn đã bị xóa.', 'success');
            } catch (error) {
                Swal.fire('Lỗi', "Xóa lịch hẹn thất bại", 'error');
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

    if (loading) return <div style={{ padding: '2rem' }}>Đang tải bảng điều khiển...</div>;

    const dateFiltered = filterDate
        ? appointments.filter(apt => apt.scheduleDate === filterDate)
        : appointments;

    const filteredAppointments = dateFiltered.filter(apt => {
        const matchSearch = (apt.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (apt.doctorName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                            
        let matchStatus = true;
        if (statusFilter !== 'ALL') {
            matchStatus = apt.status === statusFilter;
        }

        let matchType = true;
        if (visitTypeFilter !== 'ALL') {
            matchType = apt.visitType === visitTypeFilter;
        }

        return matchSearch && matchStatus && matchType;
    });

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2>Quản lý Lịch hẹn</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>Xin chào, {user?.fullName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
                    <button 
                        className="btn-primary" 
                        onClick={() => setShowBookingModal(true)} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}
                    >
                        <Plus size={16} /> Đặt lịch hộ
                    </button>
                    <select
                        value={visitTypeFilter}
                        onChange={(e) => setVisitTypeFilter(e.target.value)}
                    >
                        <option value="ALL">Loại hình: Tất cả</option>
                        <option value="CLINIC_VISIT">Tại trung tâm</option>
                        <option value="HOME_VISIT">Tại nhà</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Trạng thái: Tất cả</option>
                        <option value="PENDING">Chờ khám</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="CHECKED_IN">Đang khám</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED_BY_PATIENT">BN Hủy</option>
                        <option value="CANCELLED_BY_DOCTOR">BS Hủy</option>
                        <option value="NO_SHOW_BY_DOCTOR">BS Vắng</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Tìm bệnh nhân, bác sĩ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '200px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #e5e7eb', paddingLeft: '0.75rem' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Ngày:</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                        <button
                            onClick={() => setFilterDate('')}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                            title="Xem tất cả ngày"
                        >
                            Tất cả
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Bệnh nhân</th>
                            <th>Loại hình</th>
                            <th>Bác sĩ</th>
                            <th>Ngày & Giờ</th>
                            <th>Triệu chứng</th>
                            <th>Trạng thái</th>
                            <th>Thanh toán</th>
                            <th>Thao tác</th>
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
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Ca: {apt.timeSlot}
                                        </div>
                                        {apt.visitType === 'HOME_VISIT' && (
                                            <div style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: 600, marginTop: '0.25rem' }}>
                                                Dự kiến: {apt.expectedTime || 'Chưa chốt'}
                                            </div>
                                        )}
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
                                            {apt.visitType === 'HOME_VISIT' ? (
                                                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                                                    Quản lý ở tab Khám tại nhà
                                                </span>
                                            ) : (
                                                <>
                                                    {(apt.status === 'PENDING' || apt.status === 'PENDING_CONFIRMATION') && (
                                                        <>
                                                            <button
                                                                title="Xác nhận lịch hẹn"
                                                                onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                                                style={{ padding: '0.5rem', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                title="Hủy lịch hẹn"
                                                                onClick={() => {
                                                                    confirmAndUpdateStatus(apt.id, 'CANCELLED_BY_DOCTOR', "Bạn có chắc chắn muốn hủy lịch hẹn này không?");
                                                                }}
                                                                style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {apt.status === 'CONFIRMED' && (
                                                        <button
                                                            title="Xác nhận bệnh nhân đến khám"
                                                            onClick={() => handleUpdateStatus(apt.id, 'CHECKED_IN')}
                                                            style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                            <UserCheck size={16} /> Đến khám
                                                        </button>
                                                    )}
                                                    {['CONFIRMED', 'CHECKED_IN'].includes(apt.status) && (
                                                        <button
                                                            title="Đánh vắng bác sĩ"
                                                            onClick={() => {
                                                                confirmAndUpdateStatus(apt.id, 'NO_SHOW_BY_DOCTOR', "Bác sĩ không khám bệnh nhân này? Lịch hẹn sẽ bị hủy với lý do Bác sĩ vắng.");
                                                            }}
                                                            style={{ padding: '0.5rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <AlertTriangle size={16} /> BS vắng
                                                        </button>
                                                    )}
                                                    {apt.status === 'COMPLETED' && (
                                                        <button
                                                            title="Xuất hóa đơn / Xác nhận thanh toán"
                                                            onClick={() => setBillingApt(apt)}
                                                            style={{ padding: '0.5rem', backgroundColor: '#fce7f3', color: '#be185d', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                            Thanh toán
                                                        </button>
                                                    )}
                                                    {apt.status === 'COMPLETED' && apt.isReviewed && (
                                                        <button
                                                            title="Xem đánh giá của bệnh nhân"
                                                            onClick={() => setFeedbackApt(apt)}
                                                            style={{ padding: '0.5rem', backgroundColor: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                                            <Star size={16} />
                                                        </button>
                                                    )}
                                                    {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                                                        <>
                                                            {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                                                                <button
                                                                    title="Đổi Bác sĩ / Lịch hẹn"
                                                                    onClick={() => setChangeDoctorApt(apt)}
                                                                    style={{ padding: '0.5rem', backgroundColor: '#f3e8ff', color: '#7e22ce', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', marginLeft: '0.5rem' }}>
                                                                    <UserCheck size={16} />
                                                                </button>
                                                            )}
                                                        </>
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
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy lịch hẹn nào.</td>
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
