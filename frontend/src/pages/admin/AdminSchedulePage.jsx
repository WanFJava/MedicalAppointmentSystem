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
    updateScheduleInfo,
    deleteSchedule
} from '../../api/appointmentApi';
import { Calendar, Plus, Zap, Trash2, Filter, Clock, UserCheck, AlertCircle, CheckCircle, XCircle, Edit } from 'lucide-react';

const AdminSchedulePage = () => {
    const [searchParams] = useSearchParams();
    const initialDoctorId = searchParams.get('doctorId') || '';

    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
    const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    const [schedules, setSchedules] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        doctorId: initialDoctorId || '',
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '11:30',
        maxPatient: 1,
        scheduleType: 'CLINIC',
        autoSplit: false,
        forceAssign: false
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        date: '',
        startTime: '',
        endTime: '',
        maxPatient: 1
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

        try {
            if (createForm.scheduleType === 'CLINIC' && createForm.autoSplit) {
                // Auto-split logic (30 mins each)
                let currentStart = new Date(shiftStart);
                const end = new Date(shiftEnd);
                const promises = [];
                
                while (currentStart < end) {
                    let nextEnd = new Date(currentStart.getTime() + 30 * 60000); // +30 mins
                    if (nextEnd > end) nextEnd = end;
                    
                    const formatTimeStr = (d) => d.toTimeString().slice(0, 5);
                    const chunkPayload = {
                        date: createForm.date,
                        startTime: formatTimeStr(currentStart),
                        endTime: formatTimeStr(nextEnd),
                        maxPatient: parseInt(createForm.maxPatient, 10),
                        scheduleType: 'CLINIC',
                        forceAssign: createForm.forceAssign
                    };
                    
                    if (createForm.doctorId) {
                        promises.push(createSchedule(createForm.doctorId, chunkPayload));
                    } else {
                        promises.push(createOpenSchedule(chunkPayload));
                    }
                    
                    currentStart = nextEnd;
                }
                
                await Promise.all(promises);
            } else {
                // Normal creation
                const payload = {
                    date: createForm.date,
                    startTime: createForm.startTime,
                    endTime: createForm.endTime,
                    maxPatient: parseInt(createForm.maxPatient, 10),
                    scheduleType: createForm.scheduleType,
                    forceAssign: createForm.forceAssign
                };
                if (createForm.doctorId) {
                    await createSchedule(createForm.doctorId, payload);
                } else {
                    await createOpenSchedule(payload);
                }
            }
            
            setIsCreateModalOpen(false);
            fetchSchedules();
        } catch (error) {
            console.error("Failed to create schedule", error);
            const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
            alert("Tạo lịch thất bại: " + errMsg);
        }
    };

    const openEditModal = (sch) => {
        setEditForm({
            id: sch.id,
            date: sch.date,
            startTime: sch.startTime,
            endTime: sch.endTime,
            maxPatient: sch.maxPatient
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateShift = async (e) => {
        e.preventDefault();
        
        const shiftStart = new Date(`${editForm.date}T${editForm.startTime}`);
        const shiftEnd = new Date(`${editForm.date}T${editForm.endTime}`);

        if (shiftStart >= shiftEnd) {
            alert("Giờ bắt đầu phải nhỏ hơn giờ kết thúc!");
            return;
        }

        if (new Date() > shiftStart) {
            alert(`Ca khám (${editForm.date} ${editForm.startTime}) đã qua thời gian bắt đầu!`);
            return;
        }

        try {
            await updateScheduleInfo(editForm.id, {
                date: editForm.date,
                startTime: editForm.startTime,
                endTime: editForm.endTime,
                maxPatient: parseInt(editForm.maxPatient, 10)
            });
            setIsEditModalOpen(false);
            fetchSchedules();
            alert("Cập nhật thông tin ca khám thành công!");
        } catch (error) {
            console.error("Failed to update schedule info", error);
            const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
            alert("Cập nhật thất bại: " + errMsg);
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

    const filteredSchedules = schedules.filter(sch => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            (sch.doctorName && sch.doctorName.toLowerCase().includes(lowerTerm)) ||
            (sch.doctorId && sch.doctorId.toString().includes(lowerTerm)) ||
            (sch.startTime && sch.startTime.includes(lowerTerm)) ||
            (sch.endTime && sch.endTime.includes(lowerTerm))
        );
    });

    return (
        <div style={{ padding: '1rem' }}>
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Quản Lý Lịch Khám Bác Sĩ (Schedules)</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                        Tạo ca khám với trạng thái <strong style={{ color: '#4b5563' }}>OPEN</strong> để bác sĩ xác nhận đăng ký ca trực.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

                    <button
                        onClick={() => {
                            setCreateForm(prev => ({
                                ...prev,
                                doctorId: selectedDoctorId || '',
                                date: selectedDate,
                                scheduleType: 'CLINIC',
                                autoSplit: false,
                                forceAssign: false,
                                maxPatient: 10
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
                    <label style={{ fontSize: '0.9rem', color: '#4b5563' }}>Tìm kiếm:</label>
                    <input
                        type="text"
                        placeholder="Từ khóa (Tên BS, ID, Giờ...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '220px' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#4b5563' }}>Ngày khám:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                    <button
                        onClick={() => setSelectedDate('')}
                        style={{ padding: '0.5rem 0.8rem', backgroundColor: selectedDate === '' ? '#3b82f6' : '#f3f4f6', color: selectedDate === '' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        title="Xem tất cả lịch của các ngày"
                    >
                        Xem tất cả
                    </button>
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
                ) : filteredSchedules.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                        <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>Không tìm thấy ca khám {selectedDate ? 'vào ngày ' + selectedDate : 'nào'}</div>
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Hãy bấm nút "Tạo ca khám mới" hoặc thử thay đổi từ khóa.</div>
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
                            {filteredSchedules.map((sch) => (
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
                                        {sch.scheduleType === 'HOME' && (
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>🏠 Khám tại nhà</span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            {sch.status === 'OPEN' && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(sch)}
                                                        style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                    >
                                                        Sửa thông tin
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(sch.id, 'AVAILABLE')}
                                                        style={{ padding: '0.35rem 0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                    >
                                                        Duyệt ca (Set Available)
                                                    </button>
                                                </>
                                            )}
                                            {sch.status !== 'CANCELLED' && sch.status !== 'COMPLETED' && sch.status !== 'IN_PROGRESS' && (
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
                                    <label>Loại ca làm (Nơi làm việc) <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        className="form-control"
                                        value={createForm.scheduleType}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            // Check if current doctor supports the new type
                                            const currentDoc = doctors.find(d => d.id == createForm.doctorId);
                                            let newDoctorId = createForm.doctorId;
                                            if (currentDoc) {
                                                if (newType === 'HOME' && !currentDoc.canHomeVisit) newDoctorId = '';
                                                if (newType === 'CLINIC' && !currentDoc.canClinicVisit) newDoctorId = '';
                                            }
                                            
                                            setCreateForm({
                                                ...createForm, 
                                                scheduleType: newType,
                                                doctorId: newDoctorId,
                                                autoSplit: newType === 'HOME' ? false : createForm.autoSplit,
                                                maxPatient: 1
                                            });
                                        }}
                                    >
                                        <option value="CLINIC">Khám tại phòng khám (CLINIC)</option>
                                        <option value="HOME">Khám tại nhà (HOME)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Gán Bác Sĩ (Tùy chọn)</label>
                                    <select
                                        className="form-control"
                                        value={createForm.doctorId}
                                        onChange={(e) => setCreateForm({...createForm, doctorId: e.target.value})}
                                    >
                                        <option value="">-- Ca Mở (Chưa gán bác sĩ - Chờ bác sĩ đăng ký) --</option>
                                        {doctors.filter(doc => {
                                            if (doc.status !== 'ACTIVE') return false;
                                            if (createForm.scheduleType === 'HOME' && !doc.canHomeVisit) return false;
                                            if (createForm.scheduleType === 'CLINIC' && !doc.canClinicVisit) return false;
                                            return true;
                                        }).map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.fullName} ({doc.specialtyName})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {createForm.doctorId && (
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e0e7ff', padding: '0.75rem', borderRadius: '6px' }}>
                                        <input
                                            type="checkbox"
                                            id="forceAssign"
                                            checked={createForm.forceAssign}
                                            onChange={(e) => setCreateForm({...createForm, forceAssign: e.target.checked})}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="forceAssign" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', color: '#3730a3' }}>
                                            Gán trực tiếp cho bác sĩ (Không cần xác nhận)
                                        </label>
                                    </div>
                                )}

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



                                {createForm.scheduleType === 'CLINIC' && (
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '6px' }}>
                                        <input
                                            type="checkbox"
                                            id="autoSplit"
                                            checked={createForm.autoSplit}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setCreateForm({
                                                    ...createForm,
                                                    autoSplit: isChecked,
                                                    maxPatient: 1
                                                })
                                            }}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="autoSplit" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>Tự động sinh ca nhỏ mỗi 30 phút</label>
                                    </div>
                                )}

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
                                    <strong>Ghi chú:</strong> {createForm.forceAssign ? 'Ca khám sẽ được gán trực tiếp cho bác sĩ với trạng thái AVAILABLE.' : 'Ca khám mới tạo sẽ có trạng thái ban đầu là OPEN để bác sĩ đăng ký nhận ca.'}
                                </div>
                            </div>

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>{createForm.forceAssign ? 'Tạo Ca Khám (AVAILABLE)' : 'Tạo Ca Khám (OPEN)'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Schedule Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Cập Nhật Thông Tin Ca Khám</h3>
                            <button className="btn-close" onClick={() => setIsEditModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdateShift}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                                
                                <div className="form-group">
                                    <label>Ngày khám <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="date"
                                        required
                                        className="form-control"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Giờ bắt đầu <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="time"
                                            required
                                            className="form-control"
                                            value={editForm.startTime}
                                            onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Giờ kết thúc <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="time"
                                            required
                                            className="form-control"
                                            value={editForm.endTime}
                                            onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
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
                                        value={editForm.maxPatient}
                                        onChange={(e) => setEditForm({...editForm, maxPatient: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>Lưu Thay Đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSchedulePage;
