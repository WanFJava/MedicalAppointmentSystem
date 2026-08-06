import React, { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, Activity, Star, AlertTriangle, MessageCircle, Clock } from 'lucide-react';
import { getDashboardStats, getRecentActivity } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [stats, recent] = await Promise.all([
                    getDashboardStats(),
                    getRecentActivity()
                ]);
                setData(stats);
                setRecentActivity(recent);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Tổng số Bác sĩ', value: data?.totalDoctors || 0, icon: <Stethoscope size={24} />, color: '#4f46e5', bg: '#e0e7ff', onClick: null },
        { label: 'Tổng số Bệnh nhân', value: data?.totalPatients || 0, icon: <Users size={24} />, color: '#10b981', bg: '#d1fae5', onClick: null },
        { label: 'Lịch hẹn hôm nay', value: data?.appointmentsToday || 0, icon: <Calendar size={24} />, color: '#f59e0b', bg: '#fef3c7', onClick: null },
        { label: 'Chuyên khoa hoạt động', value: data?.activeSpecialties || 0, icon: <Activity size={24} />, color: '#ec4899', bg: '#fce7f3', onClick: null },
        { label: 'Khiếu nại chờ xử lý', value: data?.pendingComplaints || 0, icon: <AlertTriangle size={24} />, color: '#dc2626', bg: '#fee2e2', onClick: () => navigate('/admin/complaints') },
    ];

    if (loading) return <div>Đang tải bảng điều khiển...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Tổng quan</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        onClick={stat.onClick}
                        style={{ 
                            backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', 
                            display: 'flex', alignItems: 'center', gap: '1rem', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            cursor: stat.onClick ? 'pointer' : 'default',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseOver={(e) => {
                            if (stat.onClick) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (stat.onClick) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                            }
                        }}
                    >
                        <div style={{ backgroundColor: stat.bg, color: stat.color, width: '48px', height: '48px', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Hoạt động gần đây</h3>
                {recentActivity.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>Chưa có hoạt động nào gần đây.</p>
                ) : (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                        {recentActivity.map((activity, idx) => (
                            <li key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                padding: '1rem 0',
                                borderBottom: idx !== recentActivity.length - 1 ? '1px solid #e5e7eb' : 'none'
                            }}>
                                <div style={{ 
                                    backgroundColor: '#eff6ff', 
                                    color: '#3b82f6', 
                                    borderRadius: '50%', 
                                    width: '36px', 
                                    height: '36px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    marginRight: '1rem',
                                    flexShrink: 0
                                }}>
                                    <MessageCircle size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 0.25rem 0', color: '#374151', fontWeight: '500', fontSize: '0.95rem' }}>
                                        {activity.message}
                                    </p>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                                        <Clock size={12} style={{ marginRight: '0.25rem' }} />
                                        {activity.timeAgo}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
