import React, { useState, useEffect } from 'react';
import { getAllMedicines } from '../../api/medicineApi';
import { diagnosePatient } from '../../api/medicalRecordApi';
import { X, Plus, Trash2 } from 'lucide-react';

const DoctorDiagnoseModal = ({ appointment, doctorId, onClose, onSuccess }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [advice, setAdvice] = useState('');
    const [medicines, setMedicines] = useState([]);
    
    // For prescription
    const [showPrescription, setShowPrescription] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [dosage, setDosage] = useState('');
    const [instruction, setInstruction] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const data = await getAllMedicines();
            setMedicines(data);
        } catch (error) {
            console.error("Failed to load medicines", error);
        }
    };

    const handleAddMedicine = () => {
        if (!selectedMedicineId || !dosage || !quantity) return;
        const medicine = medicines.find(m => m.id.toString() === selectedMedicineId);
        
        const parsedQuantity = parseInt(quantity);
        const existingQty = prescriptions
            .filter(p => p.medicineId === medicine.id)
            .reduce((sum, p) => sum + p.quantity, 0);

        if (medicine.quantity < (parsedQuantity + existingQty)) {
            alert(`Thuốc ${medicine.name} không đủ số lượng trong kho. Tổng còn lại: ${medicine.quantity} (Đã kê: ${existingQty})`);
            return;
        }

        const newPrescription = {
            medicineId: parseInt(selectedMedicineId),
            medicineName: medicine.name,
            dosage,
            instruction,
            quantity: parsedQuantity,
            stock: medicine.quantity
        };
        
        setPrescriptions([...prescriptions, newPrescription]);
        setSelectedMedicineId('');
        setDosage('');
        setInstruction('');
        setQuantity(1);
    };

    const handleRemoveMedicine = (index) => {
        const updated = [...prescriptions];
        updated.splice(index, 1);
        setPrescriptions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const data = {
                diagnosis,
                advice,
                prescriptions: showPrescription ? prescriptions.map(p => ({
                    medicineId: p.medicineId,
                    dosage: p.dosage,
                    instruction: p.instruction,
                    quantity: p.quantity
                })) : []
            };
            await diagnosePatient(appointment.id, doctorId, data);
            onSuccess();
        } catch (error) {
            console.error("Failed to save medical record", error);
            alert("Error saving medical record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', padding: '2rem', 
                width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Diagnose: {appointment.patientName}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                    <strong>Symptoms:</strong> {appointment.symptom || 'None reported'}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Diagnosis</label>
                        <textarea 
                            value={diagnosis} 
                            onChange={(e) => setDiagnosis(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '80px' }}
                        />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Advice</label>
                        <textarea 
                            value={advice} 
                            onChange={(e) => setAdvice(e.target.value)} 
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '80px' }}
                        />
                    </div>

                    <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                            type="checkbox" 
                            id="togglePrescription" 
                            checked={showPrescription} 
                            onChange={(e) => setShowPrescription(e.target.checked)}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="togglePrescription" style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                            Add Prescription (Optional)
                        </label>
                    </div>
                    
                    {showPrescription && (
                        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Medicine</label>
                                    <select 
                                        value={selectedMedicineId} 
                                        onChange={(e) => setSelectedMedicineId(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white' }}
                                    >
                                        <option value="">Select Medicine</option>
                                        {medicines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} - ${m.price} (Kho: {m.quantity})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: '1 1 100px' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Dosage</label>
                                    <input 
                                        type="text" 
                                        value={dosage} 
                                        onChange={(e) => setDosage(e.target.value)} 
                                        placeholder="e.g., 1 pill"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 150px' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Instruction</label>
                                    <input 
                                        type="text" 
                                        value={instruction} 
                                        onChange={(e) => setInstruction(e.target.value)} 
                                        placeholder="e.g., After meals"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <div style={{ flex: '0 1 80px' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Qty</label>
                                    <input 
                                        type="number" 
                                        value={quantity} 
                                        onChange={(e) => setQuantity(e.target.value)} 
                                        min="1"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddMedicine}
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>

                            {prescriptions.length > 0 && (
                                <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Medicine</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Dosage</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Instruction</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Stock</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prescriptions.map((p, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '0.5rem' }}>{p.medicineName}</td>
                                                <td style={{ padding: '0.5rem' }}>{p.dosage}</td>
                                                <td style={{ padding: '0.5rem' }}>{p.instruction}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.quantity}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{p.stock}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveMedicine(index)}
                                                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                            {loading ? 'Saving...' : 'Complete Checkup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorDiagnoseModal;
