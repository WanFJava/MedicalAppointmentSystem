import React, { useState, useEffect } from 'react';
import { getAllMedicines, createMedicine, updateMedicine, deleteMedicine } from '../../api/medicineApi';
import { Pill, Plus, Edit, Trash2 } from 'lucide-react';

const MedicineManager = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({ name: '', unit: '', price: '', quantity: '', expiredDate: '' });
    const [editingId, setEditingId] = useState(null);

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
        if (window.confirm("Are you sure you want to delete this medicine?")) {
            try {
                await deleteMedicine(id);
                fetchMedicines();
            } catch (error) {
                console.error("Failed to delete medicine", error);
                alert("Error deleting medicine");
            }
        }
    };

    if (loading && medicines.length === 0) return <div style={{ padding: '2rem' }}>Loading medicines...</div>;

    return (
        <div>
            <div className="page-header">
                <h2><Pill size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Medicine Catalog</h2>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="table-container" style={{ flex: '2 1 500px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Unit</th>
                                <th>Price ($)</th>
                                <th>Quantity</th>
                                <th>Expired Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map((med) => (
                                <tr key={med.id}>
                                    <td style={{ fontWeight: 500 }}>{med.name}</td>
                                    <td>{med.unit}</td>
                                    <td>${med.price}</td>
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
                            {medicines.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No medicines found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ flex: '1 1 300px', backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Name</label>
                            <input 
                                type="text" name="name" 
                                value={formData.name} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Unit</label>
                            <input 
                                type="text" name="unit" 
                                value={formData.unit} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Price ($)</label>
                            <input 
                                type="number" step="0.01" min="0" name="price" 
                                value={formData.price} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Quantity</label>
                            <input 
                                type="number" min="0" name="quantity" 
                                value={formData.quantity} onChange={handleChange} 
                                required 
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Expired Date</label>
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
                                {editingId ? 'Update' : 'Add'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', unit: '', price: '', quantity: '', expiredDate: '' }); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}>
                                    Cancel
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
