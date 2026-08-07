import React, { useState, useEffect } from 'react';
import { getAllMedicines, createMedicine, updateMedicine, deleteMedicine } from '../../api/medicineApi';
import { Pill, Plus, Edit2, Trash2, X } from 'lucide-react';

const MedicineManager = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', unit: '', price: '', quantity: '', expiredDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const data = await getAllMedicines();
            setMedicines(data);
        } catch (error) {
            console.error("Failed to fetch medicines", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (med = null) => {
        if (med) {
            setEditingId(med.id);
            setFormData({ 
                name: med.name, 
                unit: med.unit || '', 
                price: med.price,
                quantity: med.quantity || 0,
                expiredDate: med.expiredDate || ''
            });
        } else {
            setEditingId(null);
            setFormData({ name: '', unit: '', price: '', quantity: '', expiredDate: '' });
        }
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity)
            };
            if (editingId) {
                await updateMedicine(editingId, data);
            } else {
                await createMedicine(data);
            }
            setIsModalOpen(false);
            fetchMedicines();
        } catch (error) {
            console.error("Failed to save medicine", error);
            alert("Error saving medicine");
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xoá thuốc "${name}" không?`)) {
            try {
                await deleteMedicine(id);
                fetchMedicines();
            } catch (error) {
                console.error("Failed to delete medicine", error);
                alert("Error deleting medicine");
            }
        }
    };

    if (loading && medicines.length === 0) return <div style={{ padding: '2rem' }}>Đang tải danh sách thuốc...</div>;

    return (
        <div>
            <div className="page-header">
                <h2><Pill size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Danh mục thuốc</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm thuốc, đơn vị..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ minWidth: '250px' }}
                    />
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Thêm Thuốc mới
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tên thuốc</th>
                            <th>Đơn vị tính</th>
                            <th>Giá (VNĐ)</th>
                            <th>Số lượng</th>
                            <th>Hạn sử dụng</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicines.filter(m => (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (m.unit?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map((med) => (
                            <tr key={med.id}>
                                <td style={{ fontWeight: 500 }}>{med.name}</td>
                                <td>{med.unit}</td>
                                <td style={{ color: '#10b981', fontWeight: 600 }}>{med.price?.toLocaleString('vi-VN')} VNĐ</td>
                                <td>{med.quantity}</td>
                                <td>{med.expiredDate}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(med)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(med.id, med.name)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {medicines.filter(m => (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (m.unit?.toLowerCase() || '').includes(searchTerm.toLowerCase())).length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy thuốc nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Cập nhật Thuốc' : 'Thêm Thuốc mới'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Tên thuốc</label>
                                <input 
                                    className="form-control"
                                    type="text" name="name" 
                                    value={formData.name} onChange={handleChange} 
                                    required 
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    placeholder="Nhập tên thuốc..."
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Đơn vị tính</label>
                                    <input 
                                        className="form-control"
                                        type="text" name="unit" 
                                        value={formData.unit} onChange={handleChange} 
                                        required 
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                        placeholder="VD: Viên, Hộp, Vỉ..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Giá (VNĐ)</label>
                                    <input 
                                        className="form-control"
                                        type="number" step="0.01" min="0" name="price" 
                                        value={formData.price} onChange={handleChange} 
                                        required 
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Số lượng</label>
                                    <input 
                                        className="form-control"
                                        type="number" min="0" name="quantity" 
                                        value={formData.quantity} onChange={handleChange} 
                                        required 
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Hạn sử dụng</label>
                                    <input 
                                        className="form-control"
                                        type="date" name="expiredDate" 
                                        value={formData.expiredDate} onChange={handleChange} 
                                        required 
                                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                                    {editingId ? 'Cập nhật Thuốc' : 'Lưu Thuốc mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineManager;

