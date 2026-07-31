import React, { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, Activity, Star } from 'lucide-react';
import { getDashboardStats } from '../../api/adminApi';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await getDashboardStats();
                setData(stats);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Total Doctors', value: data?.totalDoctors || 0, icon: <Stethoscope size={24} />, color: '#4f46e5', bg: '#e0e7ff' },
        { label: 'Total Patients', value: data?.totalPatients || 0, icon: <Users size={24} />, color: '#10b981', bg: '#d1fae5' },
        { label: 'Appointments Today', value: data?.appointmentsToday || 0, icon: <Calendar size={24} />, color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Active Specialties', value: data?.activeSpecialties || 0, icon: <Activity size={24} />, color: '#ec4899', bg: '#fce7f3' },
        { label: 'Patient Feedbacks', value: data?.totalFeedbacks || 0, icon: <Star size={24} />, color: '#d97706', bg: '#fef3c7' },
    ];

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Overview</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ backgroundColor: stat.bg, color: stat.color, width: '48px', height: '48px', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Recent Activity</h3>
                <p style={{ color: '#6b7280' }}>Dashboard statistics and charts will be implemented here.</p>
            </div>
        </div>
    );
};

export default Dashboard;
