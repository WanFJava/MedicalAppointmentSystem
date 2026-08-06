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
    const [searchSpec, setSearchSpec] = useState('');
    const [searchDoc, setSearchDoc] = useState('');

    // Selection state
    const [selectedSpec, setSelectedSpec] = useState(location.state?.selectedSpec || '');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [schedulesByDate, setSchedulesByDate] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [selectedSlotStr, setSelectedSlotStr] = useState('');
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
                alert("Vui lòng cập nhật thông tin hồ sơ (Số điện thoại, Ngày sinh, Giới tính, Địa chỉ, Nhóm máu) trước khi đặt lịch khám.");
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
                        fetchSchedules(doc.id);

                        const formatT = (t) => {
                            if (!t) return '';
                            if (Array.isArray(t)) return `${t[0].toString().padStart(2, '0')}:${t[1].toString().padStart(2, '0')}`;
                            return t.substring(0, 5);
                        };

                        const startStr = formatT(initialSelectedSchedule.startTime);
                        const endStr = formatT(initialSelectedSchedule.endTime);
                        const d1 = new Date(`1970-01-01T${startStr}:00`);
                        const d2 = new Date(`1970-01-01T${endStr}:00`);

                        if (d2 - d1 === 30 * 60000) {
                            // It's a 30-minute slot, auto-select it
                            setSelectedSchedule(initialSelectedSchedule);
                            setSelectedSlotStr(`${startStr} - ${endStr}`);
                            setStep(4);
                        } else {
                            // It's a longer schedule, user needs to pick a slot
                            setStep(3);
                        }
                    } else {
                        fetchSchedules(doc.id);
                        setStep(3);
                    }
                }
            } else if (location.state?.selectedSpec) {
                // Restore filtered doctors if user navigated back
                const docsFiltered = docs.filter(d => d.specialtyId === parseInt(location.state.selectedSpec) && d.status === 'ACTIVE' && (d.canClinicVisit === true || (d.canClinicVisit == null && d.canHomeVisit !== true)));
                setFilteredDoctors(docsFiltered);
            }
        } catch (error) {
            console.error("Failed to load specialties and doctors", error);
        }
    };

    const handleSpecSelect = (specId) => {
        setSelectedSpec(specId);
        const docs = doctors.filter(d => d.specialtyId === parseInt(specId) && d.status === 'ACTIVE' && (d.canClinicVisit === true || (d.canClinicVisit == null && d.canHomeVisit !== true)));
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
            let data = await getAvailableSchedules(doctorId);
            // Filter to only CLINIC schedules
            data = data.filter(s => s.scheduleType === 'CLINIC');
            
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

    const generateSlots = (schedule) => {
        const slots = [];
        let current = new Date(`1970-01-01T${formatTime(schedule.startTime)}:00Z`);
        const end = new Date(`1970-01-01T${formatTime(schedule.endTime)}:00Z`);
        
        while (current < end) {
            const next = new Date(current.getTime() + 30 * 60000);
            if (next <= end) {
                const slotStart = current.toISOString().substring(11, 16);
                const slotEnd = next.toISOString().substring(11, 16);
                slots.push({
                    schedule: schedule,
                    timeRange: `${slotStart} - ${slotEnd}`
                });
            }
            current = next;
        }
        return slots;
    };

    const getAvailableSlotsForDate = (date) => {
        if (!schedulesByDate[date]) return [];
        let allSlots = [];
        schedulesByDate[date].forEach(sched => {
            allSlots = allSlots.concat(generateSlots(sched));
        });
        return allSlots;
    };

    const handleSlotSelect = (slot) => {
        setSelectedSchedule(slot.schedule);
        setSelectedSlotStr(slot.timeRange);
        setStep(4);
    };

    const handleBooking = async () => {
        if (!selectedSchedule || !symptom.trim()) {
            alert("Vui lòng cung cấp triệu chứng của bạn.");
            return;
        }

        try {
            setLoading(true);
            const response = await bookAppointment(user.id, {
                doctorId: selectedDoctor.id,
                scheduleId: selectedSchedule.id,
                symptom: symptom,
                expectedTime: selectedSlotStr
            });
            setSuccess(true);
        } catch (error) {
            alert("Đặt lịch thất bại. Vui lòng thử lại.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: 'white', padding: '4rem 3rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#111827', fontWeight: 800 }}>Đặt lịch Thành công!</h2>
                <p style={{ color: '#4b5563', marginBottom: '2.5rem', fontSize: '1.125rem', lineHeight: 1.6 }}>
                    Lịch khám của bạn với <strong style={{color: '#1f2937'}}>{selectedDoctor.fullName}</strong> vào ngày <strong style={{color: '#1f2937'}}>{selectedDate}</strong> lúc <strong style={{color: '#1f2937'}}>{selectedSlotStr}</strong> đã được đặt thành công.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/')} style={{ padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>Về Trang chủ</button>
                    <button className="btn-primary" onClick={() => navigate('/my-appointments')} style={{ width: 'auto', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1rem' }}>Xem Lịch hẹn của tôi</button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-container">
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', color: '#111827', textAlign: 'center' }}>
                Đặt lịch Khám
            </h1>

            {/* Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4rem', position: 'relative', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
                <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '4px', backgroundColor: '#e2e8f0', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '24px', left: '10%', width: `${(step - 1) * 33.33}%`, height: '4px', backgroundColor: 'var(--primary-color)', zIndex: 1, transition: 'width 0.4s ease' }}></div>

                {[
                    { num: 1, label: 'Chuyên khoa', icon: <Stethoscope size={24} /> },
                    { num: 2, label: 'Bác sĩ', icon: <User size={24} /> },
                    { num: 3, label: 'Thời gian', icon: <Clock size={24} /> },
                    { num: 4, label: 'Xác nhận', icon: <CheckCircle size={24} /> }
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
                            ← Quay lại
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827', textAlign: 'center' }}>Chọn Chuyên khoa Y tế</h2>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm chuyên khoa..." 
                                value={searchSpec}
                                onChange={e => setSearchSpec(e.target.value)}
                                style={{ width: '100%', maxWidth: '500px', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {specialties.filter(spec => spec.name.toLowerCase().includes(searchSpec.toLowerCase())).map(spec => (
                                <div key={spec.id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '0.5rem',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid #e2e8f0',
                                    transition: 'transform 0.2s, boxShadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
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
                                    <div style={{ padding: '1.5rem', flex: '1 1 300px', display: 'flex', gap: '1.5rem', borderRight: '1px solid #e2e8f0', alignItems: 'center' }}>
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
                                    <div style={{ padding: '1.5rem', flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                            ← Quay lại Chọn chuyên khoa
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827' }}>Chọn Bác sĩ</h2>
                        <div style={{ marginBottom: '2rem' }}>
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm bác sĩ..." 
                                value={searchDoc}
                                onChange={e => setSearchDoc(e.target.value)}
                                style={{ width: '100%', maxWidth: '500px', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        {filteredDoctors.filter(doc => doc.fullName.toLowerCase().includes(searchDoc.toLowerCase())).length === 0 ? (
                            <div style={{ padding: '3rem', backgroundColor: '#fef2f2', border: '2px dashed #fca5a5', borderRadius: '1rem', textAlign: 'center' }}>
                                <p style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: 500 }}>Không tìm thấy bác sĩ nào phù hợp.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {filteredDoctors.filter(doc => doc.fullName.toLowerCase().includes(searchDoc.toLowerCase())).map(doc => (
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
                            ← {preselectDoctorId ? 'Quay lại' : 'Quay lại Chọn bác sĩ'}
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827' }}>Chọn Ngày & Giờ</h2>

                        <div style={{ marginBottom: '2.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, color: '#374151', fontSize: '1.125rem' }}>Chọn Ngày</label>
                            {loading ? (
                                <p style={{ color: '#6b7280' }}>Đang tải lịch khám...</p>
                            ) : Object.keys(schedulesByDate).length === 0 ? (
                                <p style={{ color: '#ef4444', fontWeight: 500 }}>Bác sĩ này hiện chưa có lịch khám nào.</p>
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
                                            Không có khung giờ nào trống trong ngày này. Vui lòng chọn ngày khác.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedDate && schedulesByDate[selectedDate] && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700, color: '#374151', fontSize: '1.125rem' }}>Các khung giờ trống ngày {selectedDate}</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {getAvailableSlotsForDate(selectedDate).map((slot, index) => (
                                        <button key={index} className="time-slot-btn" onClick={() => handleSlotSelect(slot)}>
                                            {slot.timeRange}
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
                            ← {(preselectDoctorId && initialSelectedDate && initialSelectedSchedule) ? 'Quay lại' : 'Quay lại Chọn khung giờ'}
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827' }}>Xác nhận Chi tiết Lịch hẹn</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Stethoscope size={20} color="var(--primary-color)" /> Thông tin Lịch hẹn
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Bác sĩ</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{selectedDoctor?.fullName}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Chuyên khoa</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{specialties.find(s => s.id === parseInt(selectedSpec))?.name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Ngày</div>
                                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{selectedDate}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Thời gian</div>
                                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{selectedSlotStr}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Phí khám bệnh</div>
                                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.25rem' }}>{selectedDoctor?.consultationFee} VNĐ</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={20} color="var(--primary-color)" /> Thông tin Bệnh nhân
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Tên Bệnh nhân</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.fullName}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Số điện thoại</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.phone}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Giới tính</div>
                                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.gender}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nhóm máu</div>
                                            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.125rem' }}>{patientProfile?.bloodGroup}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Dị ứng</div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>{patientProfile?.allergy || 'Không'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, color: '#111827', fontSize: '1.125rem' }}>Mô tả triệu chứng của bạn <span style={{color: '#ef4444'}}>*</span></label>
                            <textarea
                                value={symptom}
                                onChange={(e) => setSymptom(e.target.value)}
                                placeholder="VD: Tôi bị đau đầu dữ dội và sốt cao..."
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
                            {loading ? 'Đang xử lý...' : (
                                <>
                                    Xác nhận & Đặt lịch <CheckCircle size={20} />
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
