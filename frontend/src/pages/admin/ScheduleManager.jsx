import React, { useState, useEffect } from 'react';
import { getDoctorSchedules, getOpenSchedules, registerDoctorSchedule, updateScheduleStatus } from '../../api/appointmentApi';
import { Calendar, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ScheduleManager = ({ doctorId, viewTab }) => {
    const [date, setDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

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
            if (viewTab === 'myShifts') {
                if (doctorId) {
                    const data = await getDoctorSchedules(doctorId, date);
                    setMySchedules(data);
                }
            } else {
                const data = await getOpenSchedules(date);
                setOpenSchedules(data);
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
        try {
            await updateScheduleStatus(id, newStatus);
            fetchData();
        } catch (error) {
            console.error("Failed to update status", error);
            const errMsg = error.response?.data?.message || error.response?.data || error.message || "Cập nhật trạng thái thất bại.";
            alert(errMsg);
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

    return (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            {/* Header & Date Picker */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>

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
                    mySchedules.length === 0 ? (
                        <div style={{ color: '#6b7280', textAlign: 'center', padding: '2.5rem' }}>
                            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>Bạn chưa có ca trực nào vào ngày {date}.</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Chuyển sang mục <strong>"Đăng ký ca làm (Admin tạo mở)"</strong> ở trên để nhận ca trực mới do Admin tạo.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {mySchedules.map(sch => {
                                const st = getStatusColor(sch.status);
                                return (
                                    <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{sch.startTime} - {sch.endTime}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                Bệnh nhân đăng ký: <strong style={{ color: '#059669' }}>{sch.currentPatient || 0}</strong> / {sch.maxPatient}
                                            </div>
                                            {sch.note && (
                                                <div style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 'bold', fontStyle: 'italic' }}>
                                                    Ghi chú: {(sch.note === 'V\\u1EAFng b\\u00E1c s\\u0129' || sch.note === 'V?ng bác s?') ? 'Vắng bác sĩ' : sch.note}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ backgroundColor: st.bg, color: st.color, padding: '0.35rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {st.label}
                                            </span>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {['AVAILABLE', 'FULL'].includes(sch.status) && (
                                                    <button onClick={() => {
                                                        if (!sch.currentPatient || sch.currentPatient === 0) {
                                                            toast.error("Ca khám phải có ít nhất 1 bệnh nhân mới có thể bắt đầu!");
                                                            return;
                                                        }
                                                        handleStatusUpdate(sch.id, 'IN_PROGRESS');
                                                    }} style={{ padding: '0.4rem 0.85rem', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                        Bắt đầu ca khám (IN_PROGRESS)
                                                    </button>
                                                )}
                                                {sch.status === 'IN_PROGRESS' && (
                                                    <button onClick={() => handleStatusUpdate(sch.id, 'COMPLETED')} style={{ padding: '0.4rem 0.85rem', backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                        Kết thúc ca (COMPLETED)
                                                    </button>
                                                )}
                                                {['OPEN', 'AVAILABLE'].includes(sch.status) && (
                                                    <button onClick={() => handleStatusUpdate(sch.id, 'CANCELLED')} style={{ padding: '0.4rem 0.85rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                        Hủy ca
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* Open Shifts Available for Registration */
                    openSchedules.length === 0 ? (
                        <div style={{ color: '#6b7280', textAlign: 'center', padding: '2.5rem' }}>
                            <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>Không có ca khám MỞ nào chờ đăng ký vào ngày {date}.</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Admin chưa tạo ca mở hoặc tất cả ca mở đã có bác sĩ nhận.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                Danh sách các ca làm việc do Admin tạo ở trạng thái <strong>OPEN</strong> (chưa có bác sĩ). Hãy bấm nút <strong>"Đăng ký nhận ca"</strong> để chuyển ca sang tên bạn.
                            </div>
                            {openSchedules.map(sch => {
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
