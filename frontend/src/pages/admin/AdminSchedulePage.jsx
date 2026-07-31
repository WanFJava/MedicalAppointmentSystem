import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDoctors } from '../../api/adminApi';
import { 
    getAllSchedules, 
    createSchedule, 
    createOpenSchedule,
    generateSchedules, 
    generateOpenSchedules,
    updateScheduleStatus, 
    deleteSchedule 
} from '../../api/appointmentApi';
import { Calendar, Plus, Zap, Trash2, Filter, Clock, UserCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const AdminSchedulePage = () => {
    const [searchParams] = useSearchParams();
    const initialDoctorId = searchParams.get('doctorId') || '';

    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        doctorId: initialDoctorId || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '11:30',
        maxPatient: 10
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [selectedDate, selectedDoctorId]);

    const fetchDoctors = async () => {
        try {
            const docs = await getDoctors();
            setDoctors(docs);
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const data = await getAllSchedules(selectedDate, selectedDoctorId || null);
            setSchedules(data);
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();

        if (!createForm.date || !createForm.startTime || !createForm.endTime) {
            alert("Vui lòng điền đầy đủ ngày và khung giờ khám!");
            return;
        }

        const shiftStart = new Date(`${createForm.date}T${createForm.startTime}`);
        const shiftEnd = new Date(`${createForm.date}T${createForm.endTime}`);

        if (shiftStart >= shiftEnd) {
            alert("Tạo ca thất bại: Giờ bắt đầu phải nhỏ hơn giờ kết thúc!");
            return;
        }

        if (new Date() > shiftStart) {
            alert(`Tạo ca thất bại: Ca khám (${createForm.date} ${createForm.startTime}) đã qua thời gian bắt đầu!`);
            return;
        }

        const payload = {
            date: createForm.date,
            startTime: createForm.startTime,
            endTime: createForm.endTime,
            maxPatient: parseInt(createForm.maxPatient, 10)
        };

        try {
            if (createForm.doctorId) {
                await createSchedule(createForm.doctorId, payload);
            } else {
                await createOpenSchedule(payload);
            }
            setIsCreateModalOpen(false);
            fetchSchedules();
        } catch (error) {
            console.error("Failed to create schedule", error);
            const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
            alert("Tạo lịch thất bại: " + errMsg);
        }
    };

    const handleGenerateShifts = async () => {
        if (selectedDoctorId) {
            const doc = doctors.find(d => String(d.id) === String(selectedDoctorId));
            if (window.confirm(`Tự động sinh ca sáng & chiều cho bác sĩ ${doc ? doc.fullName : ''} ngày ${selectedDate}?`)) {
                try {
                    await generateSchedules(selectedDoctorId, selectedDate);
                    fetchSchedules();
                } catch (error) {
                    console.error("Failed to generate schedules", error);
                    const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
                    alert("Tự động tạo lịch thất bại: " + errMsg);
                }
            }
        } else {
            if (window.confirm(`Tự động sinh ca MỞ (sáng & chiều) chờ bác sĩ đăng ký cho ngày ${selectedDate}?`)) {
                try {
                    await generateOpenSchedules(selectedDate);
                    fetchSchedules();
                } catch (error) {
                    console.error("Failed to generate open schedules", error);
                    const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
                    alert("Tự động tạo ca mở thất bại: " + errMsg);
                }
            }
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateScheduleStatus(id, status);
            fetchSchedules();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Cập nhật trạng thái ca thất bại.");
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa ca lịch khám này không?")) {
            try {
                await deleteSchedule(id);
                fetchSchedules();
            } catch (error) {
                console.error("Failed to delete schedule", error);
                alert("Xóa ca khám thất bại.");
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusConfigs = {
            'OPEN': { label: 'OPEN – Chờ bác sĩ nhận', bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', icon: <Clock size={14}/> },
            'AVAILABLE': { label: 'AVAILABLE – Bác sĩ đã nhận (Sẵn sàng)', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', icon: <UserCheck size={14}/> },
            'FULL': { label: 'FULL – Đủ bệnh nhân', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: <AlertCircle size={14}/> },
            'IN_PROGRESS': { label: 'IN_PROGRESS – Ca đang diễn ra', bg: '#fef3c7', color: '#92400e', border: '#fde68a', icon: <Zap size={14}/> },
            'COMPLETED': { label: 'COMPLETED – Ca kết thúc', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', icon: <CheckCircle size={14}/> },
            'CANCELLED': { label: 'CANCELLED – Ca bị hủy', bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb', icon: <XCircle size={14}/> }
        };

        const config = statusConfigs[status] || { label: status, bg: '#f3f4f6', color: '#374151', border: '#d1d5db', icon: null };

        return (
            <span style={{
                backgroundColor: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
            }}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Quản Lý Lịch Khám Bác Sĩ (Schedules)</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Tạo ca khám với trạng thái <strong style={{ color: '#4b5563' }}>OPEN</strong> để bác sĩ xác nhận đăng ký ca trực.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        onClick={handleGenerateShifts} 
                        className="btn-secondary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
                    >
                        <Zap size={18} color="#d97706" /> Tự động sinh ca
                    </button>
                    <button 
                        onClick={() => {
                            setCreateForm(prev => ({
                                ...prev,
                                doctorId: selectedDoctorId || '',
                                date: selectedDate
                            }));
                            setIsCreateModalOpen(true);
                        }} 
                        className="btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.6rem 1.25rem' }}
                    >
                        <Plus size={18} /> Tạo ca khám mới
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ 
                backgroundColor: 'white', 
                padding: '1.25rem', 
                borderRadius: '10px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontWeight: '600' }}>Bộ lọc tìm kiếm:</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#4b5563' }}>Ngày khám:</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#4b5563' }}>Bác sĩ:</label>
                    <select 
                        value={selectedDoctorId} 
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '200px' }}
                    >
                        <option value="">-- Tất cả bác sĩ --</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>
                                {doc.fullName} ({doc.specialtyName})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedDoctorId && (
                    <button 
                        onClick={() => setSelectedDoctorId('')}
                        style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Xóa chọn bác sĩ
                    </button>
                )}
            </div>

            {/* Shift Status Reference Card */}
            <div style={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '1rem 1.25rem', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#334155' }}>Vòng đời trạng thái ca khám (schedules.status):</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', color: '#475569' }}>
                    <div>• <strong style={{ color: '#374151' }}>OPEN</strong> – Admin tạo ca, chờ bác sĩ nhận.</div>
                    <div>• <strong style={{ color: '#1e40af' }}>AVAILABLE</strong> – Bác sĩ đã nhận, bệnh nhân có thể đặt.</div>
                    <div>• <strong style={{ color: '#991b1b' }}>FULL</strong> – Đủ số lượng bệnh nhân.</div>
                    <div>• <strong style={{ color: '#92400e' }}>IN_PROGRESS</strong> – Ca đang diễn ra.</div>
                    <div>• <strong style={{ color: '#065f46' }}>COMPLETED</strong> – Ca kết thúc.</div>
                    <div>• <strong style={{ color: '#6b7280' }}>CANCELLED</strong> – Ca bị hủy.</div>
                </div>
            </div>

            {/* Schedules Table */}
            <div className="table-container">
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải danh sách ca khám...</div>
                ) : schedules.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>Không tìm thấy ca khám nào vào ngày {selectedDate}</div>
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Hãy bấm nút "Tạo ca khám mới" hoặc "Tự động sinh ca" ở trên.</div>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Bác sĩ</th>
                                <th>Khung giờ</th>
                                <th>Sức chứa (Bệnh nhân)</th>
                                <th>Trạng thái (Status)</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map((sch) => (
                                <tr key={sch.id}>
                                    <td>
                                        <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{sch.doctorName || `Doctor #${sch.doctorId}`}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID Bác sĩ: {sch.doctorId}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{sch.startTime} - {sch.endTime}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ngày: {sch.date}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600', color: sch.currentPatient >= sch.maxPatient ? '#dc2626' : '#059669' }}>
                                            {sch.currentPatient || 0}
                                        </span> / {sch.maxPatient} bệnh nhân
                                    </td>
                                    <td>
                                        {getStatusBadge(sch.status)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            {sch.status === 'OPEN' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(sch.id, 'AVAILABLE')} 
                                                    style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                >
                                                    Duyệt ca (Set Available)
                                                </button>
                                            )}
                                            {sch.status !== 'CANCELLED' && sch.status !== 'COMPLETED' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(sch.id, 'CANCELLED')} 
                                                    style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                >
                                                    Hủy ca
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Schedule Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Tạo Ca Khám Mới (OPEN)</h3>
                            <button className="btn-close" onClick={() => setIsCreateModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateShift}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                                <div className="form-group">
                                    <label>Gán Bác Sĩ (Tùy chọn)</label>
                                    <select 
                                        className="form-control"
                                        value={createForm.doctorId}
                                        onChange={(e) => setCreateForm({...createForm, doctorId: e.target.value})}
                                    >
                                        <option value="">-- Ca Mở (Chưa gán bác sĩ - Chờ bác sĩ đăng ký) --</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.fullName} ({doc.specialtyName})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Ngày khám <span style={{ color: 'red' }}>*</span></label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="form-control"
                                        value={createForm.date} 
                                        onChange={(e) => setCreateForm({...createForm, date: e.target.value})}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Giờ bắt đầu <span style={{ color: 'red' }}>*</span></label>
                                        <input 
                                            type="time" 
                                            required 
                                            className="form-control"
                                            value={createForm.startTime} 
                                            onChange={(e) => setCreateForm({...createForm, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giờ kết thúc <span style={{ color: 'red' }}>*</span></label>
                                        <input 
                                            type="time" 
                                            required 
                                            className="form-control"
                                            value={createForm.endTime} 
                                            onChange={(e) => setCreateForm({...createForm, endTime: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Số lượng bệnh nhân tối đa <span style={{ color: 'red' }}>*</span></label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        max="50"
                                        required 
                                        className="form-control"
                                        value={createForm.maxPatient} 
                                        onChange={(e) => setCreateForm({...createForm, maxPatient: e.target.value})}
                                    />
                                </div>

                                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#166534' }}>
                                    <strong>Ghi chú:</strong> Ca khám mới tạo sẽ có trạng thái ban đầu là <strong>OPEN</strong> để bác sĩ đăng ký nhận ca.
                                </div>
                            </div>

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Tạo Ca Khám (OPEN)</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSchedulePage;
