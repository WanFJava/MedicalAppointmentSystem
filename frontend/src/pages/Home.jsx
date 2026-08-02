import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Activity, Clock, Shield, Search, Star, ArrowRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDoctors, getSpecialties } from '../api/adminApi';

const Home = () => {
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docs = await getDoctors();
                const specs = await getSpecialties();

                // Filter doctors with fairly high to high rating (>= 4.0) and sort descending
                const highRatedDocs = docs
                    .filter(d => d.averageRating >= 4.0 && d.status === 'ACTIVE')
                    .sort((a, b) => b.averageRating - a.averageRating);

                setDoctors(highRatedDocs);
                setSpecialties(specs);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        fetchData();
    }, []);



    return (
        <div>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)',
                padding: '6rem 2rem',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        color: '#1f2937',
                        marginBottom: '1.5rem',
                        lineHeight: 1.2
                    }}>
                        Your Health, Our <span style={{ color: '#4f46e5' }}>Top Priority</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#4b5563',
                        marginBottom: '2.5rem',
                        lineHeight: 1.6
                    }}>
                        Experience world-class medical care with our team of expert doctors.
                        Book your appointment online and skip the waiting room.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '1rem 2rem', fontSize: '1.125rem', width: 'auto' }}
                            onClick={() => {
                                if (user) {
                                    if (user.role === 'ADMIN') navigate('/admin');
                                    else navigate('/book');
                                } else {
                                    navigate('/login');
                                }
                            }}
                        >
                            {user?.role === 'ADMIN' ? 'Go to Admin Dashboard' : 'Book an Appointment'}
                        </button>
                        {!user && (
                            <button
                                className="btn-secondary"
                                style={{
                                    padding: '1rem 2rem',
                                    fontSize: '1.125rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #d1d5db',
                                    color: '#374151',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                                onClick={() => navigate('/register')}
                            >
                                Register Now
                            </button>
                        )}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if(searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                            else navigate(`/search`);
                        }}
                        style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '0.5rem' }}
                    >
                        <Search
                            style={{ position: 'absolute', left: '16px', top: '16px', color: '#9ca3af', cursor: 'pointer', zIndex: 10 }}
                            size={24}
                            onClick={() => {
                                if(searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                                else navigate(`/search`);
                            }}
                        />
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
                </div>
            </div>

            {/* Specialties Section */}
            <div style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>Our Specialties</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {specialties.map((spec) => (
                            <div key={spec.id} style={{
                                minWidth: '280px',
                                maxWidth: '300px',
                                flexShrink: 0,
                                backgroundColor: 'white',
                                padding: '2rem 1.5rem',
                                borderRadius: '1.25rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/specialty/${spec.id}`)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(14, 165, 233, 0.1)';
                                e.currentTarget.style.borderColor = '#bae6fd';
                                const arrow = e.currentTarget.querySelector('.arrow-icon');
                                if (arrow) arrow.style.transform = 'translateX(5px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                const arrow = e.currentTarget.querySelector('.arrow-icon');
                                if (arrow) arrow.style.transform = 'translateX(0)';
                            }}
                            >
                                <div style={{
                                    backgroundColor: '#e0f2fe',
                                    color: '#0ea5e9',
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.5rem',
                                    border: '4px solid #bae6fd'
                                }}>
                                    <Activity size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' }}>{spec.name}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1.5rem', flex: 1 }}>
                                    {spec.description}
                                </p>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9',
                                    fontWeight: '600', fontSize: '0.9rem', marginTop: 'auto',
                                    padding: '0.5rem 1rem', backgroundColor: '#f0f9ff', borderRadius: '2rem'
                                }}>
                                    <span>Xem chuyên khoa</span>
                                    <ArrowRight className="arrow-icon" size={16} style={{ transition: 'transform 0.3s ease' }} />
                                </div>
                            </div>
                        ))}
                        {specialties.length === 0 && (
                            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center' }}>No specialties available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Doctors Section */}
            <div style={{ padding: '4rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>Top Rated Doctors</h2>
                        <p style={{ color: '#6b7280' }}>Our most highly rated professionals.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                        {doctors.map((doc) => (
                            <div key={doc.id} style={{
                                minWidth: '300px',
                                maxWidth: '320px',
                                backgroundColor: 'white',
                                borderRadius: '1.25rem',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                border: '1px solid #f1f5f9',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={() => navigate(`/doctor/${doc.id}`)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#e0e7ff';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                            }}
                            >
                                <div style={{ height: '220px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    {user && user.role === 'PATIENT' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id); }}
                                            style={{
                                                position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                                                background: 'white', border: 'none', borderRadius: '50%',
                                                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <Heart size={20} fill={favoriteDoctorIds?.has(doc.id) ? '#fbbf24' : 'none'} color={favoriteDoctorIds?.has(doc.id) ? '#fbbf24' : '#9ca3af'} />
                                        </button>
                                    )}
                                    {doc.avatar ? (
                                        <img src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '3rem', fontWeight: 'bold' }}>
                                            {doc.fullName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0ea5e9', marginBottom: '0.25rem' }}>{doc.fullName}</h3>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem' }}>{doc.degree}</div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f0f9ff', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <Star size={14} fill="#0ea5e9" color="#0ea5e9" /> {doc.averageRating?.toFixed(1) || '0.0'}
                                        </div>
                                        <span style={{ color: '#4f46e5', fontWeight: '600', fontSize: '0.9rem' }}>{doc.specialtyName}</span>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: '0.9rem', paddingBottom: '1.25rem', borderBottom: '1px dashed #e2e8f0', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={16} color="#9ca3af" />
                                            <span><strong>{doc.experience}</strong> yrs exp</span>
                                        </div>
                                        <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1.05rem' }}>
                                            ${doc.consultationFee}
                                        </div>
                                    </div>

                                    <button
                                        style={{
                                            width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
                                            backgroundColor: '#0ea5e9', color: 'white', border: 'none',
                                            fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#0ea5e9'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (user) {
                                                navigate('/book', { state: { preselectDoctor: doc.id } });
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                    >
                                        Đặt khám ngay
                                    </button>
                                </div>
                            </div>
                        ))}
                        {doctors.length === 0 && (
                            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center' }}>No top-rated doctors available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Why Choose Us?</h2>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>We provide the best medical services for you and your family.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        {[
                            { icon: <Activity size={32} />, title: 'Expert Doctors', desc: 'Our clinic is staffed by highly qualified professionals.' },
                            { icon: <Calendar size={32} />, title: 'Easy Booking', desc: 'Schedule appointments online with just a few clicks.' },
                            { icon: <Clock size={32} />, title: '24/7 Support', desc: 'We are always here to help you when you need it most.' },
                            { icon: <Shield size={32} />, title: 'Secure Records', desc: 'Your medical history is kept strictly confidential and secure.' }
                        ].map((feature, index) => (
                            <div key={index} style={{
                                padding: '2rem',
                                borderRadius: '1rem',
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                transition: 'transform 0.2s'
                            }}>
                                <div style={{
                                    backgroundColor: '#e0e7ff',
                                    color: '#4f46e5',
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>{feature.title}</h3>
                                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
