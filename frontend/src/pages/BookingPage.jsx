import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, CheckCircle, ChevronRight, Stethoscope, User, Clock, ArrowRight, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getSpecialties, getDoctors } from '../api/adminApi';
import { getAvailableSchedules, bookAppointment } from '../api/appointmentApi';
import DoctorCard from '../components/DoctorCard';
import { getPatientProfile } from '../api/patientApi';

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
    const [selectedSpec, setSelectedSpec] = useState(location.state?.selectedSpec || '');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [schedulesByDate, setSchedulesByDate] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [symptom, setSymptom] = useState('');
    const [patientProfile, setPatientProfile] = useState(null);

    const [step, setStep] = useState(location.state?.step || 1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Sync step and selectedSpec to history state so it's preserved when navigating back
    useEffect(() => {
        if (step !== (location.state?.step || 1) || selectedSpec !== (location.state?.selectedSpec || '')) {
            navigate(location.pathname, {
                replace: true,
                state: { ...location.state, step, selectedSpec }
            });
        }
    }, [step, selectedSpec, navigate, location.pathname, location.state]);

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
            } else if (location.state?.selectedSpec) {
                // Restore filtered doctors if user navigated back
                const docsFiltered = docs.filter(d => d.specialtyId === parseInt(location.state.selectedSpec) && d.status === 'ACTIVE');
                setFilteredDoctors(docsFiltered);
            }
        } catch (error) {
            console.error("Failed to load specialties and doctors", error);
        }
    };

    const handleSpecSelect = (specId) => {
        setSelectedSpec(specId);
        const docs = doctors.filter(d => d.specialtyId === parseInt(specId) && d.status === 'ACTIVE');
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
            alert(error.response?.data?.message || "Booking failed. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: 'white', padding: '4rem 3rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#111827', fontWeight: 800 }}>Booking Successful!</h2>
                <p style={{ color: '#4b5563', marginBottom: '2.5rem', fontSize: '1.125rem', lineHeight: 1.6 }}>
                    Your appointment with <strong style={{color: '#1f2937'}}>{selectedDoctor.fullName}</strong> on <strong style={{color: '#1f2937'}}>{selectedDate}</strong> at <strong style={{color: '#1f2937'}}>{formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}</strong> has been placed.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>Back to Home</button>
                    <button className="btn-primary" onClick={() => navigate('/my-appointments')} style={{ width: 'auto', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1rem' }}>View My Appointments</button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-container">
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', color: '#111827', textAlign: 'center' }}>
                Book an Appointment
            </h1>

            {/* Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4rem', position: 'relative', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
                <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '4px', backgroundColor: '#e2e8f0', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '24px', left: '10%', width: `${(step - 1) * 33.33}%`, height: '4px', backgroundColor: 'var(--primary-color)', zIndex: 1, transition: 'width 0.4s ease' }}></div>

                {[
                    { num: 1, label: 'Specialty', icon: <Stethoscope size={24} /> },
                    { num: 2, label: 'Doctor', icon: <User size={24} /> },
                    { num: 3, label: 'Time', icon: <Clock size={24} /> },
                    { num: 4, label: 'Confirm', icon: <CheckCircle size={24} /> }
                ].map(s => (
                    <div key={s.num} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: step >= s.num ? 'var(--primary-color)' : 'white',
                            color: step >= s.num ? 'white' : '#94a3b8',
                            border: `3px solid ${step >= s.num ? 'var(--primary-color)' : '#e2e8f0'}`,
                            boxShadow: step >= s.num ? '0 10px 15px -3px rgba(79, 70, 229, 0.3)' : 'none',
                            transition: 'all 0.4s ease'
                        }}>
                            {s.icon}
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: step >= s.num ? 700 : 500, color: step >= s.num ? '#1f2937' : '#94a3b8', transition: 'color 0.4s ease' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="booking-main-card">

                {/* STEP 1: Specialty */}
                {step === 1 && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <button onClick={() => {
                            if (window.history.state && window.history.state.idx > 0) {
                                navigate(-1);
                            } else {
                                navigate('/');
                            }
                        }} style={{ marginBottom: '1.5rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: 0 }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = '#6b7280'}>
                            ← Back
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827', textAlign: 'center' }}>Select a Medical Specialty</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {specialties.map(spec => (
                                <div key={spec.id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '0.5rem',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid #e2e8f0',
                                    transition: 'transform 0.2s, boxShadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'stretch',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleSpecSelect(spec.id)}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                    const arrow = e.currentTarget.querySelector('.arrow-icon');
                                    if (arrow) arrow.style.transform = 'translateX(5px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.05)';
                                    const arrow = e.currentTarget.querySelector('.arrow-icon');
                                    if (arrow) arrow.style.transform = 'translateX(0)';
                                }}
                                >
                                    {/* LEFT COLUMN: Icon & Title */}
                                    <div style={{ padding: '1.5rem', flex: '1 1 45%', display: 'flex', gap: '1.5rem', borderRight: '1px solid #e2e8f0', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                                            <div style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                backgroundColor: '#e0e7ff',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginBottom: '0.5rem',
                                                border: '3px solid #c7d2fe',
                                                color: '#4f46e5'
                                            }}>
                                                <Activity size={48} />
                                            </div>
                                            <span style={{ color: '#0ea5e9', fontSize: '0.875rem', fontWeight: '500' }}>Chọn</span>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0ea5e9', margin: 0 }}>
                                                {spec.name}
                                            </h3>
                                            <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.25rem' }}>
                                                Chuyên khoa
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: Description & Action */}
                                    <div style={{ padding: '1.5rem', flex: '1 1 55%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                            {spec.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Doctor */}
                {step === 2 && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <button onClick={() => setStep(1)} style={{ marginBottom: '1.5rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: 0 }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = '#6b7280'}>
                            ← Back to Specialties
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827' }}>Select a Doctor</h2>
                        {filteredDoctors.length === 0 ? (
                            <div style={{ padding: '3rem', backgroundColor: '#fef2f2', border: '2px dashed #fca5a5', borderRadius: '1rem', textAlign: 'center' }}>
                                <p style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: 500 }}>No doctors found for this specialty.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {filteredDoctors.map(doc => (
                                    <DoctorCard key={doc.id} doc={doc} onDoctorSelect={handleDoctorSelect} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Date & Time */}
                {step === 3 && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <button onClick={() => {
                            if (preselectDoctorId) {
                                if (window.history.state && window.history.state.idx > 0) navigate(-1);
                                else navigate('/');
                            } else {
                                setStep(2);
                            }
                        }} style={{ marginBottom: '1.5rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: 0 }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = '#6b7280'}>
                            ← {preselectDoctorId ? 'Back' : 'Back to Doctors'}
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#111827' }}>Select Date & Time</h2>
                        <p style={{ marginBottom: '2rem', color: '#64748b' }}>
                            Lịch khám cần được đặt trước ít nhất 24 giờ.
                        </p>

                        <div style={{ marginBottom: '2.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, color: '#374151', fontSize: '1.125rem' }}>Select Date</label>
                            {loading ? (
                                <p style={{ color: '#6b7280' }}>Loading schedules...</p>
                            ) : Object.keys(schedulesByDate).length === 0 ? (
                                <p style={{ color: '#ef4444', fontWeight: 500 }}>This doctor has no available schedules at the moment.</p>
                            ) : (
                                <div>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: '2px solid #cbd5e1',
                                            width: '100%',
                                            maxWidth: '350px',
                                            fontSize: '1.125rem',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            fontWeight: 500,
                                            color: '#1f2937'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                                        onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                    {selectedDate && !schedulesByDate[selectedDate] && (
                                        <p style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 500 }}>
                                            No time slots available on this date. Please select another date.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedDate && schedulesByDate[selectedDate] && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700, color: '#374151', fontSize: '1.125rem' }}>Available Time Slots for {selectedDate}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {schedulesByDate[selectedDate].map(sched => (
                                        <button key={sched.id} className="time-slot-btn" onClick={() => handleScheduleSelect(sched)}>
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
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <button onClick={() => {
                            if (preselectDoctorId && initialSelectedDate && initialSelectedSchedule) {
                                if (window.history.state && window.history.state.idx > 0) navigate(-1);
                                else navigate('/');
                            } else {
                                setStep(3);
                            }
                        }} style={{ marginBottom: '1.5rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: 0 }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary-color)'} onMouseOut={e => e.currentTarget.style.color = '#6b7280'}>
                            ← {(preselectDoctorId && initialSelectedDate && initialSelectedSchedule) ? 'Back' : 'Back to Time Slots'}
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827' }}>Confirm Appointment Details</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Stethoscope size={20} color="var(--primary-color)" /> Appointment Info
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Doctor</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{selectedDoctor?.fullName}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Specialty</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{specialties.find(s => s.id === parseInt(selectedSpec))?.name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Date</div>
                                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{selectedDate}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Time</div>
                                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{formatTime(selectedSchedule?.startTime)} - {formatTime(selectedSchedule?.endTime)}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Consultation Fee</div>
                                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.25rem' }}>${selectedDoctor?.consultationFee}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={20} color="var(--primary-color)" /> Patient Info
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Patient Name</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.fullName}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Phone Number</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.phone}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Gender</div>
                                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.gender}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Blood Group</div>
                                            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.125rem' }}>{patientProfile?.bloodGroup}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Allergies</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.allergy || 'None'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>Describe your symptoms <span style={{color: '#ef4444'}}>*</span></label>
                            <textarea
                                value={symptom}
                                onChange={(e) => setSymptom(e.target.value)}
                                placeholder="E.g., I have a severe headache and fever..."
                                style={{ width: '100%', padding: '1.25rem', border: '2px solid #e2e8f0', borderRadius: '1rem', resize: 'vertical', minHeight: '120px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                required
                            ></textarea>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem', borderRadius: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
                            onClick={handleBooking}
                            disabled={loading || !symptom.trim()}
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    Confirm & Book Appointment <CheckCircle size={20} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
