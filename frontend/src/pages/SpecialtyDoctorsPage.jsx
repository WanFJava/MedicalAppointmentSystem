import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Heart, Star, User, Activity } from 'lucide-react';
import DoctorCard from '../components/DoctorCard';
import { AuthContext } from '../context/AuthContext';
import { getDoctors, getSpecialties } from '../api/adminApi';

const SpecialtyDoctorsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);

    const [specialty, setSpecialty] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [allDocs, allSpecs] = await Promise.all([
                    getDoctors(),
                    getSpecialties()
                ]);

                // Find the specialty
                const currentSpecialty = allSpecs.find(s => s.id.toString() === id);
                setSpecialty(currentSpecialty);

                // Filter doctors for this specialty
                const specialtyDoctors = allDocs.filter(d => d.specialtyId?.toString() === id && d.status === 'ACTIVE');
                setDoctors(specialtyDoctors);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#6b7280' }}>Đang tải danh sách bác sĩ...</div>;
    }

    if (!specialty) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>Không tìm thấy chuyên khoa</h2>
                <button className="btn-secondary" onClick={() => navigate('/')}>Về Trang chủ</button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <button
                    onClick={() => {
                        if (window.history.state && window.history.state.idx > 0) {
                            navigate(-1);
                        } else {
                            navigate('/');
                        }
                    }}
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
                >
                    ← Quay lại
                </button>

                {/* Specialty Header */}
                <div style={{ marginBottom: '3rem', position: 'relative', backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'left' }}>
                        {specialty.name}
                    </h1>
                    
                    <div style={{
                        color: '#334155', 
                        fontSize: '1.05rem', 
                        lineHeight: '1.8', 
                        textAlign: 'left',
                        position: 'relative'
                    }}>
                        {/* Optional faint background image like in screenshot */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}></div>

                        <div 
                            className="quill-content"
                            dangerouslySetInnerHTML={{ __html: specialty.description || '' }}
                            style={{
                                display: isExpanded ? 'block' : '-webkit-box',
                                WebkitLineClamp: isExpanded ? 'unset' : 8,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                position: 'relative',
                                zIndex: 1
                            }}
                        />
                        {specialty.description?.length > 300 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0ea5e9',
                                    cursor: 'pointer',
                                    marginTop: '0.5rem',
                                    padding: 0,
                                    fontSize: '0.95rem',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                            >
                                {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Doctors List */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                        Bác sĩ trong Chuyên khoa này ({doctors.length})
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {doctors.map((doc) => (
                            <DoctorCard key={doc.id} doc={doc} />
                        ))}
                        {doctors.length === 0 && (
                            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                Hiện chưa có bác sĩ nào trong chuyên khoa này.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialtyDoctorsPage;
