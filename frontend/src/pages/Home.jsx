import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Activity, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
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
                </div>
            </div>

            {/* Features Section */}
            <div style={{ padding: '5rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem' }}>Why Choose Us?</h2>
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
                                backgroundColor: '#f8fafc',
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
