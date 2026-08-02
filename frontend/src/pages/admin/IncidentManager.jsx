import React, { useState, useEffect } from 'react';
import { getAllAppointments } from '../../api/appointmentApi';
import { AlertCircle, UserX, Stethoscope, Users, Calendar, Search } from 'lucide-react';
import Swal from 'sweetalert2';

const IncidentManager = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('DOCTOR_ABSENCES'); // 'DOCTOR_ABSENCES' | 'PATIENT_NO_SHOWS'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getAllAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu", error);
            Swal.fire('Lỗi', 'Không thể tải danh sách sự cố', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter appointments
    const doctorAbsences = appointments.filter(apt => apt.status === 'CANCELLED_BY_DOCTOR');
    const patientNoShows = appointments.filter(apt => apt.status === 'NO_SHOW');

    // Grouping Doctor Absences
    const docStats = {};
    doctorAbsences.forEach(apt => {
        const docId = apt.doctorId;
        if (!docStats[docId]) {
            docStats[docId] = { doctorName: apt.doctorName, doctorId: docId, absences: 0, appointments: [] };
        }
        docStats[docId].absences += 1;
        docStats[docId].appointments.push(apt);
    });
    const groupedDoctorAbsences = Object.values(docStats).sort((a, b) => b.absences - a.absences);

    // Grouping Patient No-Shows
    const patientStats = {};
    patientNoShows.forEach(apt => {
        const patId = apt.patientId;
        if (!patientStats[patId]) {
            patientStats[patId] = { patientName: apt.patientName, patientId: patId, noShows: 0, appointments: [] };
        }
        patientStats[patId].noShows += 1;
        patientStats[patId].appointments.push(apt);
    });
    const groupedPatientNoShows = Object.values(patientStats).sort((a, b) => b.noShows - a.noShows);

    // Filtering based on search term
    const displayedDoctors = groupedDoctorAbsences.filter(d => d.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const displayedPatients = groupedPatientNoShows.filter(p => p.patientName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu báo cáo...</div>;
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1f2937' }}>
                        <AlertCircle color="#ef4444" size={28} /> Báo Cáo Sự Cố & Vi Phạm
                    </h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>Theo dõi số slot vắng mặt của bác sĩ và tình trạng No-Show của bệnh nhân</p>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stethoscope size={30} />
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{doctorAbsences.length}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tổng số ca Bác sĩ vắng mặt</div>
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserX size={30} />
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>{patientNoShows.length}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tổng số lượt Bệnh nhân No-Show</div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f3f4f6', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    <button 
                        onClick={() => setActiveTab('DOCTOR_ABSENCES')}
                        style={{
                            padding: '0.6rem 1.2rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: activeTab === 'DOCTOR_ABSENCES' ? 'white' : 'transparent',
                            color: activeTab === 'DOCTOR_ABSENCES' ? '#ef4444' : '#6b7280',
                            boxShadow: activeTab === 'DOCTOR_ABSENCES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Stethoscope size={18} /> Bác Sĩ Vắng Mặt
                    </button>
                    <button 
                        onClick={() => setActiveTab('PATIENT_NO_SHOWS')}
                        style={{
                            padding: '0.6rem 1.2rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: activeTab === 'PATIENT_NO_SHOWS' ? 'white' : 'transparent',
                            color: activeTab === 'PATIENT_NO_SHOWS' ? '#d97706' : '#6b7280',
                            boxShadow: activeTab === 'PATIENT_NO_SHOWS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Users size={18} /> Bệnh Nhân No-Show
                    </button>
                </div>

                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                
                {activeTab === 'DOCTOR_ABSENCES' && (
                    <div>
                        {displayedDoctors.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Không có dữ liệu vắng mặt của bác sĩ.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', color: '#374151', fontWeight: 600 }}>Tên Bác Sĩ</th>
                                        <th style={{ padding: '1rem 1.5rem', color: '#374151', fontWeight: 600, textAlign: 'center' }}>Số Lần Vắng</th>
                                        <th style={{ padding: '1rem 1.5rem', color: '#374151', fontWeight: 600 }}>Chi Tiết Các Ca Khám</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedDoctors.map((doc, index) => (
                                        <tr key={doc.doctorId} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#1f2937' }}>{doc.doctorName} (ID: {doc.doctorId})</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                                                    {doc.absences} lần
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.85rem' }}>
                                                    {doc.appointments.map(apt => (
                                                        <li key={apt.id}>
                                                            Ngày: <strong>{apt.scheduleDate}</strong> | Giờ: <strong>{apt.timeSlot}</strong> 
                                                            <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>(Mã lịch hẹn: {apt.id})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'PATIENT_NO_SHOWS' && (
                    <div>
                        {displayedPatients.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Không có dữ liệu bệnh nhân No-Show.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', color: '#374151', fontWeight: 600 }}>Tên Bệnh Nhân</th>
                                        <th style={{ padding: '1rem 1.5rem', color: '#374151', fontWeight: 600, textAlign: 'center' }}>Số Lần No-Show</th>
                                        <th style={{ padding: '1rem 1.5rem', color: '#374151', fontWeight: 600 }}>Chi Tiết Các Ca Khám</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPatients.map((pat, index) => (
                                        <tr key={pat.patientId} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#1f2937' }}>{pat.patientName} (ID: {pat.patientId})</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                                                    {pat.noShows} lần
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.85rem' }}>
                                                    {pat.appointments.map(apt => (
                                                        <li key={apt.id}>
                                                            Ngày: <strong>{apt.scheduleDate}</strong> | Giờ: <strong>{apt.timeSlot}</strong> | BS: {apt.doctorName}
                                                            <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>(Mã lịch hẹn: {apt.id})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncidentManager;
