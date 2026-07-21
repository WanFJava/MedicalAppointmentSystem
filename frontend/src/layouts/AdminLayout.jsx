import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, LayoutDashboard, Stethoscope, LogOut, Pill } from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const menuItems = [
        { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN'] },
        { path: '/admin/specialties', name: 'Specialties', icon: <Stethoscope size={20} />, roles: ['ADMIN'] },
        { path: '/admin/doctors', name: 'Doctors', icon: <Users size={20} />, roles: ['ADMIN'] },
        { path: '/admin/medicines', name: 'Medicines', icon: <Pill size={20} />, roles: ['ADMIN'] },
        { path: '/admin/appointments', name: 'Appointments', icon: <Users size={20} />, roles: ['ADMIN', 'RECEPTIONIST'] },
        { path: '/admin/my-schedule', name: 'My Schedule', icon: <Stethoscope size={20} />, roles: ['DOCTOR'] },
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
                        <div className="user-avatar">{user?.fullName?.charAt(0) || 'A'}</div>
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
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
