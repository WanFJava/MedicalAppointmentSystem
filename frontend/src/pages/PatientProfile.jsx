import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPatientProfile, updatePatientProfile } from '../api/patientApi';
import { User, Mail, Phone, Calendar, MapPin, Activity, Save } from 'lucide-react';
import ChangePassword from './ChangePassword';

const PatientProfile = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState({
        fullName: '',
        phone: '',
        birthday: '',
        gender: '',
        address: '',
        bloodGroup: '',
        allergy: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!user) return;
        let isCancelled = false;
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await getPatientProfile(user.id);
                if (!isCancelled) {
                    setProfile({
                        fullName: data.fullName || '',
                        phone: data.phone || '',
                        birthday: data.birthday || '',
                        gender: data.gender || '',
                        address: data.address || '',
                        bloodGroup: data.bloodGroup || '',
                        allergy: data.allergy || ''
                    });
                }
            } catch (requestError) {
                console.error("Failed to fetch profile", requestError);
                if (!isCancelled) {
                    setMessage({ type: 'error', text: 'Tải dữ liệu hồ sơ thất bại.' });
                }
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };
        loadProfile();
        return () => {
            isCancelled = true;
        };
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });
            await updatePatientProfile(user.id, profile);
            setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
        } catch (error) {
            console.error("Failed to update profile", error);
            setMessage({ type: 'error', text: 'Cập nhật hồ sơ thất bại.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải hồ sơ...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1e293b' }}>
                        <User size={28} color="var(--primary-color)" /> Hồ sơ cá nhân
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Quản lý thông tin cá nhân và y tế của bạn.</p>
                </div>

                <div style={{ padding: '2rem' }}>
                    {message.text && (
                        <div style={{
                            padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                            color: message.type === 'success' ? '#065f46' : '#991b1b',
                            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                        }}>
                            {message.type === 'success' ? <Save size={18} /> : <Activity size={18} />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <h3 style={{ fontSize: '1.1rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1.5rem', marginTop: 0 }}>
                            Thông tin cơ bản
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={16} color="#64748b" /> Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="form-control"
                                    value={profile.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} color="#64748b" /> Email (Tài khoản đăng nhập)
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={user.email}
                                    disabled
                                    style={{ backgroundColor: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={16} color="#64748b" /> Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-control"
                                    value={profile.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={16} color="#64748b" /> Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    name="birthday"
                                    className="form-control"
                                    value={profile.birthday}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={16} color="#64748b" /> Giới tính
                                </label>
                                <select
                                    name="gender"
                                    className="form-control"
                                    value={profile.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} color="#64748b" /> Địa chỉ liên hệ
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    className="form-control"
                                    value={profile.address}
                                    onChange={handleChange}
                                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                                />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                            Thông tin y tế
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={16} color="#ef4444" /> Nhóm máu
                                </label>
                                <select
                                    name="bloodGroup"
                                    className="form-control"
                                    value={profile.bloodGroup}
                                    onChange={handleChange}
                                >
                                    <option value="">Chưa xác định</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={16} color="#f59e0b" /> Dị ứng / Ghi chú Y tế quan trọng
                                </label>
                                <textarea
                                    name="allergy"
                                    className="form-control"
                                    value={profile.allergy}
                                    onChange={handleChange}
                                    placeholder="Liệt kê các dị ứng (ví dụ: dị ứng hải sản, thuốc penicillin...) hoặc các ghi chú y tế quan trọng khác"
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                                style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
                            >
                                <Save size={20} /> {saving ? 'Đang lưu...' : 'Lưu Hồ sơ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Change Password Section */}
            <ChangePassword />
        </div>
    );
};

export default PatientProfile;
