import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, Clock, Star, Search, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getDoctors, getSpecialties } from '../api/adminApi';
import DoctorCard from '../components/DoctorCard';

const SearchPage = () => {
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);
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



    const currentQuery = searchParams.get("q") || "";

    const normalizeString = (str) => {
        if (!str) return '';
        return str.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                  .toLowerCase();
    };

    const normalizedQuery = normalizeString(currentQuery);

    const filteredDoctors = doctors.filter(d =>
        normalizeString(d.fullName).includes(normalizedQuery) ||
        normalizeString(d.specialtyName).includes(normalizedQuery)
    );

    const filteredSpecialties = specialties.filter(s =>
        normalizeString(s.name).includes(normalizedQuery) ||
        normalizeString(s.description).includes(normalizedQuery)
    );

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '2rem', textAlign: 'center' }}>Search </h1>

                <form onSubmit={(e) => e.preventDefault()} style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 3rem auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '0.5rem' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: '#9ca3af' }} size={24} />
                    <input
                        type="text"
                        placeholder="Search doctors, specialties..."
                        value={searchQuery}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            if (val) {
                                setSearchParams({ q: val });
                            } else {
                                setSearchParams({});
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem 1.5rem 1rem 3.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #d1d5db',
                            outline: 'none',
                            fontSize: '1.125rem'
                        }}
                    />
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
                                <DoctorCard key={doc.id} doc={doc} />
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
