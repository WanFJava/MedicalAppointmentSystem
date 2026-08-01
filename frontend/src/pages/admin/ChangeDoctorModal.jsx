import React, { useState, useEffect } from 'react';
import { getDoctors } from '../../api/adminApi';
import { getAllSchedules, changeAppointmentSchedule } from '../../api/appointmentApi';

const ChangeDoctorModal = ({ appointment, onClose, onSuccess }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedules, setSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctorId && selectedDate) {
            fetchSchedules();
        } else {
            setSchedules([]);
        }
    }, [selectedDoctorId, selectedDate]);

    const fetchDoctors = async () => {
        try {
            const docs = await getDoctors();
            setDoctors(docs.filter(d => d.status === 'ACTIVE'));
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const data = await getAllSchedules(selectedDate, selectedDoctorId);
            // Only show available schedules that are not full
            setSchedules(data.filter(s => s.status === 'AVAILABLE' && s.currentPatient < s.maxPatient));
            setSelectedScheduleId('');
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedScheduleId) {
            alert("Vui lòng chọn một ca khám khả dụng!");
            return;
        }

        try {
            await changeAppointmentSchedule(appointment.id, selectedScheduleId);
            alert("Đổi bác sĩ và ca khám thành công!");
            onSuccess();
        } catch (error) {
            console.error("Failed to change schedule", error);
            const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
            alert("Lỗi: " + errMsg);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3 style={{ margin: 0 }}>Thay Đổi Bác Sĩ / Ca Khám</h3>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Thông tin lịch hẹn hiện tại:</div>
                        <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                            <div><strong>Bệnh nhân:</strong> {appointment.patientName}</div>
                            <div><strong>Bác sĩ cũ:</strong> {appointment.doctorName}</div>
                            <div><strong>Khung giờ cũ:</strong> {appointment.timeSlot} ngày {appointment.scheduleDate}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 'bold' }}>1. Chọn Bác Sĩ Mới <span style={{ color: 'red' }}>*</span></label>
                            <select
                                className="form-control"
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                required
                            >
                                <option value="">-- Chọn Bác sĩ --</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.fullName} ({doc.specialtyName})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedDoctorId && (
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold' }}>2. Chọn Ngày Khám <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {selectedDoctorId && selectedDate && (
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold' }}>3. Chọn Ca Khám <span style={{ color: 'red' }}>*</span></label>
                                {loading ? (
                                    <div style={{ padding: '0.5rem', color: '#64748b' }}>Đang tải danh sách ca khám...</div>
                                ) : schedules.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {schedules.map(s => (
                                            <label 
                                                key={s.id} 
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.5rem', 
                                                    padding: '0.75rem', 
                                                    border: `1px solid ${selectedScheduleId === String(s.id) ? '#3b82f6' : '#e2e8f0'}`,
                                                    borderRadius: '6px',
                                                    backgroundColor: selectedScheduleId === String(s.id) ? '#eff6ff' : 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="schedule"
                                                    value={s.id}
                                                    checked={selectedScheduleId === String(s.id)}
                                                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                                                    required
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{s.startTime} - {s.endTime}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sức chứa: {s.currentPatient}/{s.maxPatient}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '0.9rem' }}>
                                        Không có ca khám khả dụng (hoặc đã đầy) cho bác sĩ này vào ngày đã chọn. Vui lòng chọn ngày hoặc bác sĩ khác.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
                            <button type="submit" className="btn-primary" disabled={!selectedScheduleId}>Lưu Thay Đổi</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangeDoctorModal;
