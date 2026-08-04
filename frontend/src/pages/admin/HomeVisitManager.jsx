import React, { useState, useEffect } from 'react';
import { bookHomeVisit, getAllAppointments, updateAppointmentStatus, getAvailableSchedules } from '../../api/appointmentApi';
import { getSpecialties, getDoctors } from '../../api/adminApi';
import { getAllPatients } from '../../api/patientApi';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, User, Phone, Stethoscope, Clock, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const HomeVisitManager = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [appointments, setAppointments] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        patientPhone: '',
        patientDob: '',
        patientAddress: '',
        symptom: '',
        homeAddress: '',
        travelFee: 50,
        note: '',
        specialtyId: '',
        doctorId: '',
        date: '',
        scheduleId: ''
    });

    useEffect(() => {
        if (activeTab === 'list') {
            fetchAppointments();
        } else {
            fetchFormData();
        }
    }, [activeTab]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await getAllAppointments();
            setAppointments(data.filter(a => a.visitType === 'HOME_VISIT'));
        } catch (error) {
            toast.error("Lỗi khi tải danh sách lịch khám tại nhà");
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        try {
            const [specData, patData] = await Promise.all([
                getSpecialties(),
                getAllPatients()
            ]);
            setSpecialties(specData);
            setPatients(patData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleSpecialtyChange = async (e) => {
        const specialtyId = e.target.value;
        setFormData({ ...formData, specialtyId, doctorId: '', scheduleId: '' });
        setSchedules([]);
        if (specialtyId) {
            try {
                const allDocs = await getDoctors();
                const docs = allDocs.filter(d => String(d.specialtyId) === String(specialtyId));
                setDoctors(docs);
            } catch (error) {
                console.error("Error fetching doctors:", error);
            }
        } else {
            setDoctors([]);
        }
    };

    const handleDoctorDateChange = async (doctorId, date) => {
        if (doctorId && date) {
            try {
                const availableSchedules = await getAvailableSchedules(doctorId, date);
                setSchedules(availableSchedules);
            } catch (error) {
                console.error("Error fetching schedules:", error);
                setSchedules([]);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.patientId) return toast.error("Vui lòng chọn hoặc thêm bệnh nhân mới");
        if (formData.patientId === 'NEW') {
            if (!formData.patientName) return toast.error("Vui lòng nhập tên bệnh nhân");
            if (!formData.patientPhone) return toast.error("Vui lòng nhập số điện thoại");
        }
        if (!formData.specialtyId) return toast.error("Vui lòng chọn chuyên khoa");
        if (!formData.doctorId) return toast.error("Vui lòng chọn bác sĩ");
        if (!formData.date) return toast.error("Vui lòng chọn ngày khám");
        if (!formData.scheduleId) return toast.error("Vui lòng chọn giờ khám");
        if (!formData.homeAddress) return toast.error("Vui lòng nhập địa chỉ đến khám");
        if (!formData.symptom) return toast.error("Vui lòng nhập triệu chứng");

        try {
            const payload = { ...formData };
            if (payload.patientId === 'NEW') {
                payload.patientId = null;
            }
            await bookHomeVisit(payload);
            toast.success("Tạo lịch khám tại nhà thành công!");
            setActiveTab('list');
            setFormData({
                patientId: '', patientName: '', patientPhone: '', patientDob: '', patientAddress: '',
                symptom: '', homeAddress: '', travelFee: 50, note: '',
                specialtyId: '', doctorId: '', date: '', scheduleId: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo lịch");
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm("Bạn có chắc muốn hủy lịch này?")) {
            try {
                await updateAppointmentStatus(id, 'CANCELLED_BY_DOCTOR');
                toast.success("Đã hủy lịch");
                fetchAppointments();
            } catch (error) {
                toast.error("Lỗi khi hủy lịch");
            }
        }
    };

    const handleDoctorAbsent = async (id) => {
        const result = await Swal.fire({
            title: 'Đánh vắng bác sĩ?',
            text: 'Bạn có chắc chắn bác sĩ không đến ca khám này? Lịch hẹn sẽ bị hủy.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await updateAppointmentStatus(id, 'NO_SHOW_BY_DOCTOR');
                toast.success('Đã cập nhật trạng thái vắng mặt cho bác sĩ');
                fetchAppointments();
            } catch (error) {
                toast.error('Lỗi khi đánh vắng bác sĩ');
            }
        }
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'PENDING_CONFIRMATION': { text: 'Chờ BS Xác Nhận', color: '#f59e0b' },
            'CONFIRMED': { text: 'Đã Xác Nhận', color: '#10b981' },
            'DECLINED': { text: 'BS Từ Chối', color: '#ef4444' },
            'ON_THE_WAY': { text: 'Đang Di Chuyển', color: '#3b82f6' },
            'ARRIVED': { text: 'Đã Đến Nơi', color: '#6366f1' },
            'IN_PROGRESS': { text: 'Đang Khám', color: '#8b5cf6' },
            'COMPLETED': { text: 'Hoàn Thành', color: '#14b8a6' },
            'CANCELLED_BY_DOCTOR': { text: 'Đã Hủy', color: '#9ca3af' },
            'CANCELLED_BY_PATIENT': { text: 'BN Hủy', color: '#9ca3af' },
            'NO_SHOW_BY_DOCTOR': { text: 'BS Vắng Mặt', color: '#dc2626' },
        };
        const config = statusMap[status] || { text: status, color: '#6b7280' };
        return <span style={{ backgroundColor: config.color, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{config.text}</span>;
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Quản lý Khám Tại Nhà</h2>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setActiveTab('list')}
                    style={{ padding: '10px 20px', backgroundColor: activeTab === 'list' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'list' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Danh sách
                </button>
                <button 
                    onClick={() => setActiveTab('create')}
                    style={{ padding: '10px 20px', backgroundColor: activeTab === 'create' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'create' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Tạo Lịch Mới
                </button>
            </div>

            {activeTab === 'list' ? (
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {loading ? <p>Đang tải...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Bệnh nhân</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Bác sĩ</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Thời gian</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Trạng thái</th>
                                    <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(app => (
                                    <tr key={app.id}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                            <strong>{app.patientName}</strong><br/>
                                            <small style={{ color: '#64748b' }}><MapPin size={12}/> {app.homeAddress}</small>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{app.doctorName}</td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                            {app.scheduleDate} <br/> {app.timeSlot}
                                            {app.travelFee > 0 && (
                                                <div style={{ marginTop: '4px', fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>
                                                    + Phí di chuyển: {app.travelFee.toLocaleString('vi-VN')}đ
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                            {getStatusLabel(app.status)}
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                                            {(app.status === 'PENDING_CONFIRMATION' || app.status === 'DECLINED') && (
                                                <button onClick={() => handleCancel(app.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                                            )}
                                            {['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(app.status) && (
                                                <button onClick={() => handleDoctorAbsent(app.id)} title="Đánh vắng bác sĩ" style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <AlertTriangle size={14} /> Bác sĩ vắng
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {appointments.length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '800px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ gridColumn: '1 / -1' }}><h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>1. Thông tin bệnh nhân</h3></div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Chọn bệnh nhân <span style={{color:'red'}}>*</span></label>
                            <select required value={formData.patientId} onChange={e => {
                                const patId = e.target.value;
                                if (patId === 'NEW') {
                                    setFormData({...formData, patientId: 'NEW', patientName: '', patientPhone: '', patientAddress: '', patientDob: ''});
                                } else {
                                    const pat = patients.find(p => String(p.id) === String(patId));
                                    if (pat) {
                                        setFormData({...formData, patientId: patId, patientName: pat.fullName, patientPhone: pat.phone, patientAddress: pat.address || '', patientDob: pat.birthday || ''});
                                    } else {
                                        setFormData({...formData, patientId: '', patientName: '', patientPhone: '', patientAddress: '', patientDob: ''});
                                    }
                                }
                            }} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }}>
                                <option value="">-- Chọn bệnh nhân --</option>
                                <option value="NEW" style={{ fontWeight: 'bold', color: '#10b981' }}>+ Thêm bệnh nhân mới</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>)}
                            </select>
                        </div>
                        
                        {formData.patientId === 'NEW' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên bệnh nhân <span style={{color:'red'}}>*</span></label>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px' }}>
                                        <User size={18} color="#94a3b8" style={{ marginRight: '8px' }} />
                                        <input required type="text" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} style={{ border: 'none', outline: 'none', width: '100%' }} placeholder="Nhập tên" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Số điện thoại <span style={{color:'red'}}>*</span></label>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px' }}>
                                        <Phone size={18} color="#94a3b8" style={{ marginRight: '8px' }} />
                                        <input required type="text" value={formData.patientPhone} onChange={e => setFormData({...formData, patientPhone: e.target.value})} style={{ border: 'none', outline: 'none', width: '100%' }} placeholder="Nhập SĐT" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ngày sinh</label>
                                    <input type="date" value={formData.patientDob} onChange={e => setFormData({...formData, patientDob: e.target.value})} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Địa chỉ bệnh nhân (Hồ sơ)</label>
                                    <input type="text" value={formData.patientAddress} onChange={e => setFormData({...formData, patientAddress: e.target.value})} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} placeholder="Nhập địa chỉ" />
                                </div>
                            </>
                        )}

                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>2. Thông tin lịch khám</h3></div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Chuyên khoa <span style={{color:'red'}}>*</span></label>
                            <select required value={formData.specialtyId} onChange={handleSpecialtyChange} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }}>
                                <option value="">-- Chọn chuyên khoa --</option>
                                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bác sĩ <span style={{color:'red'}}>*</span></label>
                            <select required value={formData.doctorId} onChange={e => {
                                setFormData({...formData, doctorId: e.target.value, scheduleId: ''});
                                handleDoctorDateChange(e.target.value, formData.date);
                            }} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} disabled={!formData.specialtyId}>
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ngày khám <span style={{color:'red'}}>*</span></label>
                            <input required type="date" value={formData.date} onChange={e => {
                                setFormData({...formData, date: e.target.value, scheduleId: ''});
                                handleDoctorDateChange(formData.doctorId, e.target.value);
                            }} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Giờ khám (Ca làm việc) <span style={{color:'red'}}>*</span></label>
                            <select required value={formData.scheduleId} onChange={e => setFormData({...formData, scheduleId: e.target.value})} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} disabled={!formData.doctorId || !formData.date}>
                                <option value="">-- Chọn giờ --</option>
                                {schedules.map(s => <option key={s.id} value={s.id}>{s.startTime} - {s.endTime}</option>)}
                            </select>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Địa chỉ đến khám <span style={{color:'red'}}>*</span></label>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px' }}>
                                <MapPin size={18} color="#94a3b8" style={{ marginRight: '8px' }} />
                                <input required type="text" value={formData.homeAddress} onChange={e => setFormData({...formData, homeAddress: e.target.value})} style={{ border: 'none', outline: 'none', width: '100%' }} placeholder="Nhập địa chỉ nhà chi tiết" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phí di chuyển dự kiến ($)</label>
                            <input type="number" value={formData.travelFee} onChange={e => setFormData({...formData, travelFee: e.target.value})} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} />
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Triệu chứng <span style={{color:'red'}}>*</span></label>
                            <textarea required value={formData.symptom} onChange={e => setFormData({...formData, symptom: e.target.value})} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%', minHeight: '80px', fontFamily: 'inherit' }} placeholder="Mô tả triệu chứng..."></textarea>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ghi chú thêm</label>
                            <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%', minHeight: '60px', fontFamily: 'inherit' }} placeholder="Ghi chú cho bác sĩ (đường đi, lưu ý...)"></textarea>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" onClick={handleSubmit} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20}/> Tạo Lịch Khám Tại Nhà
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default HomeVisitManager;
