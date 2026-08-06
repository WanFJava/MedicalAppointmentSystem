import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getPatientProfile, updatePatientProfile } from '../api/patientApi';
import { User, Mail, Phone, Calendar, MapPin, Activity, Save } from 'lucide-react';

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
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1f2937' }}>
                    <User size={32} color="var(--primary-color)" /> Hồ sơ của tôi
                </h1>

                {message.text && (
                    <div style={{
                        padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem',
                        backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: message.type === 'success' ? '#065f46' : '#991b1b'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <User size={16} /> Họ và tên
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={profile.fullName}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <Mail size={16} /> Email (Chỉ đọc)
                            </label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#6b7280' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <Phone size={16} /> Số điện thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <Calendar size={16} /> Ngày sinh
                            </label>
                            <input
                                type="date"
                                name="birthday"
                                value={profile.birthday}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <User size={16} /> Giới tính
                            </label>
                            <select
                                name="gender"
                                value={profile.gender}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white' }}
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <Activity size={16} /> Nhóm máu
                            </label>
                            <select
                                name="bloodGroup"
                                value={profile.bloodGroup}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white' }}
                            >
                                <option value="">Chọn nhóm máu</option>
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <MapPin size={16} /> Địa chỉ
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={profile.address}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                <Activity size={16} /> Dị ứng / Ghi chú Y tế
                            </label>
                            <textarea
                                name="allergy"
                                value={profile.allergy}
                                onChange={handleChange}
                                placeholder="Liệt kê các dị ứng hoặc ghi chú y tế quan trọng"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', minHeight: '46px', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
    );
};

export default PatientProfile;
