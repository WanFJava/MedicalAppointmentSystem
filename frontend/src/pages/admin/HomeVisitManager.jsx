import React, { useState, useEffect } from 'react';
import { bookHomeVisit, getAllAppointments, updateAppointmentStatus, getAvailableSchedules, confirmHomeVisit } from '../../api/appointmentApi';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');

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
        const result = await Swal.fire({
            title: 'Hủy lịch hẹn?',
            text: 'Bạn có chắc muốn hủy lịch này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await updateAppointmentStatus(id, 'CANCELLED_BY_PATIENT');
                toast.success('Đã hủy lịch hẹn');
                fetchAppointments();
            } catch (error) {
                toast.error('Lỗi khi hủy lịch hẹn');
            }
        }
    };

    const handleConfirmHomeVisit = async (apt) => {
        const defaultTime = apt.expectedTime ? apt.expectedTime.split(' - ')[0].trim() : '';
        const { value: formValues } = await Swal.fire({
            title: 'Xác nhận Khám tại nhà',
            html: `
                <div style="text-align: left;">
                    <p style="margin-bottom: 5px;"><strong>Bệnh nhân mong muốn:</strong> ${apt.expectedTime || 'Không rõ'}</p>
                    <p style="margin-bottom: 5px;"><strong>Địa chỉ:</strong> ${apt.homeAddress || 'Không rõ'}</p>
                    <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;" />
                    <label for="exactTime" style="display: block; margin-bottom: 5px; font-weight: bold;">Giờ đến dự kiến chính xác <span style="color:red">*</span>:</label>
                    <input type="time" id="exactTime" value="${defaultTime}" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 15px; font-size: 16px;">
                    
                    <label for="distanceFee" style="display: block; margin-bottom: 5px; font-weight: bold;">Khoảng cách di chuyển <span style="color:red">*</span>:</label>
                    <select id="distanceFee" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 16px;">
                        <option value="50000">0 - 5 km (Phí: 50.000 VNĐ)</option>
                        <option value="80000">Trên 5 - 10 km (Phí: 80.000 VNĐ)</option>
                        <option value="120000">Trên 10 - 15 km (Phí: 120.000 VNĐ)</option>
                        <option value="REJECT">Trên 15 km (Từ chối phục vụ)</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Đóng',
            preConfirm: () => {
                const exactTime = document.getElementById('exactTime').value;
                const distanceFee = document.getElementById('distanceFee').value;
                
                if (distanceFee !== 'REJECT' && !exactTime) {
                    Swal.showValidationMessage('Vui lòng nhập Giờ đến dự kiến!');
                    return false;
                }
                return { exactTime, distanceFee };
            }
        });

        if (formValues) {
            try {
                if (formValues.distanceFee === 'REJECT') {
                    // Call the new API to decline
                    const { declineHomeVisitOutOfRange } = await import('../../api/appointmentApi');
                    await declineHomeVisitOutOfRange(apt.id);
                    Swal.fire('Đã từ chối', 'Đã từ chối phục vụ do ngoài phạm vi 15km.', 'info');
                } else {
                    await confirmHomeVisit(apt.id, formValues.exactTime, formValues.distanceFee);
                    Swal.fire('Thành công', `Đã xác nhận giờ đến lúc ${formValues.exactTime} và tính phí di chuyển.`, 'success');
                }
                fetchAppointments();
            } catch (error) {
                Swal.fire('Lỗi', `Xác nhận thất bại: ${error.response?.data?.message || error.message}`, 'error');
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
            'PENDING': { text: 'Chờ Xử Lý', color: '#f59e0b' },
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

    const filteredAppointments = appointments.filter(app => 
        (app.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (app.doctorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (app.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#1e293b', fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin color="#4f46e5" size={32} /> Quản lý Khám Tại Nhà
                </h2>
            </div>
            
            <div style={{ marginBottom: '30px', display: 'inline-flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '12px' }}>
                <button 
                    onClick={() => setActiveTab('list')}
                    style={{ 
                        padding: '10px 24px', 
                        backgroundColor: activeTab === 'list' ? 'white' : 'transparent', 
                        color: activeTab === 'list' ? '#3b82f6' : '#64748b', 
                        border: 'none', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        fontWeight: 700,
                        fontSize: '15px',
                        boxShadow: activeTab === 'list' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                    }}>
                    Danh sách Lịch hẹn
                </button>
                <button 
                    onClick={() => setActiveTab('create')}
                    style={{ 
                        padding: '10px 24px', 
                        backgroundColor: activeTab === 'create' ? 'white' : 'transparent', 
                        color: activeTab === 'create' ? '#3b82f6' : '#64748b', 
                        border: 'none', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        fontWeight: 700,
                        fontSize: '15px',
                        boxShadow: activeTab === 'create' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                    }}>
                    Tạo Lịch Mới
                </button>
            </div>

            {activeTab === 'list' ? (
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
                    <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '500px' }}>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ, trạng thái..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '12px 16px 12px 40px', 
                                width: '100%', 
                                borderRadius: '12px', 
                                border: '2px solid #e2e8f0',
                                outline: 'none',
                                fontSize: '15px',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#93c5fd'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                    </div>
                    {loading ? <p style={{ color: '#64748b' }}>Đang tải dữ liệu...</p> : (
                        <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Bệnh nhân</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Bác sĩ</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Thời gian</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Trạng thái</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map(app => (
                                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            <strong style={{ color: '#1e293b', fontSize: '15px' }}>{app.patientName}</strong><br/>
                                            <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <MapPin size={14}/> {app.homeAddress}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top', color: '#334155', fontWeight: 500 }}>{app.doctorName}</td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            {app.scheduleDate} <br/> <span style={{ color: '#64748b', fontSize: '13px' }}>Ca: {app.timeSlot}</span>
                                            <div style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 600, marginTop: '6px', backgroundColor: '#eef2ff', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                Dự kiến đến: {app.expectedTime || 'Chưa chốt'}
                                            </div>
                                            {app.travelFee > 0 && (
                                                <div style={{ marginTop: '6px', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                                                    + Phí di chuyển: {app.travelFee.toLocaleString('vi-VN')}đ
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            {getStatusLabel(app.status)}
                                        </td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {(app.status === 'PENDING' || app.status === 'PENDING_CONFIRMATION' || app.status === 'DECLINED') && (
                                                <>
                                                    <button onClick={() => handleConfirmHomeVisit(app)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle size={14} /> Xác nhận
                                                    </button>
                                                    <button onClick={() => handleCancel(app.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                                                </>
                                            )}
                                            {['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(app.status) && (
                                                <button onClick={() => handleDoctorAbsent(app.id)} title="Đánh vắng bác sĩ" style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <AlertTriangle size={14} /> Bác sĩ vắng
                                                </button>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAppointments.length === 0 && (
                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', maxWidth: '900px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ gridColumn: '1 / -1' }}><h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', color: '#1e293b', fontSize: '1.25rem' }}>1. Thông tin bệnh nhân</h3></div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155' }}>Chọn bệnh nhân <span style={{color:'#ef4444'}}>*</span></label>
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm bệnh nhân (tên hoặc SĐT)..." 
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                style={{ border: '2px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', width: '100%', marginBottom: '12px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#93c5fd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
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
                                {patients
                                    .filter(p => p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) || (p.phone && p.phone.includes(patientSearch)))
                                    .map(p => <option key={p.id} value={p.id}>{p.fullName} - {p.phone}</option>)}
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

                        <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}><h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', color: '#1e293b', fontSize: '1.25rem' }}>2. Thông tin lịch khám</h3></div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155' }}>Chuyên khoa <span style={{color:'#ef4444'}}>*</span></label>
                            <select required value={formData.specialtyId} onChange={handleSpecialtyChange} style={{ border: '2px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', width: '100%', outline: 'none' }}>
                                <option value="">-- Chọn chuyên khoa --</option>
                                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155' }}>Bác sĩ <span style={{color:'#ef4444'}}>*</span></label>
                            {formData.specialtyId && (
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm bác sĩ..." 
                                    value={doctorSearch}
                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                    style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%', marginBottom: '10px' }}
                                />
                            )}
                            <select required value={formData.doctorId} onChange={e => {
                                setFormData({...formData, doctorId: e.target.value, scheduleId: ''});
                                handleDoctorDateChange(e.target.value, formData.date);
                            }} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', width: '100%' }} disabled={!formData.specialtyId}>
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctors
                                    .filter(d => d.fullName.toLowerCase().includes(doctorSearch.toLowerCase()))
                                    .map(d => <option key={d.id} value={d.id}>{d.fullName}</option>)}
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
