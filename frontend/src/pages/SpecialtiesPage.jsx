import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { getSpecialties } from '../api/adminApi';

const SpecialtiesPage = () => {
    const navigate = useNavigate();
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const data = await getSpecialties();
                setSpecialties(data);
            } catch (error) {
                console.error("Failed to fetch specialties", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSpecs();
    }, []);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#6b7280' }}>Đang tải chuyên khoa...</div>;
    }

    return (
        <div style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>Chuyên khoa của chúng tôi</h1>
                    <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Khám phá các chuyên khoa y tế đa dạng của chúng tôi và tìm chuyên gia phù hợp với nhu cầu của bạn.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {specialties.map((spec) => (
                        <div key={spec.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0',
                            transition: 'transform 0.2s, boxShadow 0.2s',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'stretch',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/specialty/${spec.id}`)}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            const arrow = e.currentTarget.querySelector('.arrow-icon');
                            if (arrow) arrow.style.transform = 'translateX(5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.05)';
                            const arrow = e.currentTarget.querySelector('.arrow-icon');
                            if (arrow) arrow.style.transform = 'translateX(0)';
                        }}
                        >
                            {/* LEFT COLUMN: Icon & Title */}
                            <div style={{ padding: '1.5rem', flex: '1 1 45%', display: 'flex', gap: '1.5rem', borderRight: '1px solid #e2e8f0', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e0e7ff',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: '0.5rem',
                                        border: '3px solid #c7d2fe',
                                        color: '#4f46e5'
                                    }}>
                                        <Activity size={48} />
                                    </div>
                                    <span style={{ color: '#0ea5e9', fontSize: '0.875rem', fontWeight: '500' }}>Xem thêm</span>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0ea5e9', margin: 0 }}>
                                        {spec.name}
                                    </h3>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.25rem' }}>
                                        Chuyên khoa
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Description & Action */}
                            <div style={{ padding: '1.5rem', flex: '1 1 55%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                    {spec.description}
                                </p>

                                <button
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        backgroundColor: 'white', color: '#0ea5e9',
                                        border: '1px solid #0ea5e9', borderRadius: '2rem',
                                        padding: '0.4rem 1rem', fontSize: '0.875rem', fontWeight: '500',
                                        width: 'fit-content', cursor: 'pointer', marginTop: 'auto',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                >
                                    Khám phá Bác sĩ <ArrowRight className="arrow-icon" size={16} style={{ transition: 'transform 0.3s ease' }} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {specialties.length === 0 && (
                        <p style={{ color: '#6b7280', textAlign: 'center' }}>Không có chuyên khoa nào.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpecialtiesPage;
