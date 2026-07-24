import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getSpecialties, getDoctors } from '../api/adminApi';
import { getAvailableSchedules, bookAppointment } from '../api/appointmentApi';
import { getPatientProfile } from '../api/patientApi';
import { Calendar, User, Stethoscope, Clock, CheckCircle } from 'lucide-react';

const BookingPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const preselectDoctorId = location.state?.preselectDoctor;
    const initialSelectedDate = location.state?.selectedDate;
    const initialSelectedSchedule = location.state?.selectedSchedule;

    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    
    // Selection state
    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [schedulesByDate, setSchedulesByDate] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [symptom, setSymptom] = useState('');
    const [patientProfile, setPatientProfile] = useState(null);
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchInitialData();
    }, [user, navigate]);

    const fetchInitialData = async () => {
        try {
            // Check if profile is complete
            const profile = await getPatientProfile(user.id);
            if (!profile.birthday || !profile.gender || !profile.address || !profile.bloodGroup || !profile.phone) {
                alert("Please complete your profile information (Phone, Birthday, Gender, Address, Blood Group) before booking an appointment.");
                navigate('/profile');
                return;
            }
            setPatientProfile(profile);

            const [specs, docs] = await Promise.all([getSpecialties(), getDoctors()]);
            setSpecialties(specs);
            setDoctors(docs);
            
            if (preselectDoctorId) {
                const doc = docs.find(d => d.id === preselectDoctorId);
                if (doc) {
                    setSelectedSpec(doc.specialtyId);
                    setSelectedDoctor(doc);
                    
                    if (initialSelectedDate && initialSelectedSchedule) {
                        setSelectedDate(initialSelectedDate);
                        setSelectedSchedule(initialSelectedSchedule);
                        setStep(4);
                    } else {
                        fetchSchedules(doc.id);
                        setStep(3);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load specialties and doctors", error);
        }
    };

    const handleSpecSelect = (specId) => {
        setSelectedSpec(specId);
        const docs = doctors.filter(d => d.specialtyId === parseInt(specId));
        setFilteredDoctors(docs);
        setSelectedDoctor(null);
        setStep(2);
    };

    const handleDoctorSelect = (doc) => {
        setSelectedDoctor(doc);
        fetchSchedules(doc.id);
        setStep(3);
    };

    const fetchSchedules = async (doctorId) => {
        try {
            setLoading(true);
            const data = await getAvailableSchedules(doctorId);
            // Group by date
            const grouped = data.reduce((acc, curr) => {
                if (!acc[curr.date]) acc[curr.date] = [];
                acc[curr.date].push(curr);
                return acc;
            }, {});
            setSchedulesByDate(grouped);
            
            const availableDates = Object.keys(grouped).sort();
            if (availableDates.length > 0) {
                setSelectedDate(availableDates[0]);
            } else {
                setSelectedDate('');
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // If it's an array like [8, 0], format it
        if (Array.isArray(timeStr)) {
            return `${timeStr[0].toString().padStart(2, '0')}:${timeStr[1].toString().padStart(2, '0')}`;
        }
        // If it's a string like "08:00:00", take first 5 chars
        return timeStr.substring(0, 5);
    };

    const handleScheduleSelect = (schedule) => {
        setSelectedSchedule(schedule);
        setStep(4);
    };

    const handleBooking = async () => {
        if (!selectedSchedule || !symptom.trim()) {
            alert("Please provide your symptoms.");
            return;
        }
        
        try {
            setLoading(true);
            const response = await bookAppointment(user.id, {
                doctorId: selectedDoctor.id,
                scheduleId: selectedSchedule.id,
                symptom: symptom
            });
            setSuccess(true);
        } catch (error) {
            alert("Booking failed. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1f2937' }}>Booking Successful!</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                    Your appointment with <strong>{selectedDoctor.fullName}</strong> on <strong>{selectedDate}</strong> at <strong>{formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}</strong> has been placed.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
                    <button className="btn-primary" onClick={() => navigate('/my-appointments')} style={{ width: 'auto' }}>View My Appointments</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937', textAlign: 'center' }}>
                Book an Appointment
            </h1>

            {/* Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: '#e2e8f0', zIndex: 1, transform: 'translateY(-50%)' }}></div>
                {[
                    { num: 1, label: 'Specialty', icon: <Stethoscope size={18} /> },
                    { num: 2, label: 'Doctor', icon: <User size={18} /> },
                    { num: 3, label: 'Time', icon: <Clock size={18} /> },
                    { num: 4, label: 'Confirm', icon: <CheckCircle size={18} /> }
                ].map(s => (
                    <div key={s.num} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: step >= s.num ? '#4f46e5' : 'white',
                            color: step >= s.num ? 'white' : '#94a3b8',
                            border: `2px solid ${step >= s.num ? '#4f46e5' : '#e2e8f0'}`,
                            fontWeight: 'bold', transition: 'all 0.3s'
                        }}>
                            {s.icon}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: step >= s.num ? 600 : 400, color: step >= s.num ? '#1f2937' : '#94a3b8' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                
                {/* STEP 1: Specialty */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Select a Specialty</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {specialties.map(spec => (
                                <button key={spec.id} onClick={() => handleSpecSelect(spec.id)}
                                    style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                    <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>{spec.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Doctor */}
                {step === 2 && (
                    <div>
                        <button className="btn-icon" onClick={() => setStep(1)} style={{ marginBottom: '1rem', color: '#6b7280' }}>← Back to Specialties</button>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Select a Doctor</h2>
                        {filteredDoctors.length === 0 ? (
                            <p style={{ color: '#ef4444' }}>No doctors found for this specialty.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {filteredDoctors.map(doc => (
                                    <button key={doc.id} onClick={() => handleDoctorSelect(doc)}
                                        style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {doc.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{doc.fullName}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{doc.degree}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 500, marginTop: '0.25rem' }}>Fee: ${doc.consultationFee}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Date & Time */}
                {step === 3 && (
                    <div>
                        <button className="btn-icon" onClick={() => setStep(2)} style={{ marginBottom: '1rem', color: '#6b7280' }}>← Back to Doctors</button>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Select Date & Time</h2>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Date</label>
                            {loading ? (
                                <p>Loading schedules...</p>
                            ) : Object.keys(schedulesByDate).length === 0 ? (
                                <p style={{ color: '#ef4444' }}>This doctor has no available schedules.</p>
                            ) : (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <input 
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        style={{
                                            padding: '0.75rem', 
                                            borderRadius: '0.5rem',
                                            border: '1px solid #d1d5db',
                                            width: '100%',
                                            maxWidth: '300px',
                                            fontSize: '1rem',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {selectedDate && !schedulesByDate[selectedDate] && (
                                        <p style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                            No time slots available on this date. Please select another date.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedDate && schedulesByDate[selectedDate] && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Available Time Slots for {selectedDate}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                    {schedulesByDate[selectedDate].map(sched => (
                                        <button key={sched.id} onClick={() => handleScheduleSelect(sched)}
                                            style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, textAlign: 'center' }}>
                                            {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: Confirm & Symptoms */}
                {step === 4 && (
                    <div>
                        <button className="btn-icon" onClick={() => setStep(3)} style={{ marginBottom: '1rem', color: '#6b7280' }}>← Back to Time Slots</button>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Confirm Details</h2>
                        
                        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Appointment Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Doctor</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{selectedDoctor?.fullName}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Specialty</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{specialties.find(s => s.id === parseInt(selectedSpec))?.name}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Date</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{selectedDate}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Time</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{formatTime(selectedSchedule?.startTime)} - {formatTime(selectedSchedule?.endTime)}</div>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Patient Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Patient Name</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{patientProfile?.fullName}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Phone</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{patientProfile?.phone}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gender / Blood</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{patientProfile?.gender} / {patientProfile?.bloodGroup}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Allergies</div>
                                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{patientProfile?.allergy || 'None'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Describe your symptoms</label>
                            <textarea 
                                className="form-control"
                                rows="4"
                                value={symptom}
                                onChange={(e) => setSymptom(e.target.value)}
                                placeholder="E.g., I have a severe headache and fever..."
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', resize: 'vertical' }}
                                required
                            ></textarea>
                        </div>

                        <button 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '1rem' }}
                            onClick={handleBooking}
                            disabled={loading || !symptom.trim()}
                        >
                            {loading ? 'Processing...' : 'Confirm Appointment'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
