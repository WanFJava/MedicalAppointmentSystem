import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, LayoutDashboard, Stethoscope, LogOut, Pill, Calendar, UserCog, ListOrdered, Star, MessagesSquare, AlertCircle, Home } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import api from '../api/axiosConfig';

const AdminLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [notifs, setNotifs] = useState([]);
    
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/notifications/user/${user.id}`);
            setNotifs(res.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const getBadgeCounts = () => {
        const counts = {};
        const unread = notifs.filter(n => !n.isRead);
        unread.forEach(n => {
            const msg = n.message.toLowerCase();
            let p = null;
            if (msg.includes('khiếu nại')) p = '/admin/complaints';
            else if (msg.includes('sự cố')) p = '/admin/incidents';
            else if (msg.includes('đánh giá')) p = '/admin/feedbacks';
            else if (msg.includes('chat') || msg.includes('tin nhắn')) p = '/admin/live-chat';
            else if (user?.role === 'DOCTOR') {
                if (msg.includes('lịch khám') || msg.includes('ca khám') || msg.includes('đặt lịch') || msg.includes('hoàn thành')) p = '/admin/my-schedule';
                else if (msg.includes('ca trực') || msg.includes('lịch làm việc')) p = '/admin/my-shifts';
            } else {
                if (msg.includes('tại nhà')) p = '/admin/home-visit';
                else if (msg.includes('lịch khám') || msg.includes('đặt lịch') || msg.includes('ca khám')) p = '/admin/appointments';
            }
            if (p) {
                counts[p] = (counts[p] || 0) + 1;
            }
        });
        return counts;
    };

    const badgeCounts = getBadgeCounts();

    const menuItems = [
        { path: '/admin', name: 'Bảng điều khiển', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'RECEPTIONIST'], recOrder: 0 },
        { path: '/admin/specialties', name: 'Chuyên khoa', icon: <Stethoscope size={20} />, roles: ['ADMIN'] },
        { path: '/admin/doctors', name: 'Quản lý bác sĩ', icon: <Users size={20} />, roles: ['ADMIN', 'RECEPTIONIST'], recOrder: 5, recColor: '#7c3aed', recBg: '#f5f3ff' },
        { path: '/admin/users', name: 'Người dùng', icon: <UserCog size={20} />, roles: ['ADMIN'] },
        { path: '/admin/schedules', name: 'Lịch làm việc', icon: <Calendar size={20} />, roles: ['ADMIN'] },
        { path: '/admin/medicines', name: 'Kho thuốc', icon: <Pill size={20} />, roles: ['ADMIN'] },
        { path: '/admin/appointments', name: 'Lịch khám', icon: <Users size={20} />, roles: ['ADMIN', 'RECEPTIONIST'], recOrder: 2, recColor: '#2563eb', recBg: '#eff6ff' },
        { path: '/admin/live-chat', name: 'Chat trực tuyến', icon: <MessagesSquare size={20} />, roles: ['ADMIN', 'RECEPTIONIST'], recOrder: 4, recColor: '#059669', recBg: '#ecfdf5' },
        { path: '/admin/feedbacks', name: 'Đánh giá', icon: <Star size={20} />, roles: ['ADMIN'] },
        { path: '/admin/queue', name: 'Hàng đợi', icon: <ListOrdered size={20} />, roles: ['RECEPTIONIST'], recOrder: 1, recColor: '#2563eb', recBg: '#eff6ff' },

        { path: '/admin/my-shifts', name: 'Ca trực của tôi', icon: <UserCog size={20} />, roles: ['DOCTOR'] },
        { path: '/admin/open-shifts', name: 'Đăng ký ca làm', icon: <Calendar size={20} />, roles: ['DOCTOR'] },
        { path: '/admin/patients', name: 'Quản lý bệnh nhân', icon: <Users size={20} />, roles: ['RECEPTIONIST'], recOrder: 6, recColor: '#7c3aed', recBg: '#f5f3ff' },
        { path: '/admin/home-visit', name: 'Khám tại nhà', icon: <Home size={20} />, roles: ['RECEPTIONIST'], recOrder: 3, recColor: '#2563eb', recBg: '#eff6ff' },
        { path: '/admin/complaints', name: 'Xử lý khiếu nại', icon: <AlertCircle size={20} />, roles: ['ADMIN', 'RECEPTIONIST'], recOrder: 7, recColor: '#d97706', recBg: '#fffbeb' },
        { path: '/admin/incidents', name: 'Báo cáo sự cố', icon: <AlertCircle size={20} />, roles: ['ADMIN', 'RECEPTIONIST'], recOrder: 8, recColor: '#d97706', recBg: '#fffbeb' },
        { path: '/admin/my-schedule', name: 'Lịch khám bệnh', icon: <Stethoscope size={20} />, roles: ['DOCTOR'] },
    ];

    const getVisibleItems = () => {
        let items = menuItems.filter(item => item.roles.includes(user?.role));
        if (user?.role === 'RECEPTIONIST') {
            items.sort((a, b) => (a.recOrder ?? 99) - (b.recOrder ?? 99));
        }
        return items;
    };

    return (
        <div className="dashboard-layout">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Smart Clinic</h2>
                    <p>Admin Panel</p>
                </div>
                <nav className="sidebar-nav">
                    {getVisibleItems().map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${user?.role === 'RECEPTIONIST' && item.recColor ? 'receptionist-item' : ''}`}
                            style={user?.role === 'RECEPTIONIST' && item.recColor ? { '--rec-color': item.recColor, '--rec-bg': item.recBg } : {}}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                {item.icon}
                                <span>{item.name}</span>
                            </div>
                            {badgeCounts[item.path] > 0 && (
                                <div style={{
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '1rem',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                }}>
                                    {badgeCounts[item.path]}
                                </div>
                            )}
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
                        <LogOut size={18} /> Đăng xuất
                    </button>
                </div>
            </div>
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-title">
                        {menuItems.find(item => item.path === location.pathname)?.name || 'Admin'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <NotificationBell externalNotifs={notifs} setExternalNotifs={setNotifs} fetchExternalNotifs={fetchNotifications} />
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
