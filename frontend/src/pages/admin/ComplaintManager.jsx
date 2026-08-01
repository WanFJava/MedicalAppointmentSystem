import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllComplaints, resolveComplaint } from '../../api/complaintApi';
import { MessageCircle, CheckCircle, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

const ComplaintManager = () => {
    const { user } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await getAllComplaints();
            setComplaints(data);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
            Swal.fire('Error', 'Could not load complaints', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!resolutionNote.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập ghi chú xử lý.', 'error');
            return;
        }

        try {
            await resolveComplaint(id, user.id, resolutionNote);
            Swal.fire('Thành công', 'Đã xử lý khiếu nại', 'success');
            setResolvingId(null);
            setResolutionNote('');
            fetchComplaints();
        } catch (error) {
            console.error("Failed to resolve complaint", error);
            Swal.fire('Lỗi', 'Không thể xử lý khiếu nại', 'error');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading complaints...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Quản lý Khiếu nại</h2>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ngày gửi</th>
                            <th>Bệnh nhân</th>
                            <th>Thông tin lịch hẹn</th>
                            <th>Nội dung khiếu nại</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map(c => (
                            <tr key={c.id}>
                                <td>{new Date(c.createdAt).toLocaleString()}</td>
                                <td style={{ fontWeight: 500 }}>{c.patientName}</td>
                                <td>
                                    <div>{c.doctorName}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        {c.scheduleDate} - {c.timeSlot}
                                    </div>
                                </td>
                                <td style={{ maxWidth: '300px' }}>{c.reason}</td>
                                <td>
                                    {c.status === 'PENDING' ? (
                                        <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>ĐANG CHỜ</span>
                                    ) : (
                                        <span style={{ backgroundColor: '#d1fae5', color: '#059669', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>ĐÃ XỬ LÝ</span>
                                    )}
                                </td>
                                <td>
                                    {c.status === 'PENDING' ? (
                                        resolvingId === c.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <textarea
                                                    placeholder="Ghi chú xử lý..."
                                                    value={resolutionNote}
                                                    onChange={(e) => setResolutionNote(e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleResolve(c.id)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}>Lưu</button>
                                                    <button onClick={() => setResolvingId(null)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}>Hủy</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setResolvingId(c.id); setResolutionNote(''); }}
                                                style={{ padding: '0.5rem', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <CheckCircle size={16} /> Xử lý
                                            </button>
                                        )
                                    ) : (
                                        <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                            <div>Bởi: {c.resolvedBy}</div>
                                            <div>Ghi chú: {c.resolutionNote}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(c.resolvedAt).toLocaleString()}</div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {complaints.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không có khiếu nại nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintManager;
