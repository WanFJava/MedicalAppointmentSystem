import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Users, CalendarCheck, Clock, XCircle, DollarSign, Activity } from 'lucide-react';
import Swal from 'sweetalert2';

const ReceptionistStats = () => {
    const [stats, setStats] = useState({
        totalPatientsToday: 0,
        totalAppointmentsToday: 0,
        checkedInPatients: 0,
        waitingPatients: 0,
        cancelledAppointments: 0,
        todayRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/receptionist');
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
            Swal.fire('Lỗi', 'Không thể tải dữ liệu thống kê', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;

    const statCards = [
        { title: 'Bệnh nhân khám hôm nay', value: stats.totalPatientsToday, icon: <Users size={24} color="#3b82f6" />, bg: '#eff6ff', border: '#bfdbfe' },
        { title: 'Lịch hẹn hôm nay', value: stats.totalAppointmentsToday, icon: <CalendarCheck size={24} color="#8b5cf6" />, bg: '#f5f3ff', border: '#ddd6fe' },
        { title: 'Đã Check-in / Đang khám', value: stats.checkedInPatients, icon: <Activity size={24} color="#10b981" />, bg: '#ecfdf5', border: '#a7f3d0' },
        { title: 'Bệnh nhân đang chờ', value: stats.waitingPatients, icon: <Clock size={24} color="#f59e0b" />, bg: '#fffbeb', border: '#fde68a' },
        { title: 'Lịch hẹn bị hủy', value: stats.cancelledAppointments, icon: <XCircle size={24} color="#ef4444" />, bg: '#fef2f2', border: '#fecaca' },
        { title: 'Doanh thu hôm nay', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.todayRevenue), icon: <DollarSign size={24} color="#059669" />, bg: '#d1fae5', border: '#6ee7b7' }
    ];

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h2>Tổng quan hôm nay</h2>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {statCards.map((card, index) => (
                    <div key={index} style={{
                        backgroundColor: card.bg,
                        border: `1px solid ${card.border}`,
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            {card.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 600, marginBottom: '0.25rem' }}>{card.title}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReceptionistStats;
