import React, { useState, useEffect } from 'react';
import { getAllMedicines, createMedicine, updateMedicine, deleteMedicine } from '../../api/medicineApi';
import { Pill, Plus, Edit, Trash2 } from 'lucide-react';

const MedicineManager = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
            setFormData({ name: '', unit: '', price: '', quantity: '', expiredDate: '' });
            setEditingId(null);
            fetchMedicines();
        } catch (error) {
            console.error("Failed to save medicine", error);
            alert("Error saving medicine");
        }
    };

    const handleEdit = (med) => {
        setEditingId(med.id);
        setFormData({ 
            name: med.name, 
            unit: med.unit || '', 
            price: med.price,
            quantity: med.quantity || 0,
            expiredDate: med.expiredDate || ''
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xoá loại thuốc này không?")) {
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2><Pill size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Danh mục thuốc</h2>
                <input
                    type="text"
                    placeholder="Tìm kiếm thuốc, đơn vị..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', minWidth: '250px' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="table-container" style={{ flex: '2 1 500px' }}>
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
                                    <td>{med.price} VNĐ</td>
                                    <td>{med.quantity}</td>
                                    <td>{med.expiredDate}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => handleEdit(med)} className="btn-edit" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(med.id)} className="btn-delete" title="Delete">
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

                <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0 }}>{editingId ? 'Cập nhật Thuốc' : 'Thêm Thuốc mới'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Tên thuốc</label>
                            <input 
                                type="text" name="name" 
                                value={formData.name} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Đơn vị tính</label>
                            <input 
                                type="text" name="unit" 
                                value={formData.unit} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Giá (VNĐ)</label>
                            <input 
                                type="number" step="0.01" min="0" name="price" 
                                value={formData.price} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Số lượng</label>
                            <input 
                                type="number" min="0" name="quantity" 
                                value={formData.quantity} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Hạn sử dụng</label>
                            <input 
                                type="date" name="expiredDate" 
                                value={formData.expiredDate} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                {editingId ? <Edit size={16} /> : <Plus size={16} />} 
                                {editingId ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', unit: '', price: '', quantity: '', expiredDate: '' }); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MedicineManager;
