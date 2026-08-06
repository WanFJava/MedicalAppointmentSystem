import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Activity, Heart, MapPin, Calendar, CheckSquare, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAvailableSchedules } from '../api/appointmentApi';

const HomeVisitDoctorCard = ({ doc, onDoctorSelect }) => {
    const navigate = useNavigate();
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);

    const [schedulesByDate, setSchedulesByDate] = React.useState({});
    const [dates, setDates] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState('');

    React.useEffect(() => {
        const fetchSchedules = async () => {
            try {
                let schedules = await getAvailableSchedules(doc.id);
                schedules = schedules.filter(s => s.scheduleType === 'HOME');
                const grouped = schedules.reduce((acc, curr) => {
                    if (!acc[curr.date]) acc[curr.date] = [];
                    acc[curr.date].push(curr);
                    return acc;
                }, {});
                setSchedulesByDate(grouped);
                const sortedDates = Object.keys(grouped).sort();
                setDates(sortedDates);
                if (sortedDates.length > 0) {
                    setSelectedDate(sortedDates[0]);
                }
            } catch (error) {
                console.error("Error fetching schedules for doctor", doc.id, error);
            }
        };
        fetchSchedules();
    }, [doc.id]);

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    return (
        <div style={{
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
            marginBottom: '1.5rem',
            cursor: 'pointer'
        }}
        onClick={() => navigate(`/home-visit-doctor/${doc.id}`)}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.05)'; }}
        >
            {/* LEFT COLUMN: Avatar & Doctor Info */}
            <div style={{ padding: '1.5rem', flex: '1 1 300px', display: 'flex', gap: '1.5rem', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: '0.5rem', border: '3px solid #e0e7ff' }}>
                        {doc.avatar ? (
                            <img src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '2rem', fontWeight: 'bold' }}>
                                {doc.fullName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <span style={{ color: '#0ea5e9', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Xem thêm</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {user && user.role === 'PATIENT' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id); }}
                                style={{
                                    background: favoriteDoctorIds?.has(doc.id) ? '#fbbf24' : 'transparent',
                                    border: `1px solid ${favoriteDoctorIds?.has(doc.id) ? '#fbbf24' : '#d1d5db'}`,
                                    borderRadius: '1rem',
                                    padding: '0.15rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    color: favoriteDoctorIds?.has(doc.id) ? 'white' : '#6b7280',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    fontSize: '0.75rem', fontWeight: '600'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Heart size={14} fill={favoriteDoctorIds?.has(doc.id) ? 'white' : 'none'} color={favoriteDoctorIds?.has(doc.id) ? 'white' : '#9ca3af'} />
                                Yêu thích
                            </button>
                        )}
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0ea5e9', margin: 0 }}>
                            {doc.degree ? `${doc.degree} ` : ''}{doc.fullName}
                        </h3>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                        {doc.experience ? `Bác sĩ có ${doc.experience} năm kinh nghiệm` : 'Bác sĩ chuyên khoa'}
                    </div>

                    {doc.specialtyName && (
                        <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                            Chuyên khoa: {doc.specialtyName}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Schedule & Clinic Info */}
            <div style={{ padding: '1.5rem', flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#4b5563', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                            <Calendar size={16} /> Lịch khám
                        </div>
                        {dates.length > 0 && (
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    padding: '0.25rem 0.5rem', border: 'none', background: 'transparent',
                                    color: '#0ea5e9', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', outline: 'none'
                                }}
                            >
                                {dates.map(date => (
                                    <option key={date} value={date}>{date}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {dates.length === 0 ? (
                            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Chưa có lịch khám nào trong thời gian tới.</div>
                        ) : schedulesByDate[selectedDate]?.length > 0 ? (
                            schedulesByDate[selectedDate].map(sched => (
                                <button key={sched.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (user) {
                                            navigate('/book-home-visit', { state: { preselectDoctor: doc.id, selectedDate: selectedDate, selectedSchedule: sched } });
                                        } else {
                                            navigate('/login');
                                        }
                                    }}
                                    style={{
                                        background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none',
                                        fontSize: '0.85rem', fontWeight: '600', color: '#334155', cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                >
                                    {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                                </button>
                            ))
                        ) : (
                            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Không có lịch vào ngày này.</div>
                        )}
                    </div>

                    {dates.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#6b7280' }}>
                            Chọn <CheckSquare size={12} /> và đặt (Phí đặt lịch 0đ)
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div>
                        <span style={{ fontWeight: '600', color: '#4b5563' }}>GIÁ KHÁM: </span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{doc.consultationFee?.toLocaleString('vi-VN')}đ</span>
                        <span style={{ color: '#0ea5e9', marginLeft: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>Xem chi tiết</span>
                    </div>
                    {onDoctorSelect && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDoctorSelect(doc); }}
                            style={{
                                backgroundColor: '#0ea5e9', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.5rem',
                                border: 'none', fontWeight: '600', cursor: 'pointer', width: 'fit-content', marginTop: '0.5rem',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0ea5e9'}
                        >
                            Chọn Bác sĩ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomeVisitDoctorCard;
