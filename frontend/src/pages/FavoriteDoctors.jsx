import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getFavoriteDoctors } from '../api/patientApi';
import DoctorCard from '../components/DoctorCard';

const FavoriteDoctors = () => {
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user && user.role === 'PATIENT') {
            fetchDoctors();
        } else {
            setLoading(false);
        }
    }, [user, favoriteDoctorIds]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await getFavoriteDoctors(user.id);
            setDoctors(data);
        } catch (error) {
            console.error("Failed to fetch favorite doctors", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#6b7280' }}>Đang tải danh sách bác sĩ yêu thích...</div>;
    }

    if (!user || user.role !== 'PATIENT') {
        return (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>Truy cập bị từ chối</h2>
                <p style={{ color: '#6b7280', marginTop: '1rem' }}>Bạn phải đăng nhập với tư cách là bệnh nhân để xem bác sĩ yêu thích.</p>
            </div>
        );
    }

    const filteredDoctors = doctors.filter(doc => 
        (doc.user?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (doc.specialtyName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Heart size={36} fill="#fbbf24" color="#fbbf24" />
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '0.25rem' }}>Bác sĩ yêu thích</h1>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Danh sách các chuyên gia y tế bạn yêu thích.</p>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm bác sĩ hoặc chuyên khoa..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '12px', width: '100%', maxWidth: '500px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredDoctors.map((doc) => (
                        <DoctorCard key={doc.id} doc={doc} />
                    ))}
                    {filteredDoctors.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
                            <Heart size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', color: '#4b5563', fontWeight: '600' }}>Chưa có bác sĩ yêu thích nào</h3>
                            <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Hãy khám phá và chọn yêu thích các bác sĩ bạn tin tưởng để xem họ ở đây.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoriteDoctors;
