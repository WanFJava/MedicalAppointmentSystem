import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllComplaints, resolveComplaint } from '../../api/complaintApi';
import { MessageCircle, CheckCircle, Clock, User, Calendar, Stethoscope, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';

const ComplaintManager = () => {
    const { user } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await getAllComplaints();
            // Sort by pending first, then by date descending
            data.sort((a, b) => {
                if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setComplaints(data);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
            Swal.fire('Lỗi', 'Không thể tải danh sách khiếu nại', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!resolutionNote.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập ghi chú giải quyết trước khi lưu.', 'error');
            return;
        }

        try {
            await resolveComplaint(id, user.id, resolutionNote);
            Swal.fire({
                icon: 'success',
                title: 'Đã giải quyết',
                text: 'Khiếu nại đã được xử lý thành công!',
                timer: 1500,
                showConfirmButton: false
            });
            setResolvingId(null);
            setResolutionNote('');
            fetchComplaints();
        } catch (error) {
            console.error("Failed to resolve complaint", error);
            Swal.fire('Lỗi', 'Có lỗi xảy ra khi xử lý khiếu nại', 'error');
        }
    };

    const filteredComplaints = complaints.filter(c => {
        if (filter === 'ALL') return true;
        return c.status === filter;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ fontSize: '1.1rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="spinner"></div> Đang tải danh sách khiếu nại...
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MessageCircle color="#3b82f6" size={32} /> Quản lý Phản hồi / Khiếu nại
                    </h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>Xem xét và phản hồi các khiếu nại từ bệnh nhân</p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f3f4f6', padding: '0.25rem', borderRadius: '0.75rem' }}>
                    <button 
                        onClick={() => setFilter('ALL')}
                        style={{
                            padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: filter === 'ALL' ? 'white' : 'transparent',
                            color: filter === 'ALL' ? '#1f2937' : '#6b7280',
                            boxShadow: filter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >Tất cả</button>
                    <button 
                        onClick={() => setFilter('PENDING')}
                        style={{
                            padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: filter === 'PENDING' ? 'white' : 'transparent',
                            color: filter === 'PENDING' ? '#d97706' : '#6b7280',
                            boxShadow: filter === 'PENDING' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >Đang chờ</button>
                    <button 
                        onClick={() => setFilter('RESOLVED')}
                        style={{
                            padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: filter === 'RESOLVED' ? 'white' : 'transparent',
                            color: filter === 'RESOLVED' ? '#059669' : '#6b7280',
                            boxShadow: filter === 'RESOLVED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >Đã giải quyết</button>
                </div>
            </div>

            {filteredComplaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px dashed #e5e7eb' }}>
                    <CheckCircle size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', color: '#374151', margin: '0 0 0.5rem 0' }}>Tuyệt vời!</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>Không có khiếu nại nào cần xử lý lúc này.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredComplaints.map(c => (
                        <div key={c.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                            border: `1px solid ${c.status === 'PENDING' ? '#fde68a' : '#e5e7eb'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                        >
                            <div style={{ 
                                padding: '1rem 1.5rem', 
                                borderBottom: '1px solid #e5e7eb',
                                backgroundColor: c.status === 'PENDING' ? '#fffbeb' : '#f9fafb',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                                    backgroundColor: c.status === 'PENDING' ? '#fef3c7' : '#d1fae5',
                                    color: c.status === 'PENDING' ? '#d97706' : '#059669',
                                }}>
                                    {c.status === 'PENDING' ? <Clock size={14} /> : <CheckCircle size={14} />}
                                    {c.status === 'PENDING' ? 'ĐANG CHỜ XỬ LÝ' : 'ĐÃ GIẢI QUYẾT'}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                            
                            <div style={{ padding: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{c.patientName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Bệnh nhân</div>
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    backgroundColor: '#f3f4f6', padding: '0.75rem', borderRadius: '0.5rem', 
                                    fontSize: '0.875rem', color: '#4b5563', marginBottom: '1.25rem',
                                    borderLeft: '3px solid #9ca3af'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Stethoscope size={14} color="#6b7280"/> Bác sĩ: <span style={{ fontWeight: 500, color: '#374151'}}>{c.doctorName}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="#6b7280"/> Lịch: <span style={{ fontWeight: 500, color: '#374151'}}>{c.timeSlot}, {c.scheduleDate}</span>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Nội dung phản hồi / khiếu nại:</div>
                                <div style={{ color: '#1f2937', lineHeight: 1.5, fontSize: '0.95rem' }}>
                                    "{c.reason}"
                                </div>
                            </div>
                            
                            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                {c.status === 'PENDING' ? (
                                    resolvingId === c.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.3s' }}>
                                            <textarea
                                                placeholder="Nhập hướng giải quyết hoặc phản hồi cho bệnh nhân..."
                                                value={resolutionNote}
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                                style={{ 
                                                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem', 
                                                    border: '1px solid #3b82f6', fontSize: '0.875rem', minHeight: '80px',
                                                    outline: 'none', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                                                }}
                                                autoFocus
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => setResolvingId(null)} 
                                                    style={{ padding: '0.5rem 1rem', backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                >
                                                    <X size={16} /> Hủy
                                                </button>
                                                <button 
                                                    onClick={() => handleResolve(c.id)} 
                                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                >
                                                    <Check size={16} /> Hoàn tất
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setResolvingId(c.id); setResolutionNote(''); }}
                                            style={{ 
                                                width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', 
                                                border: 'none', borderRadius: '0.5rem', cursor: 'pointer', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                fontWeight: 600, fontSize: '0.9rem', transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                        >
                                            <MessageCircle size={18} /> Phản hồi & Giải quyết
                                        </button>
                                    )
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <div style={{ backgroundColor: '#d1fae5', padding: '0.25rem', borderRadius: '50%', color: '#059669', flexShrink: 0, marginTop: '0.1rem' }}>
                                                <Check size={12} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600, marginBottom: '0.25rem' }}>Đã phản hồi:</div>
                                                <div style={{ fontSize: '0.875rem', color: '#14532d', fontStyle: 'italic' }}>"{c.resolutionNote}"</div>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                                            <span>Bởi: <b>{c.resolvedBy}</b></span>
                                            <span>{new Date(c.resolvedAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComplaintManager;
