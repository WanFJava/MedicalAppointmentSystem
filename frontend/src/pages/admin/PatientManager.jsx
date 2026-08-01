import React, { useState, useEffect } from 'react';
import { getAllPatients, createPatient, updatePatientProfile } from '../../api/patientApi';
import { getPatientAppointments } from '../../api/appointmentApi';
import { Search, Plus, Edit, Calendar, User, Phone, Mail, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

const PatientManager = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        gender: 'MALE',
        birthday: '',
        address: ''
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const data = await getAllPatients();
            setPatients(data);
        } catch (error) {
            console.error("Error fetching patients", error);
            Swal.fire('Lỗi', 'Không thể tải danh sách bệnh nhân', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredPatients = patients.filter(p =>
        (p.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phone && p.phone.includes(searchTerm)) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleEdit = (patient) => {
        setIsEditing(true);
        setFormData({
            userId: patient.userId,
            fullName: patient.fullName || '',
            email: patient.email || '',
            phone: patient.phone || '',
            gender: patient.gender || 'MALE',
            birthday: patient.birthday || '',
            address: patient.address || ''
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setIsEditing(false);
        setFormData({
            userId: '',
            fullName: '',
            email: '',
            phone: '',
            password: '',
            gender: 'MALE',
            birthday: '',
            address: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updatePatientProfile(formData.userId, formData);
                Swal.fire('Thành công', 'Cập nhật thông tin bệnh nhân thành công', 'success');
            } else {
                if (!formData.password) {
                    Swal.fire('Lỗi', 'Vui lòng nhập mật khẩu cho tài khoản mới', 'error');
                    return;
                }
                await createPatient(formData);
                Swal.fire('Thành công', 'Tạo tài khoản bệnh nhân thành công', 'success');
            }
            setShowModal(false);
            fetchPatients();
        } catch (error) {
            console.error("Error saving patient", error);
            Swal.fire('Lỗi', error.response?.data?.message || 'Không thể lưu thông tin bệnh nhân', 'error');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading patients...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Quản lý Bệnh nhân</h2>
                <button className="btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Thêm Bệnh nhân
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, email, sđt..."
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                    />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Họ Tên</th>
                            <th>Liên hệ</th>
                            <th>Thông tin cơ bản</th>
                            <th>Lịch sử khám</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(p => (
                            <tr key={p.userId}>
                                <td>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{p.fullName}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Phone size={14} color="#6b7280" /> {p.phone || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Mail size={14} color="#6b7280" /> {p.email}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                        Giới tính: {p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                        Ngày sinh: {p.birthday || 'Chưa cập nhật'}
                                    </div>
                                </td>
                                <td>
                                    <button 
                                        onClick={async () => {
                                            setHistoryLoading(true);
                                            setShowHistoryModal(true);
                                            try {
                                                const history = await getPatientAppointments(p.userId);
                                                setSelectedPatientHistory(history || []);
                                            } catch (error) {
                                                console.error("Failed to load history", error);
                                                Swal.fire('Lỗi', 'Không thể tải lịch sử khám', 'error');
                                            } finally {
                                                setHistoryLoading(false);
                                            }
                                        }}
                                        style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.25rem', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        <Clock size={14} /> Xem
                                    </button>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(p)}
                                        style={{ padding: '0.5rem', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        <Edit size={16} /> Sửa
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPatients.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy bệnh nhân nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Sửa thông tin bệnh nhân' : 'Thêm bệnh nhân mới'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Họ và tên *</label>
                                    <input
                                        type="text" className="form-control" required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Số điện thoại *</label>
                                    <input
                                        type="text" className="form-control" required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email * (Dùng để đăng nhập)</label>
                                    <input
                                        type="email" className="form-control" required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={isEditing}
                                    />
                                </div>
                                {!isEditing && (
                                    <div className="form-group">
                                        <label>Mật khẩu *</label>
                                        <input
                                            type="password" className="form-control" required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Giới tính</label>
                                    <select
                                        className="form-control"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date" className="form-control"
                                        value={formData.birthday}
                                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Địa chỉ</label>
                                    <input
                                        type="text" className="form-control"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn-primary">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h2>Lịch sử khám bệnh</h2>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {historyLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                            ) : selectedPatientHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chưa có lịch sử khám bệnh.</div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Ngày khám</th>
                                                <th>Giờ khám</th>
                                                <th>Bác sĩ</th>
                                                <th>Triệu chứng</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPatientHistory.map(apt => (
                                                <tr key={apt.id}>
                                                    <td>{apt.scheduleDate}</td>
                                                    <td>{apt.timeSlot}</td>
                                                    <td>{apt.doctorName}</td>
                                                    <td>{apt.symptom}</td>
                                                    <td>
                                                        <span style={{ 
                                                            padding: '0.25rem 0.5rem', 
                                                            borderRadius: '9999px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 'bold',
                                                            backgroundColor: apt.status === 'COMPLETED' ? '#dcfce7' : 
                                                                           apt.status === 'PENDING' ? '#fef3c7' : '#f1f5f9',
                                                            color: apt.status === 'COMPLETED' ? '#166534' : 
                                                                   apt.status === 'PENDING' ? '#92400e' : '#475569'
                                                        }}>
                                                            {apt.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
                            <button className="btn-secondary" onClick={() => setShowHistoryModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientManager;
