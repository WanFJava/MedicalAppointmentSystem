import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty } from '../../api/adminApi';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const SpecialtyManager = () => {
    const navigate = useNavigate();
    const [specialties, setSpecialties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            const errMsg = typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message);
            alert("Lưu chuyên khoa thất bại: " + errMsg);
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

    if (loading) return <div>Đang tải...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý Chuyên khoa</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm chuyên khoa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ minWidth: '250px' }}
                    />
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Thêm chuyên khoa
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên chuyên khoa</th>
                            <th>Mô tả</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specialties.filter(spec => (spec.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())).map((spec) => (
                            <tr key={spec.id}>
                                <td>#{spec.id}</td>
                                <td style={{ fontWeight: 500 }}>{spec.name}</td>
                                <td>
                                    <button 
                                        onClick={() => navigate(`/specialty/${spec.id}`)}
                                        style={{
                                            backgroundColor: '#f0f9ff',
                                            border: '1px solid #bae6fd',
                                            color: '#0284c7',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.borderColor = '#7dd3fc'; }}
                                        onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>
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
                        {specialties.filter(spec => (spec.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())).length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy chuyên khoa nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Cập nhật Chuyên khoa' : 'Thêm Chuyên khoa mới'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Tên chuyên khoa</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
                                    placeholder="Ví dụ: Tim mạch (Cardiology)"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Mô tả chi tiết</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(content) => setFormData({...formData, description: content})}
                                    style={{ backgroundColor: 'white', borderRadius: '0.5rem', marginBottom: '3rem' }}
                                    placeholder="Nhập mô tả chi tiết, hỗ trợ in đậm, gạch đầu dòng..."
                                />
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Lưu chuyên khoa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialtyManager;
