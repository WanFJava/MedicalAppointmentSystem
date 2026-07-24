import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Activity, Clock, Shield, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDoctors, getSpecialties } from '../api/adminApi';

const Home = () => {
    const { user } = useContext(AuthContext);
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
                    .filter(d => d.averageRating >= 4.0)
                    .sort((a, b) => b.averageRating - a.averageRating);
                
                setDoctors(highRatedDocs.length > 0 ? highRatedDocs : docs.sort((a, b) => b.averageRating - a.averageRating)); // fallback to top rated if no one is >= 4
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
                                backgroundColor: 'white',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                transition: 'transform 0.2s, boxShadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                            >
                                <div style={{ 
                                    backgroundColor: '#e0e7ff', 
                                    color: '#4f46e5', 
                                    width: '60px', 
                                    height: '60px', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <Activity size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>{spec.name}</h3>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {spec.description}
                                </p>
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
                                backgroundColor: 'white',
                                borderRadius: '1rem',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e2e8f0',
                                transition: 'transform 0.2s',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ height: '200px', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {doc.avatar ? (
                                        <img src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '2rem', fontWeight: 'bold' }}>
                                            {doc.fullName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>{doc.degree} {doc.fullName}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '1rem', gap: '0.25rem' }}>
                                            <Star size={16} color="#d97706" fill="#d97706" />
                                            <span style={{ color: '#92400e', fontWeight: '600', fontSize: '0.875rem' }}>{doc.averageRating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </div>
                                    <p style={{ color: '#4f46e5', fontWeight: '500', marginBottom: '1rem' }}>{doc.specialtyName}</p>
                                    
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={16} /> {doc.experience} Years Exp
                                        </div>
                                        <div style={{ fontWeight: '600', color: '#10b981' }}>
                                            ${doc.consultationFee}
                                        </div>
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        style={{ marginTop: '1.25rem', width: '100%' }}
                                        onClick={() => {
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
