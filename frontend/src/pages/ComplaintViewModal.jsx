import React, { useState, useEffect, useContext } from 'react';
import { getMyComplaints } from '../api/complaintApi';
import { X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

import { AuthContext } from '../context/AuthContext';

const ComplaintViewModal = ({ appointment, onClose }) => {
    const { user } = useContext(AuthContext);
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                // Fetch all complaints for this patient
                const data = await getMyComplaints(user.id);
                // Find the complaint for this specific appointment
                const specificComplaint = data.find(c => c.appointmentId === appointment.id);
                setComplaint(specificComplaint);
            } catch (err) {
                console.error("Failed to fetch complaint", err);
                setError("Không thể tải thông tin khiếu nại.");
            } finally {
                setLoading(false);
            }
        };

        if (appointment && user) {
            fetchComplaint();
        }
    }, [appointment]);

    if (!appointment) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '600px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle color="#ef4444" /> Chi tiết phản hồi / khiếu nại
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Đang tải...</div>
                ) : error ? (
                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem' }}>{error}</div>
                ) : complaint ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Nội dung phản hồi / khiếu nại:</div>
                            <div style={{ fontWeight: 500, color: '#1f2937' }}>{complaint.reason}</div>
                            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                Gửi lúc: {new Date(complaint.createdAt).toLocaleString('vi-VN')}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Trạng thái xử lý:</div>
                            {complaint.status === 'PENDING' ? (
                                <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} /> Đang chờ xử lý
                                </span>
                            ) : (
                                <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle size={14} /> Đã giải quyết
                                </span>
                            )}
                        </div>

                        {complaint.status === 'RESOLVED' && (
                            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.25rem', fontWeight: 600 }}>Phản hồi từ Ban Quản lý:</div>
                                <div style={{ color: '#14532d', whiteSpace: 'pre-line' }}>{complaint.resolutionNote || 'Không có ghi chú.'}</div>
                                <div style={{ fontSize: '0.875rem', color: '#22c55e', marginTop: '0.75rem' }}>
                                    Xử lý lúc: {new Date(complaint.resolvedAt).toLocaleString('vi-VN')} bởi {complaint.resolvedBy}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Không tìm thấy dữ liệu khiếu nại.</div>
                )}
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.5rem', backgroundColor: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplaintViewModal;
