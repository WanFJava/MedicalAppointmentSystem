import React, { useState, useEffect } from 'react';
import { getDoctors } from '../../api/adminApi';
import { getAllSchedules } from '../../api/appointmentApi';
import { Search, Clock, Calendar, CheckCircle, XCircle, User, Users } from 'lucide-react';
import Swal from 'sweetalert2';

const ReceptionistDoctorManager = () => {
    const [doctors, setDoctors] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visitTypeFilter, setVisitTypeFilter] = useState('ALL');
    const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
        // Cập nhật lại trạng thái mỗi phút
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorsData, schedulesData] = await Promise.all([
                getDoctors(),
                getAllSchedules(selectedDate)
            ]);
            
            setDoctors(doctorsData.filter(d => d.status === 'ACTIVE'));
            setSchedules(schedulesData);
        } catch (error) {
            console.error("Error fetching data:", error);
            Swal.fire('Lỗi', 'Không thể tải dữ liệu bác sĩ', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getDoctorStatusInfo = (doctorId) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const docSchedules = schedules.filter(s => s.doctorId === doctorId && s.status !== 'CANCELLED');
        
        if (docSchedules.length === 0) {
            return { status: 'OFF', label: 'Nghỉ / Không có lịch', color: '#ef4444', bg: '#fee2e2' };
        }

        // Kiểm tra xem có đang bận không (có ca khám đang diễn ra)
        let isBusy = false;
        let currentSch = null;

        for (const sch of docSchedules) {
            let startH, startM, endH, endM;
            if (Array.isArray(sch.startTime)) {
                startH = sch.startTime[0]; startM = sch.startTime[1];
            } else {
                [startH, startM] = sch.startTime.split(':').map(Number);
            }
            if (Array.isArray(sch.endTime)) {
                endH = sch.endTime[0]; endM = sch.endTime[1];
            } else {
                [endH, endM] = sch.endTime.split(':').map(Number);
            }

            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;

            if (currentTime >= startMins && currentTime <= endMins) {
                isBusy = true;
                currentSch = sch;
                break;
            }
        }

        if (isBusy) {
            return { status: 'BUSY', label: 'Đang bận khám', color: '#b45309', bg: '#fef3c7', currentSch };
        }

        // Kiểm tra xem còn ca nào trong tương lai không
        const hasUpcoming = docSchedules.some(sch => {
            let startH, startM;
            if (Array.isArray(sch.startTime)) {
                startH = sch.startTime[0]; startM = sch.startTime[1];
            } else {
                [startH, startM] = sch.startTime.split(':').map(Number);
            }
            const startMins = startH * 60 + startM;
            return startMins > currentTime && sch.currentPatient < sch.maxPatient;
        });

        if (hasUpcoming) {
            return { status: 'AVAILABLE', label: 'Có slot trống', color: '#059669', bg: '#d1fae5' };
        }

        return { status: 'FULL', label: 'Kín lịch / Đã kết thúc', color: '#4b5563', bg: '#f3f4f6' };
    };

    const filteredDoctors = doctors.filter(d => {
        const matchSearch = d.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            d.specialtyName?.toLowerCase().includes(searchTerm.toLowerCase());
        let matchType = true;
        if (visitTypeFilter === 'HOME') matchType = d.canHomeVisit && !d.canClinicVisit;
        else if (visitTypeFilter === 'CLINIC') matchType = d.canClinicVisit && !d.canHomeVisit;
        else if (visitTypeFilter === 'BOTH') matchType = d.canClinicVisit && d.canHomeVisit;
        return matchSearch && matchType;
    });

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải dữ liệu bác sĩ...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Bảng Theo Dõi Bác Sĩ</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Calendar size={18} />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ padding: '0.4rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none' }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <select
                    value={visitTypeFilter}
                    onChange={(e) => setVisitTypeFilter(e.target.value)}
                    style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none', backgroundColor: 'white' }}
                >
                    <option value="ALL">Tất cả hình thức</option>
                    <option value="HOME">Chỉ Khám tại nhà</option>
                    <option value="CLINIC">Chỉ Khám tại trung tâm</option>
                    <option value="BOTH">Hỗ trợ cả hai</option>
                </select>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        type="text"
                        placeholder="Tìm bác sĩ, chuyên khoa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredDoctors.map(doc => {
                    const statusInfo = getDoctorStatusInfo(doc.id);
                    const docSchedules = schedules.filter(s => s.doctorId === doc.id && s.status !== 'CANCELLED');
                    
                    let cardStyle = { backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' };
                    if (doc.canHomeVisit && !doc.canClinicVisit) {
                        cardStyle = { ...cardStyle, backgroundColor: '#f0fdf4', borderTop: '4px solid #166534' };
                    } else if (doc.canClinicVisit && !doc.canHomeVisit) {
                        cardStyle = { ...cardStyle, backgroundColor: '#f5f3ff', borderTop: '4px solid #4f46e5' };
                    } else if (doc.canClinicVisit && doc.canHomeVisit) {
                        cardStyle = { ...cardStyle, backgroundColor: '#fffbeb', borderTop: '4px solid #d97706' };
                    }

                    return (
                        <div key={doc.id} style={cardStyle}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                    {doc.avatar ? (
                                        <img src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                            <User size={30} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1f2937' }}>{doc.fullName}</h3>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{doc.specialtyName}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                        {doc.canClinicVisit && (
                                            <span style={{ fontSize: '0.75rem', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', width: 'fit-content' }}>
                                                Khám tại trung tâm
                                            </span>
                                        )}
                                        {doc.canHomeVisit && (
                                            <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', width: 'fit-content' }}>
                                                Khám tại nhà
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        padding: '0.25rem 0.75rem', 
                                        borderRadius: '9999px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 'bold',
                                        backgroundColor: statusInfo.bg,
                                        color: statusInfo.color
                                    }}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>
                            
                            <hr style={{ borderTop: '1px dashed #e5e7eb', margin: '0 0 1rem 0' }} />
                            
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={16} /> Lịch khám {selectedDate === new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] ? 'hôm nay' : `ngày ${selectedDate.split('-').reverse().join('/')}`}
                                </h4>
                                
                                {docSchedules.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {docSchedules.sort((a,b) => {
                                            const timeA = Array.isArray(a.startTime) ? `${a.startTime[0].toString().padStart(2, '0')}:${a.startTime[1].toString().padStart(2, '0')}` : a.startTime;
                                            const timeB = Array.isArray(b.startTime) ? `${b.startTime[0].toString().padStart(2, '0')}:${b.startTime[1].toString().padStart(2, '0')}` : b.startTime;
                                            return timeA.localeCompare(timeB);
                                        }).map(sch => {
                                            const isCurrent = statusInfo.currentSch?.id === sch.id;
                                            const isFull = sch.currentPatient >= sch.maxPatient;
                                            const displayStartTime = Array.isArray(sch.startTime) ? `${sch.startTime[0].toString().padStart(2, '0')}:${sch.startTime[1].toString().padStart(2, '0')}` : sch.startTime.substring(0, 5);
                                            const displayEndTime = Array.isArray(sch.endTime) ? `${sch.endTime[0].toString().padStart(2, '0')}:${sch.endTime[1].toString().padStart(2, '0')}` : sch.endTime.substring(0, 5);
                                            return (
                                                <div key={sch.id} style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: isCurrent ? '#fef3c7' : '#f9fafb',
                                                    border: `1px solid ${isCurrent ? '#fde68a' : '#f3f4f6'}`,
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: isCurrent ? 'bold' : 'normal', color: isCurrent ? '#92400e' : '#4b5563' }}>
                                                        <Clock size={14} /> {displayStartTime} - {displayEndTime}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isFull ? '#ef4444' : '#059669', fontWeight: '500' }}>
                                                        <Users size={14} /> {sch.currentPatient}/{sch.maxPatient}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>Không có lịch làm việc {selectedDate === new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] ? 'hôm nay' : `ngày ${selectedDate.split('-').reverse().join('/')}`}.</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReceptionistDoctorManager;
