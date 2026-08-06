import React, { useState, useEffect } from 'react';
import { getDoctorSchedules, getOpenSchedules, registerDoctorSchedule, updateScheduleStatus } from '../../api/appointmentApi';
import { Calendar, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

import { useNavigate } from 'react-router-dom';

const ScheduleManager = ({ doctorId, viewTab, appointments = [] }) => {
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    const [mySchedules, setMySchedules] = useState([]);
    const [openSchedules, setOpenSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (date) {
            fetchData();
        }
    }, [doctorId, date, viewTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (doctorId) {
                const myData = await getDoctorSchedules(doctorId, date);
                setMySchedules(myData);
            }
            if (viewTab !== 'myShifts') {
                const openData = await getOpenSchedules(date);
                setOpenSchedules(openData);
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterShift = async (scheduleId) => {
        if (!doctorId) {
            alert("Không tìm thấy thông tin tài khoản Bác sĩ!");
            return;
        }
        try {
            await registerDoctorSchedule(scheduleId, doctorId);
            alert("Đăng ký ca trực thành công! Ca làm việc đã chuyển sang trạng thái AVAILABLE.");
            fetchData();
        } catch (error) {
            console.error("Failed to register shift", error);
            alert("Đăng ký ca thất bại: " + (error.response?.data?.message || error.message));
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        let actionText = '';
        if (newStatus === 'CANCELLED') actionText = 'hủy ca trực này';
        else if (newStatus === 'IN_PROGRESS') actionText = 'bắt đầu ca làm việc này';
        else if (newStatus === 'COMPLETED') actionText = 'kết thúc ca làm việc này';

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
            await updateScheduleStatus(id, newStatus);
            fetchData();
            if (actionText) {
                Swal.fire('Thành công', 'Đã cập nhật trạng thái thành công', 'success');
            }
        } catch (error) {
            console.error("Failed to update status", error);
            const errMsg = error.response?.data?.message || error.response?.data || error.message || "Cập nhật trạng thái thất bại.";
            Swal.fire('Lỗi', errMsg, 'error');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'OPEN': return { bg: '#e5e7eb', color: '#374151', label: 'OPEN – Chờ bác sĩ nhận' };
            case 'AVAILABLE': return { bg: '#dbeafe', color: '#1d4ed8', label: 'AVAILABLE – Đã nhận ca' };
            case 'FULL': return { bg: '#fee2e2', color: '#b91c1c', label: 'FULL – Đủ bệnh nhân' };
            case 'IN_PROGRESS': return { bg: '#fef3c7', color: '#b45309', label: 'IN_PROGRESS – Đang diễn ra' };
            case 'COMPLETED': return { bg: '#d1fae5', color: '#047857', label: 'COMPLETED – Đã hoàn thành' };
            case 'CANCELLED': return { bg: '#f3f4f6', color: '#9ca3af', label: 'CANCELLED – Đã hủy' };
            default: return { bg: '#f3f4f6', color: '#4b5563', label: status };
        }
    };

    const filteredMySchedules = mySchedules
        .filter(s => (s.clinicRoom?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const isOverlapping = (openSch) => {
        return mySchedules.some(my => {
            if (my.status === 'CANCELLED' || my.status === 'COMPLETED') return false;
            return (openSch.startTime < my.endTime && openSch.endTime > my.startTime);
        });
    };

    const filteredOpenSchedules = openSchedules
        .filter(s => (s.clinicRoom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) && !isOverlapping(s))
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    return (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            {/* Header & Date Picker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Tìm theo tên phòng khám..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', minWidth: '250px' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Ngày khám:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
            </div>

            {/* Shift List Container */}
            <div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải lịch làm việc...</div>
                ) : viewTab === 'myShifts' ? (
                    /* My Registered Shifts */
                    filteredMySchedules.length === 0 ? (
                        <div style={{ color: '#6b7280', textAlign: 'center', padding: '2.5rem' }}>
                            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Không có lịch làm việc</h3>
                            <p>Bạn không có ca trực nào vào ngày {date} phù hợp với tìm kiếm.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {filteredMySchedules.map(sch => {
                                const st = getStatusColor(sch.status);
                                const schApts = appointments.filter(a => a.scheduleId === sch.id);
                                return (
                                    <div key={sch.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b' }}>Khung giờ: {sch.startTime} - {sch.endTime}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                    Bệnh nhân đăng ký: <strong style={{ color: '#059669' }}>{sch.currentPatient || 0}</strong> / {sch.maxPatient}
                                                </div>
                                                {sch.note && (
                                                    <div style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 'bold', fontStyle: 'italic' }}>
                                                        Ghi chú: {(sch.note === 'V\\u1EAFng b\\u00E1c s\\u0129' || sch.note === 'V?ng bác s?') ? 'Vắng bác sĩ' : sch.note}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ backgroundColor: st.bg, color: st.color, padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                    {st.label}
                                                </span>

                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {sch.status === 'OPEN' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate(sch.id, 'AVAILABLE')} style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                                Xác nhận
                                                            </button>
                                                            <button onClick={() => handleStatusUpdate(sch.id, 'CANCELLED')} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                                Từ chối
                                                            </button>
                                                        </>
                                                    )}
                                                    {['AVAILABLE', 'FULL'].includes(sch.status) && (
                                                        <button 
                                                            disabled={!sch.currentPatient || sch.currentPatient === 0}
                                                            onClick={() => {
                                                                if (!sch.currentPatient || sch.currentPatient === 0) {
                                                                    toast.error("Ca khám phải có ít nhất 1 bệnh nhân mới có thể bắt đầu!");
                                                                    return;
                                                                }
                                                                handleStatusUpdate(sch.id, 'IN_PROGRESS');
                                                            }} 
                                                            style={{ 
                                                                padding: '0.5rem 1rem', 
                                                                backgroundColor: (!sch.currentPatient || sch.currentPatient === 0) ? '#f3f4f6' : '#fef3c7', 
                                                                color: (!sch.currentPatient || sch.currentPatient === 0) ? '#9ca3af' : '#b45309', 
                                                                border: (!sch.currentPatient || sch.currentPatient === 0) ? '1px solid #d1d5db' : '1px solid #fde68a', 
                                                                borderRadius: '6px', 
                                                                cursor: (!sch.currentPatient || sch.currentPatient === 0) ? 'not-allowed' : 'pointer', 
                                                                fontWeight: 'bold', 
                                                                fontSize: '0.85rem' 
                                                            }}>
                                                            Bắt đầu ca khám (IN_PROGRESS)
                                                        </button>
                                                    )}
                                                    {sch.status === 'IN_PROGRESS' && (() => {
                                                        const allFinished = schApts.length > 0 && schApts.every(a => ['COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW', 'NO_SHOW_BY_DOCTOR', 'DECLINED', 'PAID'].includes(a.status));
                                                        return (
                                                            <button 
                                                                disabled={!allFinished}
                                                                onClick={() => {
                                                                    if (!allFinished) {
                                                                        toast.error("Vui lòng hoàn thành khám cho tất cả bệnh nhân trước khi kết thúc ca!");
                                                                        return;
                                                                    }
                                                                    handleStatusUpdate(sch.id, 'COMPLETED');
                                                                }} 
                                                                style={{ 
                                                                    padding: '0.5rem 1rem', 
                                                                    backgroundColor: !allFinished ? '#f3f4f6' : '#d1fae5', 
                                                                    color: !allFinished ? '#9ca3af' : '#047857', 
                                                                    border: !allFinished ? '1px solid #d1d5db' : '1px solid #6ee7b7', 
                                                                    borderRadius: '6px', 
                                                                    cursor: !allFinished ? 'not-allowed' : 'pointer', 
                                                                    fontWeight: 'bold', 
                                                                    fontSize: '0.85rem' 
                                                                }}>
                                                                Kết thúc ca (COMPLETED)
                                                            </button>
                                                        );
                                                    })()}
                                                    {sch.status === 'AVAILABLE' && (
                                                        <button onClick={() => handleStatusUpdate(sch.id, 'CANCELLED')} style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            Hủy ca
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Appointments List for this shift */}
                                        <div style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>Danh sách lịch hẹn ({schApts.length}):</h4>
                                                <button
                                                    onClick={() => navigate('/admin/schedule-appointments/' + sch.id)}
                                                    style={{ padding: '0.4rem 0.8rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                >
                                                    Quản lý các Lịch hẹn này <CheckCircle size={14} />
                                                </button>
                                            </div>
                                            
                                            {schApts.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {schApts.map(apt => (
                                                        <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                            <div>
                                                                <div style={{ fontWeight: 'bold', color: '#111827' }}>
                                                                    {apt.patientName} 
                                                                    {apt.visitType === 'HOME_VISIT' && (
                                                                        <span style={{ marginLeft: '0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>Tại nhà</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>Triệu chứng: {apt.symptom}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563', backgroundColor: '#e5e7eb', padding: '0.25rem 0.6rem', borderRadius: '12px' }}>
                                                                    {apt.status}
                                                                </div>
                                                                <button
                                                                    onClick={() => navigate('/admin/schedule-appointments/' + sch.id)}
                                                                    style={{ padding: '0.25rem 0.6rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                                                                >
                                                                    Thao tác
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Chưa có bệnh nhân nào đặt lịch cho ca này.</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* Open Shifts for Registration */
                    filteredOpenSchedules.length === 0 ? (
                        <div style={{ color: '#6b7280', textAlign: 'center', padding: '2.5rem' }}>
                            <UserCheck size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Không có ca mở đăng ký</h3>
                            <p>Không có ca trực nào đang mở vào ngày {date} phù hợp với tìm kiếm.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                Danh sách các ca làm việc do Admin tạo ở trạng thái <strong>OPEN</strong> (chưa có bác sĩ). Hãy bấm nút <strong>"Đăng ký nhận ca"</strong> để chuyển ca sang tên bạn.
                            </div>
                            {filteredOpenSchedules.map(sch => {
                                const isExpired = new Date(`${sch.date}T${sch.startTime}`) <= new Date();
                                return (
                                    <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid #fed7aa', borderRadius: '8px', backgroundColor: isExpired ? '#fcfcfc' : '#fff7ed', opacity: isExpired ? 0.7 : 1 }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: isExpired ? '#6b7280' : '#9a3412' }}>Khung giờ: {sch.startTime} - {sch.endTime}</div>
                                            <div style={{ fontSize: '0.875rem', color: isExpired ? '#6b7280' : '#7c2d12', marginTop: '0.25rem' }}>
                                                Sức chứa tối đa: <strong>{sch.maxPatient} bệnh nhân</strong> | Bác sĩ: <span style={{ fontStyle: 'italic' }}>Chưa đăng ký</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {isExpired ? (
                                                <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '0.35rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    Đã quá giờ đăng ký (Quá hạn)
                                                </span>
                                            ) : (
                                                <>
                                                    <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74', padding: '0.35rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        OPEN – Chờ nhận ca
                                                    </span>

                                                    <button
                                                        onClick={() => handleRegisterShift(sch.id)}
                                                        style={{
                                                            padding: '0.5rem 1.25rem',
                                                            backgroundColor: '#2563eb',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                                                        }}
                                                    >
                                                        <CheckCircle size={16} /> Đăng ký nhận ca
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default ScheduleManager;
