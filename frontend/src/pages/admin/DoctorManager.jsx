import React, { useState, useEffect } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor, getSpecialties } from '../../api/adminApi';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const DoctorManager = () => {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ userId: '', email: '', password: '', fullName: '', phone: '', specialtyId: '', degree: '', experience: 0, consultationFee: 0, biography: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [doctorsData, specData] = await Promise.all([
                getDoctors(),
                getSpecialties()
            ]);
            setDoctors(doctorsData);
            setSpecialties(specData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (doctor = null) => {
        if (doctor) {
            setFormData({ 
                userId: doctor.userId, 
                email: doctor.email || '',
                password: '',
                fullName: doctor.fullName || '',
                phone: doctor.phone || '',
                specialtyId: doctor.specialtyId, 
                degree: doctor.degree,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                biography: doctor.biography || ''
            });
            setEditingId(doctor.id);
        } else {
            setFormData({ userId: '', email: '', password: '', fullName: '', phone: '', specialtyId: specialties[0]?.id || '', degree: '', experience: 0, consultationFee: 0, biography: '' });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoctor(editingId, formData);
            } else {
                await createDoctor(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to save doctor", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this doctor?")) {
            try {
                await deleteDoctor(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete doctor", error);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="page-header">
                <h2>Doctors Management</h2>
                <button className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Doctor
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Doctor</th>
                            <th>Specialty</th>
                            <th>Degree</th>
                            <th>Experience</th>
                            <th>Fee</th>
                            <th>Biography</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map((doc) => (
                            <tr key={doc.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                                            {doc.fullName?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{doc.fullName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{doc.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{doc.specialtyName}</td>
                                <td>{doc.degree}</td>
                                <td>{doc.experience} years</td>
                                <td>${doc.consultationFee}</td>
                                <td style={{ maxWidth: '250px' }}>
                                    <div style={{ color: '#6b7280', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {doc.biography || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No biography</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(doc)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(doc.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {doctors.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No doctors found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {!editingId && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.fullName} 
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            placeholder="Dr. John Doe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input 
                                            type="email" 
                                            required 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="doctor@clinic.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input 
                                            type="tel" 
                                            required 
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input 
                                            type="password" 
                                            required 
                                            value={formData.password} 
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            placeholder="Password for login"
                                        />
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Specialty</label>
                                    <select 
                                        className="form-control"
                                        value={formData.specialtyId}
                                        onChange={(e) => setFormData({...formData, specialtyId: e.target.value})}
                                        required
                                    >
                                        <option value="" disabled>Select Specialty</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Degree</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.degree} 
                                        onChange={(e) => setFormData({...formData, degree: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Experience (Years)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.experience} 
                                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Consultation Fee</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required 
                                        value={formData.consultationFee} 
                                        onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Biography</label>
                                <textarea 
                                    className="form-control"
                                    rows="4"
                                    value={formData.biography} 
                                    onChange={(e) => setFormData({...formData, biography: e.target.value})}
                                    placeholder="Enter doctor's biography..."
                                ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Doctor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorManager;
