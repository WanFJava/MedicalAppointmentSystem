import React, { useState, useEffect } from 'react';
import { getSpecialties, getDoctors } from '../../api/adminApi';
import { getAvailableSchedules, bookAppointment } from '../../api/appointmentApi';
import { getAllPatients } from '../../api/patientApi';
import Swal from 'sweetalert2';

const AdminBookingModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    
    // Data
    const [patients, setPatients] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [schedulesByDate, setSchedulesByDate] = useState({});
    
    // Selections
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [symptom, setSymptom] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [pats, specs, docs] = await Promise.all([
                getAllPatients(),
                getSpecialties(),
                getDoctors()
            ]);
            setPatients(pats);
            setSpecialties(specs);
            setDoctors(docs);
        } catch (error) {
            console.error("Failed to load data", error);
            Swal.fire('Lỗi', 'Không thể tải dữ liệu', 'error');
        }
    };

    const handleDoctorSelect = async (e) => {
        const docId = e.target.value;
        setSelectedDoctor(docId);
        setSelectedSchedule('');
        setSelectedDate('');
        
        if (docId) {
            try {
                const data = await getAvailableSchedules(docId);
                const grouped = data.reduce((acc, curr) => {
                    if (!acc[curr.date]) acc[curr.date] = [];
                    acc[curr.date].push(curr);
                    return acc;
                }, {});
                setSchedulesByDate(grouped);
                const availableDates = Object.keys(grouped).sort();
                if (availableDates.length > 0) {
                    setSelectedDate(availableDates[0]);
                }
            } catch (error) {
                console.error("Failed to load schedules", error);
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedPatient || !selectedSchedule || !symptom.trim()) {
            Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin', 'warning');
            return;
        }
        
        try {
            await bookAppointment(selectedPatient, {
                doctorId: selectedDoctor,
                scheduleId: selectedSchedule,
                symptom: symptom
            });
            Swal.fire('Thành công', 'Đã đặt lịch hẹn hộ bệnh nhân', 'success');
            onSuccess();
        } catch (error) {
            console.error("Booking failed", error);
            Swal.fire('Lỗi', error.response?.data?.message || 'Không thể đặt lịch', 'error');
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        if (Array.isArray(timeStr)) return `${timeStr[0].toString().padStart(2, '0')}:${timeStr[1].toString().padStart(2, '0')}`;
        return timeStr.substring(0, 5);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="modal-header">
                    <h2>Đặt lịch khám hộ</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body" style={{ padding: '1.5rem 0' }}>
                    
                    <div className="form-group">
                        <label>Bệnh nhân *</label>
                        <select className="form-control" value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">-- Chọn bệnh nhân --</option>
                            {patients.map(p => (
                                <option key={p.userId} value={p.userId}>{p.fullName} ({p.phone})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Chuyên khoa *</label>
                        <select className="form-control" value={selectedSpec} onChange={e => { setSelectedSpec(e.target.value); setSelectedDoctor(''); setSelectedDate(''); }}>
                            <option value="">-- Chọn chuyên khoa --</option>
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedSpec && (
                        <div className="form-group">
                            <label>Bác sĩ *</label>
                            <select className="form-control" value={selectedDoctor} onChange={handleDoctorSelect}>
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctors.filter(d => d.specialtyId == selectedSpec && d.status === 'ACTIVE').map(d => (
                                    <option key={d.id} value={d.id}>{d.fullName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedDoctor && (
                        <>
                            <div className="form-group">
                                <label>Ngày khám *</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                />
                            </div>

                            {selectedDate && schedulesByDate[selectedDate] ? (
                                <div className="form-group">
                                    <label>Giờ khám *</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {schedulesByDate[selectedDate].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedSchedule(s.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    border: selectedSchedule === s.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                                    backgroundColor: selectedSchedule === s.id ? '#eff6ff' : 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {formatTime(s.startTime)} - {formatTime(s.endTime)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : selectedDate ? (
                                <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>Không có lịch vào ngày này.</p>
                            ) : null}
                        </>
                    )}

                    {selectedSchedule && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Triệu chứng / Ghi chú *</label>
                            <textarea
                                className="form-control"
                                value={symptom}
                                onChange={e => setSymptom(e.target.value)}
                                placeholder="Nhập triệu chứng..."
                                style={{ minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>
                    )}
                </div>
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={onClose}>Hủy</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={!selectedPatient || !selectedSchedule || !symptom.trim()}>
                        Xác nhận đặt lịch
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminBookingModal;
