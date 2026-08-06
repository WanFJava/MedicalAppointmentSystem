import React from 'react';
import { X, Calendar, Clock, Stethoscope, User, FileText, Activity } from 'lucide-react';

const ViewBookingModal = ({ appointment, onClose }) => {
    if (!appointment) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '600px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden'
            }}>
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
                        Thông tin Đặt lịch
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#64748b', padding: '0.25rem'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Stethoscope size={16} /> Bác sĩ
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.doctorName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <User size={16} /> Bệnh nhân
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.patientName}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Calendar size={16} /> Ngày
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.scheduleDate}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Clock size={16} /> Khung giờ
                            </div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.visitType === 'HOME_VISIT' ? (appointment.expectedTime || 'Chưa chốt') : appointment.timeSlot}</div>
                        </div>
                    </div>

                    {appointment.visitType === 'HOME_VISIT' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                            {appointment.consultationFee !== undefined && appointment.consultationFee !== null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #bbf7d0', paddingBottom: '0.5rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={16} /> Giá khám cơ bản
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#14532d' }}>
                                        {appointment.consultationFee.toLocaleString('vi-VN')} VNĐ
                                    </div>
                                </div>
                            )}
                            {appointment.travelFee !== undefined && appointment.travelFee !== null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #bbf7d0', paddingBottom: '0.5rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={16} /> Phí di chuyển
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#14532d' }}>
                                        {appointment.travelFee.toLocaleString('vi-VN')} VNĐ
                                    </div>
                                </div>
                            )}
                            {appointment.consultationFee !== undefined && appointment.consultationFee !== null && appointment.travelFee !== undefined && appointment.travelFee !== null && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 'bold' }}>
                                        Tạm tính
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#14532d', fontSize: '1.1rem' }}>
                                        {(appointment.consultationFee + appointment.travelFee).toLocaleString('vi-VN')} VNĐ
                                    </div>
                                </div>
                            )}
                            <div style={{ fontSize: '0.85rem', color: '#166534', fontStyle: 'italic', marginTop: '0.5rem' }}>
                                {(appointment.travelFee === null || appointment.travelFee === undefined) 
                                    ? '* Phí di chuyển sẽ được Lễ tân tính toán sau khi xác nhận lịch hẹn.' 
                                    : '* Lưu ý: Khám xong bác sĩ có thể cập nhật thêm phí (tiền thuốc, thủ thuật,...).'}
                            </div>
                        </div>
                    )}

                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Activity size={16} /> Trạng thái
                        </div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{appointment.status}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FileText size={16} /> Lý do khám / Triệu chứng
                        </div>
                        <div style={{
                            backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem',
                            color: '#334155', minHeight: '60px', border: '1px solid #e2e8f0'
                        }}>
                            {appointment.symptom || 'Không có triệu chứng nào được cung cấp.'}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.25rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.25rem', backgroundColor: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer'
                        }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewBookingModal;
