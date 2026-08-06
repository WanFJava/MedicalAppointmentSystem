import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, lockUser, uploadFile } from '../../api/adminApi';
import { Edit2, Plus, X, Lock, Unlock, Search } from 'lucide-react';
import Swal from 'sweetalert2';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [avatarUploadType, setAvatarUploadType] = useState('url');

    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', phone: '', role: 'PATIENT', status: 'ACTIVE', avatar: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = users;
        if (searchTerm) {
            result = result.filter(u =>
                u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (roleFilter) {
            result = result.filter(u => u.role === roleFilter);
        }
        if (statusFilter) {
            result = result.filter(u => u.status === statusFilter);
        }
        setFilteredUsers(result);
    }, [users, searchTerm, roleFilter, statusFilter]);

    const fetchData = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            Swal.fire('Error', 'Could not load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                password: '', // blank on edit
                phone: user.phone || '',
                role: user.role,
                status: user.status,
                avatar: user.avatar || ''
            });
            setEditingId(user.id);
        } else {
            setFormData({
                fullName: '', email: '', password: '', phone: '', role: 'PATIENT', status: 'ACTIVE', avatar: ''
            });
            setEditingId(null);
        }
        setAvatarUploadType('url');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateUser(editingId, formData);
                Swal.fire('Success', 'User updated successfully', 'success');
            } else {
                if (!formData.password) {
                    Swal.fire('Error', 'Password is required for new users', 'error');
                    return;
                }
                await createUser(formData);
                Swal.fire('Success', 'User created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to save user", error);
            Swal.fire('Error', error.response?.data?.message || error.response?.data || 'Failed to save user', 'error');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const url = await uploadFile(file);
                // Assume the backend returns a relative URL or absolute URL
                // Actually the backend returns something like http://localhost:8080/uploads/...
                // But axios returns the data. If it returns just text, Axios parses it.
                setFormData({ ...formData, avatar: url });
                Swal.fire('Success', 'File uploaded successfully', 'success');
            } catch (error) {
                console.error('File upload failed', error);
                Swal.fire('Error', 'Failed to upload file', 'error');
            }
        }
    };

    const handleToggleLock = async (user) => {
        const action = user.status === 'LOCKED' ? 'unlock' : 'lock';
        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${action} the account for ${user.fullName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: `Yes, ${action} it!`
        });

        if (result.isConfirmed) {
            try {
                // If the user is currently LOCKED, we update their status to ACTIVE via updateUser.
                // If ACTIVE, we can use the dedicated lockUser endpoint (or updateUser).
                if (user.status === 'LOCKED') {
                    await updateUser(user.id, { ...user, status: 'ACTIVE' });
                } else {
                    await lockUser(user.id);
                }
                Swal.fire('Success', `User account has been ${action}ed.`, 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Failed to update user status', 'error');
            }
        }
    };

    if (loading) return <div>Đang tải...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Quản lý Người dùng</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email..."
                            className="form-control"
                            style={{ paddingLeft: '2.5rem', width: '250px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">Tất cả vai trò</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="DOCTOR">DOCTOR</option>
                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                        <option value="PATIENT">PATIENT</option>
                    </select>
                    <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="LOCKED">LOCKED</option>
                    </select>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Thêm người dùng
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Người dùng</th>
                            <th>Số điện thoại</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tham gia</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '1rem', overflow: 'hidden', borderRadius: '50%' }}>
                                            {u.avatar ? (
                                                <img
                                                    src={u.avatar}
                                                    alt="Avatar"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'U')}&background=random`; }}
                                                />
                                            ) : (
                                                u.fullName?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{u.fullName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{u.phone || '-'}</td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        backgroundColor: u.role === 'ADMIN' ? '#cffafe' : u.role === 'DOCTOR' ? '#e0e7ff' : u.role === 'RECEPTIONIST' ? '#fef08a' : '#f3f4f6',
                                        color: u.role === 'ADMIN' ? '#155e75' : u.role === 'DOCTOR' ? '#3730a3' : u.role === 'RECEPTIONIST' ? '#854d0e' : '#374151'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        backgroundColor: u.status === 'ACTIVE' ? '#d1fae5' : (u.status === 'LOCKED' ? '#fee2e2' : '#fef3c7'),
                                        color: u.status === 'ACTIVE' ? '#047857' : (u.status === 'LOCKED' ? '#b91c1c' : '#b45309'),
                                        border: `1px solid ${u.status === 'ACTIVE' ? '#6ee7b7' : (u.status === 'LOCKED' ? '#fca5a5' : '#fde68a')}`
                                    }}>
                                        {u.status === 'ACTIVE' ? '● Active' : (u.status === 'LOCKED' ? '● Locked' : '● Inactive')}
                                    </span>
                                </td>
                                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                                <td>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(u)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            style={{ color: u.status === 'LOCKED' ? '#059669' : '#dc2626' }}
                                            onClick={() => handleToggleLock(u)}
                                            title={u.status === 'LOCKED' ? 'Unlock User' : 'Lock User'}
                                        >
                                            {u.status === 'LOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy người dùng nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Cập nhật Người dùng' : 'Thêm Người dùng mới'}</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Họ và tên</label>
                                    <input
                                        type="text" required className="form-control"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email" required className="form-control"
                                        value={formData.email}
                                        disabled={!!editingId}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Số điện thoại</label>
                                    <input
                                        type="tel" className="form-control"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{editingId ? 'Mật khẩu mới (bỏ trống để giữ nguyên)' : 'Mật khẩu'}</label>
                                    <input
                                        type="password" className="form-control"
                                        required={!editingId}
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vai trò</label>
                                    <select
                                        className="form-control" required
                                        value={formData.role}
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    >
                                        <option value="PATIENT">PATIENT</option>
                                        <option value="DOCTOR">DOCTOR</option>
                                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        className="form-control" required
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="ACTIVE" title="Được đăng nhập và sử dụng hệ thống.">ACTIVE – Được đăng nhập và sử dụng hệ thống</option>
                                        <option value="INACTIVE" title="Không được đăng nhập; dùng khi tài khoản tạm thời hoặc vĩnh viễn không còn hoạt động.">INACTIVE – Không được đăng nhập (ngừng hoạt động)</option>
                                        <option value="LOCKED" title="Không được đăng nhập; dùng cho các trường hợp liên quan đến bảo mật hoặc xử lý vi phạm.">LOCKED – Không được đăng nhập (khóa bảo mật/vi phạm)</option>
                                    </select>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                        {formData.status === 'ACTIVE' && 'Được đăng nhập và sử dụng hệ thống.'}
                                        {formData.status === 'INACTIVE' && 'Không được đăng nhập; dùng khi tài khoản tạm thời hoặc vĩnh viễn không còn hoạt động.'}
                                        {formData.status === 'LOCKED' && 'Không được đăng nhập; dùng cho các trường hợp liên quan đến bảo mật hoặc xử lý vi phạm.'}
                                    </div>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Ảnh đại diện</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <label>
                                            <input type="radio" name="avatarType" checked={avatarUploadType === 'url'} onChange={() => setAvatarUploadType('url')} /> Dùng URL
                                        </label>
                                        <label>
                                            <input type="radio" name="avatarType" checked={avatarUploadType === 'file'} onChange={() => setAvatarUploadType('file')} /> Tải file lên
                                        </label>
                                    </div>
                                    {avatarUploadType === 'url' ? (
                                        <input
                                            type="text" className="form-control" placeholder="https://example.com/avatar.png"
                                            value={formData.avatar}
                                            onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                                        />
                                    ) : (
                                        <input
                                            type="file" className="form-control" accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    )}
                                    {formData.avatar && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <img
                                                src={formData.avatar}
                                                alt="Preview"
                                                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'U')}&background=random`; }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Lưu người dùng</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
