import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Stethoscope, User, CalendarDays, Activity, Check, MapPin, Clock, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getSpecialties, getDoctors } from '../api/adminApi';
import { getAvailableSchedules, bookHomeVisit } from '../api/appointmentApi';
import HomeVisitDoctorCard from '../components/HomeVisitDoctorCard';
import { getPatientProfile } from '../api/patientApi';

const BookHomeVisit = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Data
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [schedulesByDate, setSchedulesByDate] = useState({});
    
    // Patient
    const [patientProfile, setPatientProfile] = useState(null);

    // Selections
    const [step, setStep] = useState(1);
    const [selectedSpec, setSelectedSpec] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [desiredStartTime, setDesiredStartTime] = useState('');
    const [desiredEndTime, setDesiredEndTime] = useState('');
    const [symptom, setSymptom] = useState('');
    const [homeAddress, setHomeAddress] = useState('');
    const [searchSpec, setSearchSpec] = useState('');
    const [searchDoc, setSearchDoc] = useState('');

    // State
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (desiredStartTime) {
            const [hours, minutes] = desiredStartTime.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0, 0);
            startDate.setMinutes(startDate.getMinutes() + 30);
            const endHours = startDate.getHours().toString().padStart(2, '0');
            const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
            setDesiredEndTime(`${endHours}:${endMinutes}`);
        }
    }, [desiredStartTime]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchInitialData();
    }, [user, navigate]);

    const fetchInitialData = async () => {
        try {
            const profile = await getPatientProfile(user.id);
            if (!profile.birthday || !profile.gender || !profile.address || !profile.bloodGroup || !profile.phone) {
                alert("Vui lòng cập nhật thông tin hồ sơ trước khi đặt khám tại nhà.");
                navigate('/profile');
                return;
            }
            setPatientProfile(profile);
            setHomeAddress(profile.address); // default to profile address

            const [specs, docs] = await Promise.all([getSpecialties(), getDoctors()]);
            setSpecialties(specs);
            setDoctors(docs);
            
            const preselectDoctorId = location.state?.preselectDoctor;
            if (preselectDoctorId) {
                const doc = docs.find(d => d.id === preselectDoctorId);
                if (doc) {
                    setSelectedSpec(doc.specialtyId);
                    // Manually fetch schedules and select doctor
                    setSelectedDoctor(doc);
                    setStep(3);
                    let data = await getAvailableSchedules(doc.id);
                    data = data.filter(s => s.scheduleType === 'HOME');
                    const grouped = data.reduce((acc, curr) => {
                        if (!acc[curr.date]) acc[curr.date] = [];
                        acc[curr.date].push(curr);
                        return acc;
                    }, {});
                    setSchedulesByDate(grouped);
                    const dates = Object.keys(grouped).sort();
                    setAvailableDates(dates);
                    
                    if (location.state?.selectedDate && location.state?.selectedSchedule) {
                        setSelectedDate(location.state.selectedDate);
                        setSelectedScheduleId(location.state.selectedSchedule.id);
                    } else if (dates.length > 0) {
                        setSelectedDate(dates[0]);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load initial data", error);
        }
    };

    const handleSpecSelect = (specId) => {
        setSelectedSpec(specId);
        // Only show doctors that CAN home visit
        const docs = doctors.filter(d => d.specialtyId === parseInt(specId) && d.status === 'ACTIVE' && d.canHomeVisit === true);
        setFilteredDoctors(docs);
        setSelectedDoctor(null);
        setStep(2);
    };

    const handleDoctorSelect = async (doc) => {
        setSelectedDoctor(doc);
        setStep(3);
        try {
            setLoading(true);
            let data = await getAvailableSchedules(doc.id);
            // ONLY HOME schedules
            data = data.filter(s => s.scheduleType === 'HOME');
            
            const grouped = data.reduce((acc, curr) => {
                if (!acc[curr.date]) acc[curr.date] = [];
                acc[curr.date].push(curr);
                return acc;
            }, {});
            
            setSchedulesByDate(grouped);
            const dates = Object.keys(grouped).sort();
            setAvailableDates(dates);
            if (dates.length > 0) setSelectedDate(dates[0]);
        } catch (error) {
            console.error("Error fetching schedules", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        if (Array.isArray(timeStr)) {
            return `${timeStr[0].toString().padStart(2, '0')}:${timeStr[1].toString().padStart(2, '0')}`;
        }
        return timeStr.substring(0, 5);
    };

    const generateHomeSlots = () => {
        if (!selectedDate || !selectedScheduleId) return [];
        const schedule = schedulesByDate[selectedDate]?.find(s => s.id === selectedScheduleId);
        if (!schedule) return [];

        const slots = [];
        const start = new Date(`1970-01-01T${schedule.startTime}`);
        const end = new Date(`1970-01-01T${schedule.endTime}`);
        let current = start;

        const now = new Date();
        
        while (current < end) {
            const next = new Date(current.getTime() + 30 * 60000);
            if (next > end) break;
            
            const startStr = current.toTimeString().substring(0, 5);
            const endStr = next.toTimeString().substring(0, 5);
            
            const slotStartDateTime = new Date(`${selectedDate}T${startStr}:00`);
            const diffHours = (slotStartDateTime - now) / (1000 * 60 * 60);
            
            if (diffHours >= 1) {
                slots.push({ start: startStr, end: endStr });
            }
            
            current = next;
        }
        return slots;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!selectedDate || !selectedScheduleId || !desiredStartTime || !desiredEndTime || !symptom.trim() || !homeAddress.trim()) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
            return;
        }

        const schedule = schedulesByDate[selectedDate]?.find(s => s.id === selectedScheduleId);
        if (!schedule) {
            alert("Vui lòng chọn ca khám hợp lệ.");
            return;
        }

        const schedStart = formatTime(schedule.startTime);
        const schedEnd = formatTime(schedule.endTime);
        if (desiredStartTime < schedStart || desiredEndTime > schedEnd || desiredStartTime >= desiredEndTime) {
            alert(`Khoảng thời gian mong muốn phải nằm trong ca làm việc của bác sĩ (${schedStart} - ${schedEnd}) và hợp lệ.`);
            return;
        }

        const startObj = new Date(`1970-01-01T${desiredStartTime}:00`);
        const endObj = new Date(`1970-01-01T${desiredEndTime}:00`);
        if (endObj - startObj < 30 * 60000) {
            alert("Khoảng thời gian mong muốn phải kéo dài ít nhất 30 phút.");
            return;
        }

        const now = new Date();
        const desiredStart = new Date(`${selectedDate}T${desiredStartTime}:00`);
        const diffHours = (desiredStart - now) / (1000 * 60 * 60);
        if (diffHours < 1) {
            alert("Bạn cần đặt lịch ít nhất 1 giờ trước thời gian mong muốn để phòng khám có đủ thời gian sắp xếp bác sĩ và lộ trình di chuyển. Vui lòng chọn khoảng thời gian khác hoặc ngày khác.");
            return;
        }

        const formattedExpectedTime = `${desiredStartTime} - ${desiredEndTime}`;

        try {
            setLoading(true);
            const payload = {
                patientId: patientProfile.id,
                patientName: patientProfile.fullName,
                patientPhone: patientProfile.phone,
                patientDob: patientProfile.birthday,
                patientAddress: patientProfile.address,
                doctorId: selectedDoctor.id,
                scheduleId: schedule.id, // Pick the HOME schedule ID
                symptom: symptom,
                homeAddress: homeAddress,
                expectedTime: formattedExpectedTime, // Send the time range as string
                travelFee: 0,
                note: ''
            };
            
            await bookHomeVisit(payload);
            setSuccess(true);
        } catch (error) {
            console.error("Error booking home visit", error);
            const msg = error.response?.data?.message || error.response?.data || "Gửi yêu cầu thất bại. Vui lòng thử lại sau.";
            alert("Lỗi: " + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: 'white', padding: '4rem 3rem', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={40} color="#10b981" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#111827', fontWeight: 800 }}>Đã gửi Yêu cầu Khám tại nhà!</h2>
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}><strong>Bác sĩ:</strong> {selectedDoctor.fullName}</p>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}><strong>Ngày hẹn:</strong> {selectedDate}</p>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}><strong>Giờ dự kiến mong muốn:</strong> {desiredStartTime} - {desiredEndTime}</p>
                    <p style={{ margin: 0, color: '#4b5563' }}><strong>Địa chỉ:</strong> {homeAddress}</p>
                </div>
                <p style={{ color: '#6b7280', marginBottom: '2.5rem', fontSize: '1rem' }}>
                    Yêu cầu của bạn đã được ghi nhận. Lễ tân phòng khám sẽ sớm liên hệ qua số điện thoại <strong>{patientProfile?.phone}</strong> để xác nhận giờ đến chính xác của bác sĩ.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/')} className="btn-secondary">Về Trang chủ</button>
                    <button onClick={() => navigate('/my-appointments')} className="btn-primary">Xem Lịch hẹn của tôi</button>
                </div>
            </div>
        );
    }

    const filteredSpecialties = specialties.filter(spec => spec.name.toLowerCase().includes(searchSpec.toLowerCase()));
    const searchedDoctors = filteredDoctors.filter(doc => doc.fullName.toLowerCase().includes(searchDoc.toLowerCase()));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <Activity color="#4f46e5" size={40} /> Khám Tại Nhà
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.125rem', marginTop: '0.5rem' }}>
                    Bác sĩ chuyên khoa đến tận nơi, chăm sóc sức khỏe cho bạn và gia đình.
                </p>
            </div>

            {/* Progress Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
                {[
                    { id: 1, name: 'Chuyên khoa', icon: Stethoscope },
                    { id: 2, name: 'Bác sĩ', icon: User },
                    { id: 3, name: 'Gửi yêu cầu', icon: CalendarDays }
                ].map(tab => (
                    <div 
                        key={tab.id}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            color: step === tab.id ? '#4f46e5' : (step > tab.id ? '#10b981' : '#94a3b8'),
                            fontWeight: step >= tab.id ? 700 : 500,
                            cursor: step > tab.id ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                        }}
                        onClick={() => step > tab.id && setStep(tab.id)}
                    >
                        <tab.icon size={20} />
                        <span>{tab.name}</span>
                        {step > tab.id && <Check size={16} />}
                        {tab.id !== 3 && <ChevronRight size={16} style={{ color: '#cbd5e1', margin: '0 0.5rem' }} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Specialty */}
            {step === 1 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm chuyên khoa..." 
                            value={searchSpec}
                            onChange={e => setSearchSpec(e.target.value)}
                            style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '1.125rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    {filteredSpecialties.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '1rem' }}>
                            <p style={{ color: '#64748b', fontSize: '1.125rem' }}>Không tìm thấy chuyên khoa nào phù hợp.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                            {filteredSpecialties.map(spec => (
                                <div 
                                    key={spec.id}
                                    onClick={() => handleSpecSelect(spec.id)}
                                    style={{
                                        padding: '2rem',
                                        backgroundColor: 'white',
                                        borderRadius: '1.5rem',
                                        border: '2px solid #f1f5f9',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: '1.5rem',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                                >
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                        <Stethoscope size={40} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{spec.name}</h3>
                                        <p style={{ fontSize: '1rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>Nhấn để chọn</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Doctor */}
            {step === 2 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm bác sĩ theo tên..." 
                            value={searchDoc}
                            onChange={e => setSearchDoc(e.target.value)}
                            style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '1.125rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }}>Quay lại</button>
                    </div>
                    {searchedDoctors.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '1rem' }}>
                            <p style={{ color: '#64748b', fontSize: '1.125rem' }}>Không tìm thấy bác sĩ nào phù hợp.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {searchedDoctors.map(doc => (
                                <HomeVisitDoctorCard key={doc.id} doc={doc} onDoctorSelect={handleDoctorSelect} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Request Form */}
            {step === 3 && (
                <form onSubmit={handleBooking} style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={30} color="#475569" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Bác sĩ {selectedDoctor?.fullName}</h3>
                            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{selectedDoctor?.specialtyName}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                                Ngày khám mong muốn <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            {loading ? (
                                <p style={{ color: '#64748b' }}>Đang tải lịch bác sĩ...</p>
                            ) : availableDates.length === 0 ? (
                                <p style={{ color: '#ef4444', fontWeight: 500, backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                    Bác sĩ này hiện chưa có lịch khám tại nhà nào.
                                </p>
                            ) : (
                                <select
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', backgroundColor: '#f8fafc' }}
                                    required
                                >
                                    {availableDates.map(date => (
                                        <option key={date} value={date}>{date}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} color="#4f46e5" /> Ca khám (theo lịch bác sĩ) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            
                            {selectedDate && schedulesByDate[selectedDate] ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                    {schedulesByDate[selectedDate].map(sched => {
                                        const range = `${formatTime(sched.startTime)} - ${formatTime(sched.endTime)}`;
                                        return (
                                            <div 
                                                key={sched.id}
                                                onClick={() => setSelectedScheduleId(sched.id)} // Store schedule ID
                                                style={{ 
                                                    padding: '0.75rem', 
                                                    border: `2px solid ${selectedScheduleId === sched.id ? '#4f46e5' : '#e2e8f0'}`, 
                                                    borderRadius: '0.5rem', 
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    backgroundColor: selectedScheduleId === sched.id ? '#eef2ff' : 'white',
                                                    color: selectedScheduleId === sched.id ? '#4f46e5' : '#475569',
                                                    fontWeight: selectedScheduleId === sched.id ? 600 : 500,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {range}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Vui lòng chọn ngày trước.</div>
                            )}
                            
                        </div>
                    </div>

                    {selectedScheduleId && (
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} color="#4f46e5" /> Khoảng thời gian mong muốn bác sĩ đến <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            
                            {generateHomeSlots().length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Đề xuất các khung giờ hợp lệ:</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {generateHomeSlots().map((slot, index) => {
                                            const isSelected = desiredStartTime === slot.start && desiredEndTime === slot.end;
                                            return (
                                                <div 
                                                    key={index}
                                                    onClick={() => {
                                                        setDesiredStartTime(slot.start);
                                                        setDesiredEndTime(slot.end);
                                                    }}
                                                    style={{ 
                                                        padding: '0.5rem 1rem', 
                                                        border: `1px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`, 
                                                        borderRadius: '0.5rem', 
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? '#eef2ff' : 'white',
                                                        color: isSelected ? '#4f46e5' : '#475569',
                                                        fontWeight: isSelected ? 600 : 500,
                                                        fontSize: '0.9rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {slot.start} - {slot.end}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Hoặc tự nhập (ít nhất 30 phút):</p>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input 
                                    type="time" 
                                    value={desiredStartTime}
                                    onChange={(e) => setDesiredStartTime(e.target.value)}
                                    style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                    required
                                />
                                <span style={{ fontWeight: 600, color: '#475569' }}>đến</span>
                                <input 
                                    type="time" 
                                    value={desiredEndTime}
                                    onChange={(e) => setDesiredEndTime(e.target.value)}
                                    style={{ padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                                    required
                                />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem' }}>* Lễ tân sẽ liên hệ để chốt giờ khám chính xác trong khoảng thời gian này. Lưu ý: Cần đặt trước ít nhất 1 giờ.</p>
                        </div>
                    )}

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} color="#4f46e5" /> Địa chỉ nhà <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={homeAddress}
                            onChange={(e) => setHomeAddress(e.target.value)}
                            required
                            placeholder="Nhập địa chỉ nhà chi tiết để bác sĩ đến khám"
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: '3rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>
                            Triệu chứng bệnh / Ghi chú <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <textarea
                            value={symptom}
                            onChange={(e) => setSymptom(e.target.value)}
                            required
                            placeholder="Mô tả các triệu chứng bạn đang gặp phải..."
                            style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', minHeight: '120px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={() => setStep(2)} className="btn-secondary" disabled={loading}>
                            Quay lại
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={loading || availableDates.length === 0}
                            style={{ padding: '0.875rem 2rem', fontSize: '1.125rem' }}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu Khám'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default BookHomeVisit;
