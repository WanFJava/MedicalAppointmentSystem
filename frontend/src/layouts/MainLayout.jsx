import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, Heart, Home, CalendarPlus, CalendarDays, LayoutGrid } from 'lucide-react';
import ReceptionistChatbot from '../components/ReceptionistChatbot';
import NotificationBell from '../components/NotificationBell';

const MainLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                padding: '1rem 2.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                borderBottom: '1px solid rgba(226, 232, 240, 0.6)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
                            <span style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem' }}>S</span>
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                            SmartClinic
                        </span>
                    </Link>

                    <nav style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                            { path: '/', label: 'Trang chủ', icon: <LayoutGrid size={18} /> },
                            { path: '/book', label: 'Đặt lịch', icon: <CalendarPlus size={18} /> },
                            { path: '/book-home-visit', label: 'Khám tại nhà', icon: <Home size={18} /> },
                            ...(user && user.role === 'PATIENT' ? [{ path: '/favorites', label: 'Yêu thích', icon: <Heart size={18} /> }] : []),
                            { path: '/my-appointments', label: 'Lịch hẹn', icon: <CalendarDays size={18} /> }
                        ].map((link, index) => {
                            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                            return (
                                <Link 
                                    key={index} 
                                    to={link.path} 
                                    style={{ 
                                        color: isActive ? '#4f46e5' : '#64748b', 
                                        backgroundColor: isActive ? '#eef2ff' : 'transparent',
                                        textDecoration: 'none', 
                                        fontWeight: 600, 
                                        fontSize: '0.95rem',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.2s ease',
                                        border: isActive ? '1px solid #c7d2fe' : '1px solid transparent'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                                            e.currentTarget.style.color = '#334155';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ transform: 'translateY(2px)' }}>
                                <NotificationBell />
                            </div>
                            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>
                            
                            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', padding: '0.35rem 0.75rem', borderRadius: '2rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="Avatar"
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'A')}&background=random`; }}
                                    />
                                ) : (
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                        <UserIcon size={20} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{user.fullName}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{user.role}</span>
                                </div>
                            </Link>

                            <button onClick={logout} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', border: 'none',
                                backgroundColor: '#fee2e2', color: '#ef4444',
                                borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fecaca'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <LogOut size={16} /> Thoát
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => navigate('/login')} style={{ backgroundColor: 'transparent', border: 'none', padding: '0.6rem 1.25rem', color: '#475569', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#4f46e5'} onMouseOut={e => e.currentTarget.style.color = '#475569'}>Đăng nhập</button>
                            <button onClick={() => navigate('/register')} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)'; }}>Tạo tài khoản</button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            <ReceptionistChatbot />

            {/* Footer */}
            <footer style={{ backgroundColor: '#1f2937', color: 'white', padding: '3rem 2rem', marginTop: 'auto' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>Smart Clinic</h3>
                        <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>Cung cấp dịch vụ chăm sóc sức khỏe tốt nhất với công nghệ hiện đại và đội ngũ bác sĩ giàu kinh nghiệm.</p>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'white' }}>Liên kết nhanh</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><Link to="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Trang chủ</Link></li>
                            <li><Link to="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Đặt lịch khám</Link></li>
                            <li><Link to="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Tìm bác sĩ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'white' }}>Liên hệ</h4>
                        <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Email: support@smartclinic.com</p>
                        <p style={{ color: '#9ca3af' }}>Phone: +84 587 205 181</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
