import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctors, createDoctor, updateDoctor, updateDoctorStatus, getSpecialties } from '../../api/adminApi';
import { Edit2, Plus, X, Calendar, Power } from 'lucide-react';

const DoctorManager = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ userId: '', email: '', password: '', fullName: '', phone: '', specialtyId: '', degree: '', experience: 0, consultationFee: 0, biography: '', status: 'ACTIVE', canClinicVisit: true, canHomeVisit: false, homeVisitRadius: 0 });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visitTypeFilter, setVisitTypeFilter] = useState('ALL');

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
                status: doctor.status || 'ACTIVE',
                canClinicVisit: doctor.canClinicVisit !== undefined ? doctor.canClinicVisit : true,
                canHomeVisit: doctor.canHomeVisit || false,
                homeVisitRadius: doctor.homeVisitRadius || 0
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
                status: 'ACTIVE',
                canClinicVisit: true,
                canHomeVisit: false,
                homeVisitRadius: 0
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
            userId: formData.userId ? parseInt(formData.userId, 10) : null,
            canClinicVisit: formData.canClinicVisit,
            canHomeVisit: formData.canHomeVisit,
            homeVisitRadius: parseFloat(formData.homeVisitRadius) || 0
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

    if (loading) return <div>Đang tải...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý Bác sĩ</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <select
                        value={visitTypeFilter}
                        onChange={(e) => setVisitTypeFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', outline: 'none' }}
                    >
                        <option value="ALL">Tất cả hình thức</option>
                        <option value="HOME">Chỉ Khám tại nhà</option>
                        <option value="CLINIC">Chỉ Khám tại trung tâm</option>
                        <option value="BOTH">Hỗ trợ cả hai</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bác sĩ hoặc chuyên khoa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', minWidth: '250px' }}
                    />
                    <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Thêm bác sĩ
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Bác sĩ</th>
                            <th>Chuyên khoa</th>
                            <th>Bằng cấp</th>
                            <th>Kinh nghiệm</th>
                            <th>Phí khám</th>
                            <th>Hình thức khám</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.filter(doc => {
                            const matchSearch = (doc.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (doc.specialtyName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                            let matchType = true;
                            if (visitTypeFilter === 'HOME') matchType = doc.canHomeVisit && !doc.canClinicVisit;
                            else if (visitTypeFilter === 'CLINIC') matchType = doc.canClinicVisit && !doc.canHomeVisit;
                            else if (visitTypeFilter === 'BOTH') matchType = doc.canClinicVisit && doc.canHomeVisit;
                            return matchSearch && matchType;
                        }).map((doc) => {
                            // Determine row style based on visit type
                            let rowStyle = {};
                            if (doc.canHomeVisit && !doc.canClinicVisit) {
                                rowStyle = { backgroundColor: '#f0fdf4', borderLeft: '4px solid #166534' };
                            } else if (doc.canClinicVisit && !doc.canHomeVisit) {
                                rowStyle = { backgroundColor: '#f5f3ff', borderLeft: '4px solid #4f46e5' };
                            } else if (doc.canClinicVisit && doc.canHomeVisit) {
                                rowStyle = { backgroundColor: '#fffbeb', borderLeft: '4px solid #d97706' };
                            }

                            return (
                            <tr key={doc.id} style={rowStyle}>
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
                                <td>{doc.experience} năm</td>
                                <td>{doc.consultationFee} VNĐ</td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {doc.canClinicVisit && (
                                            <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', width: 'fit-content' }}>
                                                Khám tại trung tâm
                                            </span>
                                        )}
                                        {doc.canHomeVisit && (
                                            <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', width: 'fit-content' }}>
                                                Khám tại nhà
                                            </span>
                                        )}
                                    </div>
                                </td>
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
                        )})}
                        {doctors.filter(doc => {
                            const matchSearch = (doc.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (doc.specialtyName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
                            let matchType = true;
                            if (visitTypeFilter === 'HOME') matchType = doc.canHomeVisit && !doc.canClinicVisit;
                            else if (visitTypeFilter === 'CLINIC') matchType = doc.canClinicVisit && !doc.canHomeVisit;
                            else if (visitTypeFilter === 'BOTH') matchType = doc.canClinicVisit && doc.canHomeVisit;
                            return matchSearch && matchType;
                        }).length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy bác sĩ nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Cập nhật Bác sĩ' : 'Thêm Bác sĩ mới'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {!editingId && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Họ và tên</label>
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
                                        <label>Số điện thoại</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu</label>
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
                                    <label>Chuyên khoa</label>
                                    <select
                                        className="form-control"
                                        value={formData.specialtyId}
                                        onChange={(e) => setFormData({...formData, specialtyId: e.target.value})}
                                        required
                                    >
                                        <option value="" disabled>Chọn chuyên khoa</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bằng cấp</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.degree}
                                        onChange={(e) => setFormData({...formData, degree: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kinh nghiệm (Năm)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.experience}
                                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phí khám</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.consultationFee}
                                        onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái tài khoản</label>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="canClinicVisit"
                                        checked={formData.canClinicVisit}
                                        onChange={(e) => setFormData({...formData, canClinicVisit: e.target.checked})}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <label htmlFor="canClinicVisit" style={{ margin: 0, cursor: 'pointer' }}>Khám tại phòng khám</label>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="canHomeVisit"
                                        checked={formData.canHomeVisit}
                                        onChange={(e) => setFormData({...formData, canHomeVisit: e.target.checked})}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <label htmlFor="canHomeVisit" style={{ margin: 0, cursor: 'pointer' }}>Khám tại nhà</label>
                                </div>
                                {formData.canHomeVisit && (
                                    <div className="form-group">
                                        <label>Bán kính phục vụ (km)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={formData.homeVisitRadius}
                                            onChange={(e) => setFormData({...formData, homeVisitRadius: e.target.value})}
                                            placeholder="Ví dụ: 10"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Tiểu sử</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    value={formData.biography}
                                    onChange={(e) => setFormData({...formData, biography: e.target.value})}
                                    placeholder="Enter doctor's biography..."
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Lưu bác sĩ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorManager;
