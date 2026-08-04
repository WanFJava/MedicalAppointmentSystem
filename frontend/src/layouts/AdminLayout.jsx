import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, LayoutDashboard, Stethoscope, LogOut, Pill, Calendar, UserCog, ListOrdered, Star, MessagesSquare, AlertCircle, Home } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

const AdminLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const menuItems = [
        { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
        { path: '/admin/specialties', name: 'Specialties', icon: <Stethoscope size={20} />, roles: ['ADMIN'] },
        { path: '/admin/doctors', name: 'Quản lý bác sĩ', icon: <Users size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
        { path: '/admin/users', name: 'Users', icon: <UserCog size={20} />, roles: ['ADMIN'] },
        { path: '/admin/schedules', name: 'Schedules', icon: <Calendar size={20} />, roles: ['ADMIN'] },
        { path: '/admin/medicines', name: 'Medicines', icon: <Pill size={20} />, roles: ['ADMIN'] },
        { path: '/admin/appointments', name: 'Appointments', icon: <Users size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
        { path: '/admin/live-chat', name: 'Live Chat', icon: <MessagesSquare size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
        { path: '/admin/feedbacks', name: 'Feedbacks', icon: <Star size={20} />, roles: ['ADMIN'] },
        { path: '/admin/queue', name: 'Queue Manager', icon: <ListOrdered size={20} />, roles: ['RECEPTIONIST'] },
        { path: '/admin/my-schedule', name: 'Lịch khám bệnh', icon: <Stethoscope size={20} />, roles: ['DOCTOR'] },
        { path: '/admin/my-shifts', name: 'Ca trực của tôi', icon: <UserCog size={20} />, roles: ['DOCTOR'] },
        { path: '/admin/open-shifts', name: 'Đăng ký ca làm', icon: <Calendar size={20} />, roles: ['DOCTOR'] },
        { path: '/admin/patients', name: 'Quản lý bệnh nhân', icon: <Users size={20} />, roles: ['RECEPTIONIST'] },
        { path: '/admin/home-visit', name: 'Khám tại nhà', icon: <Home size={20} />, roles: ['RECEPTIONIST'] },
        { path: '/admin/complaints', name: 'Xử lý khiếu nại', icon: <AlertCircle size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
        { path: '/admin/incidents', name: 'Báo cáo sự cố', icon: <AlertCircle size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
    ];

    return (
        <div className="dashboard-layout">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Smart Clinic</h2>
                    <p>Admin Panel</p>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.filter(item => item.roles.includes(user?.role)).map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar" style={{ overflow: 'hidden' }}>
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'A')}&background=random`; }}
                                />
                            ) : (
                                user?.fullName?.charAt(0) || 'A'
                            )}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.fullName}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-title">
                        {menuItems.find(item => item.path === location.pathname)?.name || 'Admin'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <NotificationBell />
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
