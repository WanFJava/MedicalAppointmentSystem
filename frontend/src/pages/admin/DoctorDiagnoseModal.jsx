import React, { useState, useEffect } from 'react';
import { getAllMedicines } from '../../api/medicineApi';
import { diagnosePatient } from '../../api/medicalRecordApi';
import { X, Plus, Trash2, Search, Pill, FileText, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const DoctorDiagnoseModal = ({ appointment, doctorId, onClose, onSuccess }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [advice, setAdvice] = useState('');
    const [medicines, setMedicines] = useState([]);
    
    // For prescription
    const [showPrescription, setShowPrescription] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [medicineSearch, setMedicineSearch] = useState('');
    const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
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
            Swal.fire('Hết thuốc', `Thuốc ${medicine.name} không đủ số lượng trong kho. Tổng còn lại: ${medicine.quantity} (Đã kê: ${existingQty})`, 'warning');
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
        setMedicineSearch('');
        setDosage('');
        setInstruction('');
        setQuantity(1);
        setMedicineSearch('');
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
            Swal.fire('Thành công', 'Đã lưu hồ sơ bệnh án thành công!', 'success');
            onSuccess();
        } catch (error) {
            console.error("Failed to save medical record", error);
            Swal.fire('Lỗi', 'Có lỗi xảy ra khi lưu hồ sơ bệnh án', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredMedicines = medicines.filter(m => 
        m.name.toLowerCase().includes(medicineSearch.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', 
                width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText color="#3b82f6" /> Chẩn đoán bệnh nhân: <span style={{ color: '#3b82f6' }}>{appointment.patientName}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', backgroundColor: '#fffbeb', borderRadius: '0.5rem', borderLeft: '4px solid #f59e0b', color: '#92400e' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#b45309' }}>Triệu chứng / Vấn đề:</strong> 
                    <div style={{ fontSize: '1.05rem' }}>{appointment.symptom || 'Không có ghi nhận'}</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Kết quả chẩn đoán <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea 
                                value={diagnosis} 
                                onChange={(e) => setDiagnosis(e.target.value)} 
                                required 
                                placeholder="Ví dụ: Viêm họng cấp, sốt siêu vi..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', minHeight: '120px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Lời khuyên của bác sĩ</label>
                            <textarea 
                                value={advice} 
                                onChange={(e) => setAdvice(e.target.value)} 
                                placeholder="Ví dụ: Nghỉ ngơi nhiều, uống đủ nước..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', minHeight: '120px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: showPrescription ? '1.5rem' : 0 }}>
                            <input 
                                type="checkbox" 
                                id="togglePrescription" 
                                checked={showPrescription} 
                                onChange={(e) => setShowPrescription(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: '#3b82f6' }}
                            />
                            <label htmlFor="togglePrescription" style={{ fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Pill size={20} color="#3b82f6" /> Kê đơn thuốc (Tùy chọn)
                            </label>
                        </div>
                        
                        {showPrescription && (
                            <div style={{ animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Thuốc</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '50%', left: '0.5rem', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                                                <Search size={16} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Tìm kiếm và chọn thuốc..." 
                                                value={medicineSearch}
                                                onChange={(e) => {
                                                    setMedicineSearch(e.target.value);
                                                    setShowMedicineDropdown(true);
                                                }}
                                                onFocus={() => setShowMedicineDropdown(true)}
                                                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                                            />
                                            {showMedicineDropdown && (
                                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                    {filteredMedicines.length === 0 ? (
                                                        <div style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>Không tìm thấy thuốc</div>
                                                    ) : (
                                                        filteredMedicines.map(m => (
                                                            <div key={m.id} 
                                                                style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', backgroundColor: selectedMedicineId == m.id ? '#eff6ff' : 'white' }}
                                                                onMouseDown={() => {
                                                                    setSelectedMedicineId(m.id.toString());
                                                                    setMedicineSearch(m.name);
                                                                    setShowMedicineDropdown(false);
                                                                }}
                                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedMedicineId == m.id ? '#eff6ff' : 'white'}
                                                            >
                                                                <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>{m.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Giá: {m.price.toLocaleString('vi-VN')}đ | Tồn kho: {m.quantity}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Liều lượng</label>
                                        <input 
                                            type="text" 
                                            value={dosage} 
                                            onChange={(e) => setDosage(e.target.value)} 
                                            placeholder="VD: 1 viên"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Cách dùng</label>
                                        <input 
                                            type="text" 
                                            value={instruction} 
                                            onChange={(e) => setInstruction(e.target.value)} 
                                            placeholder="VD: Sau ăn"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Số lượng</label>
                                        <input 
                                            type="number" 
                                            value={quantity} 
                                            onChange={(e) => setQuantity(e.target.value)} 
                                            min="1"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddMedicine}
                                        style={{ 
                                            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem',
                                            fontWeight: 600, cursor: 'pointer', height: '38px', transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                    >
                                        <Plus size={18} /> Thêm
                                    </button>
                                </div>

                                {prescriptions.length > 0 ? (
                                    <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.9rem' }}>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Tên thuốc</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Liều lượng</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Cách dùng</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Số lượng</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {prescriptions.map((p, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
                                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#1e293b' }}>{p.medicineName}</td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>{p.dosage}</td>
                                                        <td style={{ padding: '0.75rem 1rem' }}>{p.instruction}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>{p.quantity}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoveMedicine(index)}
                                                                style={{ color: '#ef4444', background: '#fee2e2', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.25rem', display: 'inline-flex' }}
                                                                title="Xóa"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                                        Chưa có loại thuốc nào được thêm vào đơn.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            style={{ 
                                padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', 
                                backgroundColor: 'white', cursor: 'pointer', fontWeight: 600, color: '#4b5563' 
                            }}
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{ 
                                padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', 
                                backgroundColor: '#10b981', color: 'white', cursor: 'pointer', 
                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                opacity: loading ? 0.7 : 1, transition: 'background-color 0.2s'
                            }}
                        >
                            {loading ? 'Đang xử lý...' : <><CheckCircle size={20} /> Hoàn tất khám bệnh</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorDiagnoseModal;
