import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, Clock, Star, Search } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getDoctors, getSpecialties } from '../api/adminApi';

const SearchPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialQuery = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const docs = await getDoctors();
                const specs = await getSpecialties();
                setDoctors(docs);
                setSpecialties(specs);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({ q: searchQuery });
    };

    const currentQuery = searchParams.get("q") || "";

    const filteredDoctors = doctors.filter(d =>
        d.fullName?.toLowerCase().includes(currentQuery.toLowerCase()) ||
        d.specialtyName?.toLowerCase().includes(currentQuery.toLowerCase())
    );

    const filteredSpecialties = specialties.filter(s =>
        s.name?.toLowerCase().includes(currentQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(currentQuery.toLowerCase())
    );

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '2rem', textAlign: 'center' }}>Search </h1>

                <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 3rem auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '0.5rem' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#9ca3af' }} size={24} />
                    <input
                        type="text"
                        placeholder="Search doctors, specialties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 7rem 1rem 3.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #d1d5db',
                            outline: 'none',
                            fontSize: '1.125rem'
                        }}
                    />
                    <button type="submit" className="btn-primary" style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', bottom: '0.5rem', padding: '0 1.5rem', borderRadius: '0.375rem', width: 'auto' }}>
                        Search
                    </button>
                </form>

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '1.25rem' }}>Searching...</div>
                ) : (
                    <>
                        {/* Specialties Results */}
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                Specialties ({filteredSpecialties.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredSpecialties.map((spec) => (
                                    <div key={spec.id} style={{
                                        backgroundColor: 'white',
                                        padding: '1.5rem',
                                        borderRadius: '1rem',
                                        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '1.5rem',
                                        transition: 'transform 0.2s, boxShadow 0.2s',
                                        cursor: 'pointer'
                                    }}
                                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.05)'; }}
                                    >
                                        <div style={{
                                            backgroundColor: '#e0e7ff',
                                            color: '#4f46e5',
                                            width: '60px',
                                            height: '60px',
                                            minWidth: '60px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Activity size={28} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>{spec.name}</h3>
                                            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                {spec.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {filteredSpecialties.length === 0 && (
                                    <p style={{ color: '#6b7280' }}>No specialties found matching '{currentQuery}'.</p>
                                )}
                            </div>
                        </div>

                        {/* Doctors Results */}
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                Doctors ({filteredDoctors.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredDoctors.map((doc) => (
                                    <div key={doc.id} style={{
                                        backgroundColor: 'white',
                                        borderRadius: '1rem',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                                        border: '1px solid #e2e8f0',
                                        transition: 'transform 0.2s, boxShadow 0.2s',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: '1.5rem',
                                        gap: '2rem',
                                        cursor: 'pointer'
                                    }}
                                        onClick={() => navigate(`/doctor/${doc.id}`)}
                                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.05)'; }}
                                    >
                                        <div style={{ width: '120px', height: '120px', minWidth: '120px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                            {doc.avatar ? (
                                                <img src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                                    {doc.fullName?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>{doc.degree} {doc.fullName}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fef3c7', padding: '0.25rem 0.75rem', borderRadius: '1rem', gap: '0.25rem' }}>
                                                    <Star size={16} color="#d97706" fill="#d97706" />
                                                    <span style={{ color: '#92400e', fontWeight: '600', fontSize: '0.875rem' }}>{doc.averageRating?.toFixed(1) || '0.0'}</span>
                                                </div>
                                            </div>
                                            <p style={{ color: '#4f46e5', fontWeight: '500', marginBottom: '0.75rem' }}>{doc.specialtyName}</p>

                                            <div style={{ display: 'flex', gap: '2rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={16} /> {doc.experience} Years Experience
                                                </div>
                                                <div style={{ fontWeight: '600', color: '#10b981' }}>
                                                    Consultation Fee: ${doc.consultationFee}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '0.75rem 1.5rem', width: 'auto', whiteSpace: 'nowrap' }}
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
                                ))}
                                {filteredDoctors.length === 0 && (
                                    <p style={{ color: '#6b7280' }}>No doctors found matching '{currentQuery}'.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
