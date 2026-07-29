import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Heart } from 'lucide-react';

const MainLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'white',
                padding: '1rem 2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', textDecoration: 'none' }}>
                        Smart Clinic
                    </Link>
                    <nav style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link to="/" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
                        <Link to="/book" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>Book Appointment</Link>
                        {user && user.role === 'PATIENT' && (
                            <Link to="/favorites" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Heart size={16} /> Favorites
                            </Link>
                        )}
                        <Link to="/my-appointments" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>My Appointments</Link>
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}>
                                <UserIcon size={20} />
                                <Link to="/profile" style={{ fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>
                                    {user.fullName}
                                </Link>
                                <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                                    {user.role}
                                </span>
                            </div>
                            <button onClick={logout} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', border: '1px solid #ef4444',
                                backgroundColor: 'transparent', color: '#ef4444',
                                borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500
                            }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ backgroundColor: 'transparent', border: '1px solid #d1d5db', padding: '0.5rem 1.5rem', color: '#374151' }}>Login</button>
                            <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.5rem 1.5rem', width: 'auto' }}>Register</button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            {/* Footer */}
            <footer style={{ backgroundColor: '#1f2937', color: 'white', padding: '3rem 2rem', marginTop: 'auto' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>Smart Clinic</h3>
                        <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>Providing the best healthcare services with modern technology and experienced doctors.</p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'white' }}>Quick Links</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</Link></li>
                            <li><Link to="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Book Appointment</Link></li>
                            <li><Link to="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Find a Doctor</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'white' }}>Contact</h4>
                        <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Email: support@smartclinic.com</p>
                        <p style={{ color: '#9ca3af' }}>Phone: +84 587 205 181</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
