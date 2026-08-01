import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctors, createDoctor, updateDoctor, updateDoctorStatus, getSpecialties } from '../../api/adminApi';
import { Edit2, Plus, X, Calendar, Power } from 'lucide-react';

const DoctorManager = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ userId: '', email: '', password: '', fullName: '', phone: '', specialtyId: '', degree: '', experience: 0, consultationFee: 0, biography: '', status: 'ACTIVE' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [doctorsData, specData] = await Promise.all([
                getDoctors(),
                getSpecialties()
            ]);
            setDoctors(doctorsData);
            setSpecialties(specData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (doctor = null) => {
        if (doctor) {
            setFormData({ 
                userId: doctor.userId, 
                email: doctor.email || '',
                password: '',
                fullName: doctor.fullName || '',
                phone: doctor.phone || '',
                specialtyId: doctor.specialtyId, 
                degree: doctor.degree,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                biography: doctor.biography || '',
                status: doctor.status || 'ACTIVE'
            });
            setEditingId(doctor.id);
        } else {
            setFormData({ 
                userId: '', 
                email: '', 
                password: '', 
                fullName: '', 
                phone: '', 
                specialtyId: (specialties && specialties.length > 0) ? specialties[0].id : '', 
                degree: '', 
                experience: 0, 
                consultationFee: 0, 
                biography: '',
                status: 'ACTIVE'
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingId && (!formData.email || !formData.password || !formData.fullName)) {
            alert("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!");
            return;
        }

        if (!formData.specialtyId) {
            alert("Vui lòng chọn Chuyên khoa cho Bác sĩ!");
            return;
        }

        // Sanitize numeric and fee inputs (replace comma with dot for BigDecimal parsing)
        const sanitizedFee = parseFloat(String(formData.consultationFee).replace(',', '.')) || 0;
        const sanitizedExp = parseInt(formData.experience, 10) || 0;
        const sanitizedSpecId = parseInt(formData.specialtyId, 10);

        const payload = {
            ...formData,
            specialtyId: sanitizedSpecId,
            experience: sanitizedExp,
            consultationFee: sanitizedFee,
            userId: formData.userId ? parseInt(formData.userId, 10) : null
        };

        try {
            if (editingId) {
                await updateDoctor(editingId, payload);
            } else {
                await createDoctor(payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to save doctor", error);
            const errMsg = typeof error.response?.data === 'string'
                ? error.response.data
                : (error.response?.data?.message || error.message);
            alert("Lưu thông tin Bác sĩ thất bại: " + errMsg);
        }
    };

    const handleToggleStatus = async (doctor) => {
        const newStatus = doctor.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        const actionText = newStatus === 'ACTIVE' ? 'KÍCH HOẠT LẠI' : 'TẠM KHÓA / VÔ HIỆU HÓA';
        if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản bác sĩ "${doctor.fullName}" không?`)) {
            try {
                await updateDoctorStatus(doctor.id, newStatus);
                fetchData();
            } catch (error) {
                console.error("Failed to update doctor status", error);
                const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
                alert("Cập nhật trạng thái thất bại: " + errMsg);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Doctors Management</h2>
                <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Doctor
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Doctor</th>
                            <th>Specialty</th>
                            <th>Degree</th>
                            <th>Experience</th>
                            <th>Fee</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map((doc) => (
                            <tr key={doc.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '1rem', overflow: 'hidden', borderRadius: '50%' }}>
                                            {doc.avatar ? (
                                                <img 
                                                    src={doc.avatar} 
                                                    alt="Avatar" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName || 'D')}&background=random`; }}
                                                />
                                            ) : (
                                                doc.fullName?.charAt(0) || 'D'
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{doc.fullName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{doc.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{doc.specialtyName}</td>
                                <td>{doc.degree}</td>
                                <td>{doc.experience} years</td>
                                <td>${doc.consultationFee}</td>
                                <td>
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        backgroundColor: doc.status === 'ACTIVE' ? '#d1fae5' : (doc.status === 'LOCKED' ? '#fee2e2' : '#fef3c7'),
                                        color: doc.status === 'ACTIVE' ? '#047857' : (doc.status === 'LOCKED' ? '#b91c1c' : '#b45309'),
                                        border: `1px solid ${doc.status === 'ACTIVE' ? '#6ee7b7' : (doc.status === 'LOCKED' ? '#fca5a5' : '#fde68a')}`
                                    }}>
                                        {doc.status === 'ACTIVE' ? '● Active' : (doc.status === 'LOCKED' ? '● Locked' : '● Inactive')}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button 
                                            className="btn-secondary" 
                                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                            onClick={() => navigate(`/admin/schedules?doctorId=${doc.id}`)}
                                            title="Quản lý lịch khám bác sĩ"
                                        >
                                            <Calendar size={15} /> Lịch khám
                                        </button>
                                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(doc)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleToggleStatus(doc)}
                                            style={{
                                                padding: '0.35rem 0.6rem',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                borderRadius: '4px',
                                                border: '1px solid',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                backgroundColor: doc.status === 'ACTIVE' ? '#fef2f2' : '#ecfdf5',
                                                color: doc.status === 'ACTIVE' ? '#991b1b' : '#065f46',
                                                borderColor: doc.status === 'ACTIVE' ? '#fca5a5' : '#a7f3d0'
                                            }}
                                            title={doc.status === 'ACTIVE' ? 'Tạm khóa bác sĩ' : 'Kích hoạt bác sĩ'}
                                        >
                                            <Power size={14} /> {doc.status === 'ACTIVE' ? 'Khóa' : 'Kích hoạt'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {doctors.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No doctors found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {!editingId && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.fullName} 
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            placeholder="Dr. John Doe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input 
                                            type="email" 
                                            required 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="doctor@clinic.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input 
                                            type="tel" 
                                            required 
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input 
                                            type="password" 
                                            required 
                                            value={formData.password} 
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            placeholder="Password for login"
                                        />
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Specialty</label>
                                    <select 
                                        className="form-control"
                                        value={formData.specialtyId}
                                        onChange={(e) => setFormData({...formData, specialtyId: e.target.value})}
                                        required
                                    >
                                        <option value="" disabled>Select Specialty</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Degree</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.degree} 
                                        onChange={(e) => setFormData({...formData, degree: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Experience (Years)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.experience} 
                                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Consultation Fee</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required 
                                        value={formData.consultationFee} 
                                        onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Account Status</label>
                                    <select 
                                        className="form-control"
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="ACTIVE">ACTIVE – Đang hoạt động</option>
                                        <option value="INACTIVE">INACTIVE – Ngưng hoạt động (Có điều kiện)</option>
                                        <option value="LOCKED">LOCKED – Tạm khóa</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Biography</label>
                                <textarea 
                                    className="form-control"
                                    rows="4"
                                    value={formData.biography} 
                                    onChange={(e) => setFormData({...formData, biography: e.target.value})}
                                    placeholder="Enter doctor's biography..."
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Doctor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorManager;
