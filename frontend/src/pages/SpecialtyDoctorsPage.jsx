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
                    padding: '4rem 2rem',
                    borderRadius: '1.25rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    border: '1px solid #f1f5f9',
                    marginBottom: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle at top right, rgba(79, 70, 229, 0.05) 0%, transparent 70%)', borderRadius: '0 1.25rem 0 100%' }}></div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'radial-gradient(circle at bottom left, rgba(79, 70, 229, 0.03) 0%, transparent 70%)', borderRadius: '0 100% 0 1.25rem' }}></div>

                    <div style={{
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        color: '#4f46e5',
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <Activity size={40} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                        {specialty.name}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.125rem', maxWidth: '800px', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
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
                            <DoctorCard key={doc.id} doc={doc} />
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
