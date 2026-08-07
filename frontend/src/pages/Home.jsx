import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Activity, Clock, Shield, Search, Star, ArrowRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDoctors, getSpecialties } from '../api/adminApi';

const Home = () => {
    const { user, favoriteDoctorIds, toggleFavorite } = useContext(AuthContext);
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docs = await getDoctors();
                const specs = await getSpecialties();

                // Filter doctors with fairly high to high rating (>= 4.0) and sort descending
                const highRatedDocs = docs
                    .filter(d => d.averageRating >= 4.0 && d.status === 'ACTIVE')
                    .sort((a, b) => b.averageRating - a.averageRating);

                setDoctors(highRatedDocs);
                setSpecialties(specs);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        fetchData();
    }, []);



    return (
        <div>
            {/* Hero Section */}
            <div style={{
                background: 'radial-gradient(circle at center top, #e0f2fe 0%, #f8fafc 100%)',
                padding: '8rem 2rem 6rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background circles */}
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)', opacity: 0.6, borderRadius: '50%', filter: 'blur(40px)' }}></div>
                <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)', opacity: 0.5, borderRadius: '50%', filter: 'blur(50px)' }}></div>

                <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <h1 style={{
                        fontSize: '4rem',
                        fontWeight: '800',
                        color: '#0f172a',
                        marginBottom: '1.5rem',
                        lineHeight: 1.15,
                        letterSpacing: '-0.02em'
                    }}>
                        Sức khỏe của bạn là <br/>
                        <span style={{ 
                            background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)', 
                            WebkitBackgroundClip: 'text', 
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>Ưu tiên hàng đầu</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#475569',
                        marginBottom: '3rem',
                        lineHeight: 1.6,
                        maxWidth: '700px',
                        margin: '0 auto 3rem'
                    }}>
                        Trải nghiệm dịch vụ chăm sóc y tế đẳng cấp với đội ngũ chuyên gia hàng đầu. Đặt lịch khám trực tuyến nhanh chóng, an toàn và tiện lợi.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if(searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                            else navigate(`/search`);
                        }}
                        style={{ 
                            position: 'relative', 
                            maxWidth: '650px', 
                            margin: '0 auto 3.5rem', 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', 
                            borderRadius: '3rem',
                            backgroundColor: 'white',
                            display: 'flex',
                            padding: '0.5rem',
                            border: '1px solid #e2e8f0',
                            transition: 'box-shadow 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 25px 30px -5px rgba(37, 99, 235, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.05)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1.5rem', color: '#94a3b8' }}>
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm bác sĩ, chuyên khoa, dịch vụ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '1rem 1.5rem',
                                border: 'none',
                                outline: 'none',
                                fontSize: '1.1rem',
                                backgroundColor: 'transparent',
                                color: '#1e293b'
                            }}
                        />
                        <button type="submit" style={{ 
                            background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)', 
                            color: 'white', 
                            border: 'none', 
                            padding: '0 2rem', 
                            borderRadius: '2.5rem', 
                            fontWeight: '600', 
                            fontSize: '1.05rem', 
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Tìm kiếm
                        </button>
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            style={{ 
                                padding: '1rem 2.5rem', 
                                fontSize: '1.1rem', 
                                fontWeight: '600',
                                backgroundColor: '#1e293b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            onClick={() => {
                                if (user) {
                                    if (user.role === 'ADMIN') navigate('/admin');
                                    else navigate('/book');
                                } else {
                                    navigate('/login');
                                }
                            }}
                        >
                            {user?.role === 'ADMIN' ? 'Bảng điều khiển Quản trị' : 'Đặt lịch khám ngay'} <ArrowRight size={18}/>
                        </button>
                        {!user && (
                            <button
                                style={{
                                    padding: '1rem 2.5rem',
                                    fontSize: '1.1rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                onClick={() => navigate('/register')}
                            >
                                Tạo tài khoản mới
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Specialties Section */}
            <div style={{ padding: '6rem 2rem', backgroundColor: '#f8fafc' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Chuyên khoa của chúng tôi</h2>
                        <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>Đa dạng các chuyên khoa khám chữa bệnh, đáp ứng mọi nhu cầu chăm sóc sức khỏe của bạn.</p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateRows: '1fr 1fr',
                        gridAutoFlow: 'column',
                        gridAutoColumns: 'minmax(280px, calc((100% - 4.5rem) / 4))',
                        overflowX: 'auto', 
                        gap: '1.5rem', 
                        paddingBottom: '2rem',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent'
                    }}>
                        {specialties.map((spec) => (
                            <div key={spec.id} style={{
                                scrollSnapAlign: 'start',
                                backgroundColor: 'white',
                                padding: '2.5rem 1.5rem',
                                borderRadius: '1.5rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                height: '100%',
                            }}
                            onClick={() => navigate(`/specialty/${spec.id}`)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = '0 25px 30px -5px rgba(14, 165, 233, 0.15)';
                                e.currentTarget.style.borderColor = '#bae6fd';
                                const arrow = e.currentTarget.querySelector('.arrow-icon');
                                if (arrow) arrow.style.transform = 'translateX(5px)';
                                const iconContainer = e.currentTarget.querySelector('.icon-container');
                                if (iconContainer) iconContainer.style.transform = 'scale(1.1) rotate(5deg)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                const arrow = e.currentTarget.querySelector('.arrow-icon');
                                if (arrow) arrow.style.transform = 'translateX(0)';
                                const iconContainer = e.currentTarget.querySelector('.icon-container');
                                if (iconContainer) iconContainer.style.transform = 'scale(1) rotate(0deg)';
                            }}
                            >
                                <div className="icon-container" style={{
                                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                    color: '#0284c7',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)',
                                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    <Activity size={36} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', lineHeight: '1.4' }}>{spec.name}</h3>

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9',
                                    fontWeight: '600', fontSize: '0.9rem', marginTop: 'auto',
                                    padding: '0.6rem 1.25rem', backgroundColor: '#f0f9ff', borderRadius: '2rem',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <span>Xem chi tiết</span>
                                    <ArrowRight className="arrow-icon" size={16} style={{ transition: 'transform 0.3s ease' }} />
                                </div>
                            </div>
                        ))}
                        {specialties.length === 0 && (
                            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center' }}>Không có chuyên khoa nào.</p>
                        )}
                    </div>
                </div>
            </div>


            {/* Doctors Section */}
            <div style={{ padding: '6rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Bác sĩ Đánh giá Cao</h2>
                        <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '600px' }}>Những chuyên gia y tế hàng đầu được bệnh nhân tin tưởng và đánh giá cao nhất.</p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateRows: '1fr 1fr',
                        gridAutoFlow: 'column',
                        gridAutoColumns: 'minmax(300px, calc((100% - 3 * 2rem) / 4))',
                        overflowX: 'auto', 
                        gap: '2rem', 
                        paddingBottom: '2.5rem',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent'
                    }}>
                        {doctors.map((doc) => (
                            <div key={doc.id} style={{
                                scrollSnapAlign: 'start',
                                backgroundColor: 'white',
                                borderRadius: '1.5rem',
                                overflow: 'hidden',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
                                border: '1px solid #f1f5f9',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                            onClick={() => navigate(`/doctor/${doc.id}`)}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-12px)';
                                e.currentTarget.style.boxShadow = '0 25px 30px -5px rgba(0, 0, 0, 0.08), 0 15px 15px -5px rgba(0, 0, 0, 0.04)';
                                e.currentTarget.style.borderColor = '#e0e7ff';
                                const img = e.currentTarget.querySelector('.doctor-img');
                                if (img) img.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                const img = e.currentTarget.querySelector('.doctor-img');
                                if (img) img.style.transform = 'scale(1)';
                            }}
                            >
                                <div style={{ height: '240px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                                    {user && user.role === 'PATIENT' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id); }}
                                            style={{
                                                position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                                                background: 'white', border: 'none', borderRadius: '50%',
                                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer',
                                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <Heart size={22} fill={favoriteDoctorIds?.has(doc.id) ? '#ef4444' : 'none'} color={favoriteDoctorIds?.has(doc.id) ? '#ef4444' : '#94a3b8'} />
                                        </button>
                                    )}
                                    {doc.avatar ? (
                                        <img className="doctor-img" src={doc.avatar} alt={doc.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                                    ) : (
                                        <div className="doctor-img" style={{ width: '100%', height: '100%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '4rem', fontWeight: 'bold', transition: 'transform 0.5s ease' }}>
                                            {doc.fullName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <span style={{ color: '#0ea5e9', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{doc.specialtyName}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fffbeb', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: '700' }}>
                                            <Star size={14} fill="#f59e0b" color="#f59e0b" /> {doc.averageRating?.toFixed(1) || '0.0'}
                                        </div>
                                    </div>
                                    
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.25rem', lineHeight: '1.3' }}>{doc.fullName}</h3>
                                    <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '500', marginBottom: '1.25rem' }}>{doc.degree}</div>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: '0.95rem', paddingBottom: '1.25rem', borderBottom: '1px dashed #cbd5e1', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ backgroundColor: '#f1f5f9', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Clock size={16} color="#64748b" />
                                            </div>
                                            <span><strong style={{ color: '#334155' }}>{doc.experience}</strong> năm K.N</span>
                                        </div>
                                        <div style={{ fontWeight: '800', color: '#059669', fontSize: '1.1rem' }}>
                                            {doc.consultationFee?.toLocaleString()}đ
                                        </div>
                                    </div>

                                    <button
                                        style={{
                                            width: '100%', padding: '0.9rem', borderRadius: '0.75rem',
                                            background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                                            color: 'white', border: 'none',
                                            fontWeight: '700', fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s',
                                            boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 10px -1px rgba(14, 165, 233, 0.4)'; }}
                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(14, 165, 233, 0.3)'; }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (user) {
                                                const targetPath = (doc.canClinicVisit === false || (doc.canClinicVisit == null && doc.canHomeVisit === true)) ? '/book-home-visit' : '/book';
                                                navigate(targetPath, { state: { preselectDoctor: doc.id } });
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                    >
                                        Đặt khám ngay
                                    </button>
                                </div>
                            </div>
                        ))}
                        {doctors.length === 0 && (
                            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center' }}>Không có bác sĩ nào được đánh giá cao.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div style={{ padding: '6rem 2rem', backgroundColor: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Tại sao chọn chúng tôi?</h2>
                        <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>Dịch vụ y tế hàng đầu với cam kết mang lại trải nghiệm chăm sóc sức khỏe hoàn hảo nhất cho bạn và gia đình.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
                        {[
                            { icon: <Activity size={32} />, title: 'Bác sĩ Chuyên môn', desc: 'Đội ngũ y bác sĩ đầu ngành với nhiều năm kinh nghiệm tại các bệnh viện lớn.', bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#2563eb' },
                            { icon: <Calendar size={32} />, title: 'Đặt lịch dễ dàng', desc: 'Hệ thống đặt lịch trực tuyến thông minh, tiết kiệm thời gian chờ đợi.', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#16a34a' },
                            { icon: <Clock size={32} />, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp và hỗ trợ mọi lúc.', bg: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)', color: '#ca8a04' },
                            { icon: <Shield size={32} />, title: 'Bảo mật tuyệt đối', desc: 'Hồ sơ bệnh án điện tử được mã hóa và bảo mật theo tiêu chuẩn quốc tế.', bg: 'linear-gradient(135deg, #fae8ff 0%, #f5d0fe 100%)', color: '#c026d3' }
                        ].map((feature, index) => (
                            <div key={index} style={{
                                padding: '2.5rem 2rem',
                                borderRadius: '1.5rem',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #f1f5f9',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                cursor: 'default'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                                <div style={{
                                    background: feature.bg,
                                    color: feature.color,
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    transform: 'rotate(-5deg)'
                                }}>
                                    <div style={{ transform: 'rotate(5deg)' }}>
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>{feature.title}</h3>
                                <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1.05rem' }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
