import React, { useState, useEffect } from 'react';
import { getDoctorSchedules, updateScheduleStatus } from '../../api/appointmentApi';
import { Calendar } from 'lucide-react';

const ScheduleManager = ({ doctorId }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    useEffect(() => {
        if (doctorId && date) {
            fetchSchedules();
        }
    }, [doctorId, date]);

    const fetchSchedules = async () => {
        try {
            setLoadingSchedules(true);
            const data = await getDoctorSchedules(doctorId, date);
            setSchedules(data);
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateScheduleStatus(id, newStatus);
            fetchSchedules();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update schedule status.");
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'OPEN': return { bg: '#e5e7eb', color: '#374151' };
            case 'AVAILABLE': return { bg: '#dbeafe', color: '#1d4ed8' };
            case 'FULL': return { bg: '#fee2e2', color: '#b91c1c' };
            case 'IN_PROGRESS': return { bg: '#fef3c7', color: '#b45309' };
            case 'COMPLETED': return { bg: '#d1fae5', color: '#047857' };
            case 'CANCELLED': return { bg: '#f3f4f6', color: '#9ca3af' };
            default: return { bg: '#f3f4f6', color: '#4b5563' };
        }
    };

    return (
        <div>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Working Shifts</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Selected Date:</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        />
                    </div>
                </div>

                {/* Schedule List */}
                <div>
                    {loadingSchedules ? (
                        <div>Loading shifts...</div>
                    ) : schedules.length === 0 ? (
                        <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <div>No shifts found for this date. Admin has not assigned any shifts yet.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {schedules.map(sch => {
                                const st = getStatusColor(sch.status);
                                return (
                                    <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{sch.startTime} - {sch.endTime}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                Patients: {sch.currentPatient || 0} / {sch.maxPatient}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ backgroundColor: st.bg, color: st.color, padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                {sch.status}
                                            </span>
                                            
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {sch.status === 'OPEN' && (
                                                    <button onClick={() => handleStatusUpdate(sch.id, 'AVAILABLE')} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        Accept (Set Available)
                                                    </button>
                                                )}
                                                {['AVAILABLE', 'FULL'].includes(sch.status) && (
                                                    <button onClick={() => handleStatusUpdate(sch.id, 'IN_PROGRESS')} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        Start Shift (In Progress)
                                                    </button>
                                                )}
                                                {sch.status === 'IN_PROGRESS' && (
                                                    <button onClick={() => handleStatusUpdate(sch.id, 'COMPLETED')} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#d1fae5', color: '#047857', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        Complete Shift
                                                    </button>
                                                )}
                                                {['OPEN', 'AVAILABLE'].includes(sch.status) && (
                                                    <button onClick={() => handleStatusUpdate(sch.id, 'CANCELLED')} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        Cancel Shift
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
