import React, { useState, useEffect } from 'react';
import { getMedicalRecordByAppointment } from '../api/medicalRecordApi';
import { getBillByAppointment } from '../api/billApi';
import { X, FileText, Pill, DollarSign } from 'lucide-react';

const PatientRecordModal = ({ appointment, onClose }) => {
    const [record, setRecord] = useState(null);
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const [recordData, billData] = await Promise.all([
                getMedicalRecordByAppointment(appointment.id).catch(() => null),
                getBillByAppointment(appointment.id).catch(() => null)
            ]);
            setRecord(recordData);
            setBill(billData);
        } catch (error) {
            console.error("Error fetching record/bill", error);
        } finally {
            setLoading(false);
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

                {record ? (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>Medical Record</h3>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: '#4b5563' }}>Diagnosis:</strong>
                            <p style={{ marginTop: '0.5rem', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>{record.diagnosis}</p>
                        </div>
                        
                        {record.advice && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: '#4b5563' }}>Advice:</strong>
                                <p style={{ marginTop: '0.5rem', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>{record.advice}</p>
                            </div>
                        )}

                        {record.prescriptions && record.prescriptions.length > 0 && (
                            <div>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 0.5rem 0' }}>
                                    <Pill size={18} /> Prescription
                                </h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Medicine</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Dosage</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Instruction</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.prescriptions.map((p, index) => (
                                            <tr key={index} style={{ borderBottom: index !== record.prescriptions.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                                <td style={{ padding: '0.75rem' }}>{p.medicineName}</td>
                                                <td style={{ padding: '0.75rem' }}>{p.dosage}</td>
                                                <td style={{ padding: '0.75rem' }}>{p.instruction}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{p.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '1rem', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '8px', marginBottom: '2rem' }}>
                        Medical record not available yet.
                    </div>
                )}

                {bill && (
                    <div>
                        <h3 style={{ borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>Billing</h3>
                        <div style={{ backgroundColor: bill.status === 'PAID' ? '#d1fae5' : '#fee2e2', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Amount</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                                    <DollarSign size={20} /> {bill.totalAmount}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Status</div>
                                <div style={{ 
                                    fontWeight: 'bold', 
                                    color: bill.status === 'PAID' ? '#059669' : '#dc2626',
                                    backgroundColor: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    display: 'inline-block'
                                }}>
                                    {bill.status}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientRecordModal;
