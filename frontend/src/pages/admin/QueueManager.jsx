import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllAppointments, callNextQueue, swapQueue, skipQueue } from '../../api/appointmentApi';
import { Volume2, ArrowUp, ArrowDown, UserX, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

const QueueManager = () => {
    const { user } = useContext(AuthContext);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const allApts = await getAllAppointments();
            // Lọc ra các bệnh nhân đang chờ (CHECKED_IN)
            // Sắp xếp theo số thứ tự hàng chờ
            const checkedIn = allApts
                .filter(a => a.status === 'CHECKED_IN')
                .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
            setQueue(checkedIn);
        } catch (error) {
            console.error("Failed to fetch queue", error);
            Swal.fire('Error', 'Không thể tải danh sách hàng chờ', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCallNext = async (id, patientName) => {
        const result = await Swal.fire({
            title: `Gọi bệnh nhân ${patientName}?`,
            text: 'Bệnh nhân này sẽ được chuyển vào phòng khám (IN_PROGRESS).',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Gọi vào khám',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await callNextQueue(id);
                Swal.fire('Thành công', `Đã gọi ${patientName} vào khám.`, 'success');
                fetchQueue();
            } catch (error) {
                const errMsg = error.response?.data?.message || error.response?.data || error.message || 'Không thể gọi bệnh nhân';
                Swal.fire('Lỗi', errMsg, 'error');
            }
        }
    };

    const handleSwap = async (index, direction) => {
        if (direction === 'up' && index > 0) {
            const item1 = queue[index];
            const item2 = queue[index - 1];
            try {
                await swapQueue(item1.id, item2.id);
                fetchQueue();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể đổi thứ tự', 'error');
            }
        } else if (direction === 'down' && index < queue.length - 1) {
            const item1 = queue[index];
            const item2 = queue[index + 1];
            try {
                await swapQueue(item1.id, item2.id);
                fetchQueue();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể đổi thứ tự', 'error');
            }
        }
    };

    const handleSkip = async (id, patientName) => {
        const result = await Swal.fire({
            title: `Bỏ lượt ${patientName}?`,
            text: 'Bệnh nhân sẽ bị đẩy xuống cuối hàng chờ.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await skipQueue(id);
                fetchQueue();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể bỏ lượt bệnh nhân', 'error');
            }
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Đang tải danh sách hàng chờ...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Quản lý Hàng chờ (Queue)</h2>
                    <div style={{ color: 'var(--text-secondary)' }}>Điều phối bệnh nhân vào phòng khám</div>
                </div>
                <button onClick={fetchQueue} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> Làm mới
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '80px', textAlign: 'center' }}>STT</th>
                            <th>Bệnh nhân</th>
                            <th>Bác sĩ khám</th>
                            <th>Lịch hẹn</th>
                            <th style={{ textAlign: 'center' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queue.map((apt, index) => (
                            <tr key={apt.id} style={{ backgroundColor: index === 0 ? '#f0fdf4' : 'transparent' }}>
                                <td style={{ textAlign: 'center' }}>
                                    <span style={{ 
                                        display: 'inline-block', width: '30px', height: '30px', lineHeight: '30px', 
                                        borderRadius: '50%', backgroundColor: index === 0 ? '#22c55e' : '#e5e7eb', 
                                        color: index === 0 ? 'white' : '#374151', fontWeight: 'bold' 
                                    }}>
                                        {apt.queueNumber}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 'bold', fontSize: index === 0 ? '1.1rem' : '1rem', color: index === 0 ? '#166534' : 'inherit' }}>
                                        {apt.patientName}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Triệu chứng: {apt.symptom || 'Không có'}
                                    </div>
                                    {apt.note && (
                                        <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 600 }}>
                                            Ghi chú: {(apt.note === 'V\\u1EAFng b\\u00E1c s\\u0129' || apt.note === 'V?ng bác s?') ? 'Vắng bác sĩ' : apt.note}
                                        </div>
                                    )}
                                </td>
                                <td>{apt.doctorName}</td>
                                <td>
                                    <div>{apt.scheduleDate}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{apt.timeSlot}</div>
                                </td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        {index === 0 && (
                                            <button 
                                                title="Gọi vào khám"
                                                onClick={() => handleCallNext(apt.id, apt.patientName)}
                                                style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                                                <Volume2 size={16} /> Gọi số
                                            </button>
                                        )}
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            <button 
                                                title="Đẩy lên"
                                                disabled={index === 0}
                                                onClick={() => handleSwap(index, 'up')}
                                                style={{ padding: '0.2rem 0.5rem', backgroundColor: index === 0 ? '#f3f4f6' : '#e5e7eb', color: index === 0 ? '#9ca3af' : '#374151', border: 'none', borderRadius: '0.25rem', cursor: index === 0 ? 'not-allowed' : 'pointer' }}>
                                                <ArrowUp size={14} />
                                            </button>
                                            <button 
                                                title="Đẩy xuống"
                                                disabled={index === queue.length - 1}
                                                onClick={() => handleSwap(index, 'down')}
                                                style={{ padding: '0.2rem 0.5rem', backgroundColor: index === queue.length - 1 ? '#f3f4f6' : '#e5e7eb', color: index === queue.length - 1 ? '#9ca3af' : '#374151', border: 'none', borderRadius: '0.25rem', cursor: index === queue.length - 1 ? 'not-allowed' : 'pointer' }}>
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>

                                        <button 
                                            title="Bỏ lượt"
                                            onClick={() => handleSkip(apt.id, apt.patientName)}
                                            style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                            <UserX size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {queue.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Không có bệnh nhân nào đang xếp hàng</div>
                                    <div style={{ fontSize: '0.9rem' }}>Vui lòng Check-in (Xác nhận đến) cho bệnh nhân trong mục Lịch hẹn.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QueueManager;
