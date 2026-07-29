import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getDoctors, getSpecialties } from '../api/adminApi';

const SpecialtyDoctorsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [specialty, setSpecialty] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

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
                const specialtyDoctors = allDocs.filter(d => d.specialtyId?.toString() === id);
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
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#6b7280' }}>Loading doctors...</div>;
    }

    if (!specialty) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>Specialty not found</h2>
                <button className="btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
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
                    ← Back
                </button>

                {/* Specialty Header */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '3rem 2rem', 
                    borderRadius: '1rem', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                    marginBottom: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ 
                        backgroundColor: '#e0e7ff', 
                        color: '#4f46e5', 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        <Activity size={40} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>
                        {specialty.name}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '1.125rem', maxWidth: '800px' }}>
                        {specialty.description}
                    </p>
                </div>

                {/* Doctors List */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                        Doctors in this Specialty ({doctors.length})
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {doctors.map((doc) => (
                            <div key={doc.id} style={{
                                backgroundColor: 'white',
                                borderRadius: '1rem',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e2e8f0',
                                transition: 'transform 0.2s, boxShadow 0.2s',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'stretch'
                            }}
                            onClick={() => navigate(`/doctor/${doc.id}`)}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}
                            >
                                <div style={{ width: '220px', minWidth: '220px', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {doc.avatar ? (
                                        <img src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '3rem', fontWeight: 'bold' }}>
                                            {doc.fullName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{doc.fullName}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fef3c7', padding: '0.25rem 0.75rem', borderRadius: '1rem', gap: '0.25rem', width: 'fit-content' }}>
                                                <Star size={16} color="#d97706" fill="#d97706" />
                                                <span style={{ color: '#92400e', fontWeight: '600', fontSize: '0.875rem' }}>{doc.averageRating?.toFixed(1) || '0.0'}</span>
                                            </div>
                                            <div style={{ fontSize: '1rem', color: '#6b7280', fontWeight: '500' }}>{doc.degree}</div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                                <Clock size={16} /> <span>{doc.experience} Years Exp</span>
                                            </div>
                                            <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1.125rem' }}>
                                                Fee: ${doc.consultationFee}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ color: '#4f46e5', fontWeight: '600', marginBottom: '0.75rem' }}>{doc.specialtyName}</div>
                                    
                                    {doc.biography && (
                                        <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                                            {doc.biography}
                                        </p>
                                    )}
                                    
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '0.75rem 2rem', width: 'auto' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (user) {
                                                    navigate('/book', { state: { preselectDoctor: doc.id } });
                                                } else {
                                                    navigate('/login');
                                                }
                                            }}
                                        >
                                            Book Appointment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {doctors.length === 0 && (
                            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                No doctors available in this specialty currently.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialtyDoctorsPage;
