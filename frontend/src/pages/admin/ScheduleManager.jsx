import React, { useState } from 'react';
import { createSchedule } from '../../api/appointmentApi';

const ScheduleManager = ({ doctorId, onScheduleCreated }) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [maxPatient, setMaxPatient] = useState(10);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const data = {
                date,
                startTime,
                endTime,
                maxPatient: parseInt(maxPatient)
            };
            await createSchedule(doctorId, data);
            alert("Schedule shift created successfully!");
            if (onScheduleCreated) onScheduleCreated();
            
            // Reset
            setDate('');
            setStartTime('');
            setEndTime('');
            setMaxPatient(10);
        } catch (error) {
            console.error("Failed to create schedule", error);
            alert("Failed to create schedule. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Add New Working Shift</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Date</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Start Time</label>
                    <input 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>End Time</label>
                    <input 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Max Patients</label>
                    <input 
                        type="number" 
                        value={maxPatient} 
                        onChange={(e) => setMaxPatient(e.target.value)} 
                        required min="1"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.5rem', height: '38px' }}
                >
                    {loading ? 'Creating...' : 'Create Shift'}
                </button>
            </form>
        </div>
    );
};

export default ScheduleManager;
