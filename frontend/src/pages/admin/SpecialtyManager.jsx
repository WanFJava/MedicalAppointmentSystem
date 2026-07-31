import React, { useState, useEffect } from 'react';
import { getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty } from '../../api/adminApi';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const SpecialtyManager = () => {
    const [specialties, setSpecialties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSpecialties();
    }, []);

    const fetchSpecialties = async () => {
        try {
            const data = await getSpecialties();
            setSpecialties(data);
        } catch (error) {
            console.error("Failed to fetch specialties", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (specialty = null) => {
        if (specialty) {
            setFormData({ name: specialty.name, description: specialty.description });
            setEditingId(specialty.id);
        } else {
            setFormData({ name: '', description: '' });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateSpecialty(editingId, formData);
            } else {
                await createSpecialty(formData);
            }
            setIsModalOpen(false);
            fetchSpecialties();
        } catch (error) {
            console.error("Failed to save specialty", error);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa chuyên khoa "${name}" không?`)) {
            try {
                await deleteSpecialty(id);
                fetchSpecialties();
            } catch (error) {
                console.error("Failed to delete specialty", error);
                const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
                alert("Xóa chuyên khoa thất bại: " + errMsg);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Specialties Management</h2>
                <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Specialty
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specialties.map((spec) => (
                            <tr key={spec.id}>
                                <td>#{spec.id}</td>
                                <td style={{ fontWeight: 500 }}>{spec.name}</td>
                                <td>{spec.description?.substring(0, 50)}...</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(spec)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(spec.id, spec.name)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {specialties.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No specialties found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Specialty' : 'Add New Specialty'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Specialty Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    className="form-control"
                                    rows="4"
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Specialty</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialtyManager;
