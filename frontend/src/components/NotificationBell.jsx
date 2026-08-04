import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

const NotificationBell = () => {
    const { user } = useContext(AuthContext);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/notifications/user/${user.id}`);
            setNotifs(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/notifications/user/${user.id}/unread-count`);
            setUnreadCount(res.data);
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleDropdown = () => {
        const newState = !showDropdown;
        setShowDropdown(newState);
        if (newState) {
            fetchNotifications();
        }
    };

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifs(notifs.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await api.put(`/notifications/user/${user.id}/read-all`);
            setNotifs(notifs.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.isRead) {
            markAsRead(notif.id, { stopPropagation: () => {} });
        }
        setShowDropdown(false);
        
        const msg = notif.message.toLowerCase();
        
        if (user?.role === 'PATIENT') {
            if (msg.includes('khiếu nại') || msg.includes('lịch khám') || msg.includes('ca khám') || msg.includes('hoàn thành')) {
                navigate('/my-appointments');
            }
        } else if (user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') {
            if (msg.includes('khiếu nại')) {
                navigate('/admin/complaints');
            } else if (msg.includes('lịch khám') || msg.includes('đặt lịch') || msg.includes('ca khám')) {
                navigate('/admin/appointments');
            }
        } else if (user?.role === 'DOCTOR') {
            if (msg.includes('phân công') || msg.includes('ca làm việc') || msg.includes('ca khám')) {
                navigate('/admin/my-shifts');
            }
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
                onClick={handleToggleDropdown}
                style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                    padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', transition: 'background-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <Bell size={24} color="#4b5563" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '2px', right: '4px', backgroundColor: '#ef4444',
                        color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%',
                        minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: '0 4px'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div style={{
                    position: 'absolute', top: '100%', right: '0', width: '350px',
                    backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: '8px'
                }}>
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                style={{
                                    background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500
                                }}
                            >
                                <Check size={14} /> Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifs.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                                Không có thông báo nào.
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {notifs.map(notif => (
                                    <li 
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        style={{
                                            padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                                            backgroundColor: notif.isRead ? 'white' : '#eff6ff',
                                            display: 'flex', gap: '12px', alignItems: 'flex-start',
                                            transition: 'background-color 0.2s', cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            marginTop: '2px', minWidth: '8px', height: '8px',
                                            borderRadius: '50%', backgroundColor: notif.isRead ? 'transparent' : '#3b82f6'
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151', lineHeight: '1.4' }}>
                                                {notif.message}
                                            </p>
                                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{notif.timeAgo}</span>
                                        </div>
                                        {!notif.isRead && (
                                            <button 
                                                onClick={(e) => markAsRead(notif.id, e)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#9ca3af',
                                                    cursor: 'pointer', padding: '4px', display: 'flex'
                                                }}
                                                title="Đánh dấu đã đọc"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
