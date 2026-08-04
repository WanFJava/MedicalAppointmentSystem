import React, { useState, useEffect } from 'react';

import { getBillByAppointment, payBill } from '../api/billApi';
import { X, FileText, DollarSign, CreditCard } from 'lucide-react';

const PatientBillModal = ({ appointment, onClose }) => {
    
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const billData = await getBillByAppointment(appointment.id).catch(() => null);
            
            setBill(billData);
        } catch (error) {
            console.error("Error fetching record/bill", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayBill = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn thanh toán hóa đơn này trực tuyến không?')) return;
        try {
            const updatedBill = await payBill(bill.id);
            setBill(updatedBill);
            alert("Thanh toán thành công!");
        } catch (error) {
            console.error("Payment failed", error);
            alert("Lỗi khi thanh toán. Vui lòng thử lại.");
        }
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
                    Loading your records...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '2rem',
                width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1f2937' }}>
                        <FileText size={24} /> Appointment Details
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                    <div>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Doctor</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{appointment.doctorName}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Date</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{appointment.scheduleDate} at {appointment.timeSlot}</p>
                    </div>
                </div>

                

                {bill && (
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={20} color="#0ea5e9" /> Chi tiết thanh toán
                        </h3>

                        <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            {/* Breakdown */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: '1rem' }}>
                                <span>Phí khám bệnh:</span>
                                <span style={{ fontWeight: '500' }}>{bill.consultationFee?.toLocaleString('vi-VN')}đ</span>
                            </div>

                            {bill.travelFee > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: '1rem' }}>
                                    <span>Phí di chuyển (Khám tại nhà):</span>
                                    <span style={{ fontWeight: '500' }}>{bill.travelFee?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}

                            {(bill.medicineFee > 0 || bill.medicineFee === 0) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#4b5563', fontSize: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Phí thuốc:</span>
                                        <span style={{ fontWeight: '500' }}>{bill.medicineFee?.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            )}

                            {bill.discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#10b981', fontSize: '1rem' }}>
                                    <span>Giảm giá:</span>
                                    <span style={{ fontWeight: '500' }}>-{bill.discount?.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}

                            <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '0.5rem 0' }} />

                            {/* Total and Status */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>Tổng cộng:</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0ea5e9' }}>
                                        {bill.totalAmount?.toLocaleString('vi-VN')}đ
                                    </span>
                                    <div style={{
                                        fontWeight: '700', fontSize: '0.85rem',
                                        color: bill.status === 'PAID' ? '#059669' : '#dc2626',
                                        backgroundColor: bill.status === 'PAID' ? '#d1fae5' : '#fee2e2',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '1rem'
                                    }}>
                                        {bill.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    {bill && bill.status === 'UNPAID' && (
                        <button onClick={handlePayBill} style={{ padding: '0.75rem 2rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            <CreditCard size={18} />
                            Thanh toán trực tuyến
                        </button>
                    )}
                    <button onClick={onClose} className="btn-primary" style={{ padding: '0.75rem 2rem', backgroundColor: '#64748b' }}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientBillModal;
