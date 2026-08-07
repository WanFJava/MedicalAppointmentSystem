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
        d.status === 'ACTIVE' &&
        (normalizeString(d.fullName).includes(normalizedQuery) ||
        normalizeString(d.specialtyName).includes(normalizedQuery))
    );

    const filteredSpecialties = specialties.filter(s =>
        normalizeString(s.name).includes(normalizedQuery) ||
        normalizeString(s.description).includes(normalizedQuery)
    );

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(to right, #1e293b, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                    Tìm kiếm thông tin
                </h1>

                <form onSubmit={(e) => e.preventDefault()} style={{ position: 'relative', maxWidth: '700px', margin: '0 auto 4rem auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', borderRadius: '1.5rem' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={24} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chuyên khoa hoặc tên bác sĩ..."
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
                            padding: '1.25rem 1.5rem 1.25rem 4rem',
                            borderRadius: '1.5rem',
                            border: '2px solid white',
                            outline: 'none',
                            fontSize: '1.125rem',
                            backgroundColor: 'white',
                            color: '#1e293b',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                        }}
                        onFocus={e => {
                            e.target.style.borderColor = '#c7d2fe';
                            e.target.style.boxShadow = '0 0 0 4px rgba(199, 210, 254, 0.5)';
                        }}
                        onBlur={e => {
                            e.target.style.borderColor = 'white';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </form>

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '1.25rem' }}>Đang tìm kiếm...</div>
                ) : (
                    <>
                        {/* Specialties Results */}
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                Chuyên khoa ({filteredSpecialties.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredSpecialties.map((spec) => (
                                    <div key={spec.id} style={{
                                        backgroundColor: 'white',
                                        borderRadius: '1rem',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                        border: '1px solid #f1f5f9',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'stretch',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/specialty/${spec.id}`)}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                        e.currentTarget.style.borderColor = '#f1f5f9';
                                    }}
                                    >
                                        {/* LEFT COLUMN: Icon & Title */}
                                        <div style={{ padding: '2rem', flex: '0 0 35%', display: 'flex', gap: '1.5rem', borderRight: '1px solid #f1f5f9', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '20px',
                                                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginBottom: '0.75rem',
                                                    color: '#4f46e5',
                                                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)'
                                                }}>
                                                    <Activity size={36} />
                                                </div>
                                                <span style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#eef2ff', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>Xem chi tiết</span>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                                                    {spec.name}
                                                </h3>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 600, backgroundColor: '#e0f2fe', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                                                    Chuyên khoa
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN: Description & Action */}
                                        <div style={{ padding: '2rem', flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div 
                                                dangerouslySetInnerHTML={{ __html: spec.description }}
                                                style={{ 
                                                    color: '#475569', 
                                                    fontSize: '0.95rem', 
                                                    lineHeight: '1.6', 
                                                    margin: 0,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                                {filteredSpecialties.length === 0 && (
                                    <p style={{ color: '#6b7280' }}>Không tìm thấy chuyên khoa nào phù hợp với '{currentQuery}'.</p>
                                )}
                            </div>
                        </div>

                        {/* Doctors Results */}
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                Bác sĩ ({filteredDoctors.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredDoctors.map((doc) => (
                                <DoctorCard key={doc.id} doc={doc} />
                                ))}
                                {filteredDoctors.length === 0 && (
                                    <p style={{ color: '#6b7280' }}>Không tìm thấy bác sĩ nào phù hợp với '{currentQuery}'.</p>
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
