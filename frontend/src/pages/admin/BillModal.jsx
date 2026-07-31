import React, { useState, useEffect } from 'react';
import { generateBill, payBill } from '../../api/billApi';
import { getMedicalRecordByAppointment } from '../../api/medicalRecordApi';
import { X, Receipt, CheckCircle } from 'lucide-react';

const BillModal = ({ appointment, onClose, onSuccess }) => {
    const [bill, setBill] = useState(null);
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;
        const loadData = async () => {
            try {
                setLoading(true);
                const [billData, recordData] = await Promise.all([
                    generateBill(appointment.id),
                    getMedicalRecordByAppointment(appointment.id).catch(() => null)
                ]);
                if (!isCancelled) {
                    setBill(billData);
                    setRecord(recordData);
                }
            } catch (requestError) {
                console.error("Failed to generate/fetch bill", requestError);
                if (!isCancelled) {
                    alert(requestError.response?.data?.message || "Error fetching bill");
                    onClose();
                }
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };
        loadData();
        return () => {
            isCancelled = true;
        };
    }, [appointment.id, onClose]);

    const handlePayment = async () => {
        if (!bill) return;
        try {
            setLoading(true);
            await payBill(bill.id);
            alert("Payment successful!");
            onSuccess();
        } catch (error) {
            console.error("Failed to process payment", error);
            alert(error.response?.data?.message || "Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !bill) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
                justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
                    Loading bill details...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', padding: '2rem', 
                width: '100%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Receipt size={24} /> Chi tiết hóa đơn
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <p><strong>Bệnh nhân:</strong> {appointment.patientName}</p>
                    <p><strong>Bác sĩ:</strong> {appointment.doctorName}</p>
                    <p><strong>Ngày khám:</strong> {appointment.scheduleDate}</p>
                    <p><strong>Trạng thái:</strong> <span style={{ fontWeight: 'bold', color: bill.status === 'PAID' ? '#059669' : '#dc2626' }}>{bill.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</span></p>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: '1rem' }}>
                        <span>Phí khám bệnh:</span>
                        <span style={{ fontWeight: '500' }}>{bill.consultationFee?.toLocaleString('vi-VN')}đ</span>
                    </div>
                    
                    {bill.medicineFee >= 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#4b5563', fontSize: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Phí thuốc:</span>
                                <span style={{ fontWeight: '500' }}>{bill.medicineFee?.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {record && record.prescriptions && record.prescriptions.length > 0 && (
                                <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: '#64748b' }}>
                                    {record.prescriptions.map((p, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>- {p.medicineName} ({p.unitPrice?.toLocaleString('vi-VN')}đ x{p.quantity})</span>
                                            <span>{p.totalPrice?.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {bill.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#10b981', fontSize: '1rem' }}>
                            <span>Giảm giá:</span>
                            <span style={{ fontWeight: '500' }}>-{bill.discount?.toLocaleString('vi-VN')}đ</span>
                        </div>
                    )}
                    
                    <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '0.5rem 0' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#1f2937' }}>Tổng cộng:</span>
                        <span style={{ color: '#0ea5e9', fontSize: '1.5rem' }}>{bill.totalAmount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                        Đóng
                    </button>
                    {bill.status === 'UNPAID' && (
                        <button 
                            onClick={handlePayment} 
                            disabled={loading} 
                            className="btn-primary" 
                            style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <CheckCircle size={16} /> Xác nhận thanh toán
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillModal;
