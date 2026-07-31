import React, { useState, useEffect, useContext } from 'react';
import { Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getFavoriteDoctors } from '../api/patientApi';
import DoctorCard from '../components/DoctorCard';

const FavoriteDoctors = () => {
    const { user, favoriteDoctorIds } = useContext(AuthContext);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') {
            setLoading(false);
            return;
        }
        let isCancelled = false;
        const loadDoctors = async () => {
            try {
                setLoading(true);
                const data = await getFavoriteDoctors(user.id);
                if (!isCancelled) setDoctors(data);
            } catch (requestError) {
                console.error("Failed to fetch favorite doctors", requestError);
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };
        loadDoctors();
        return () => {
            isCancelled = true;
        };
    }, [user, favoriteDoctorIds]);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: '#6b7280' }}>Loading favorite doctors...</div>;
    }

    if (!user || user.role !== 'PATIENT') {
        return (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>Access Denied</h2>
                <p style={{ color: '#6b7280', marginTop: '1rem' }}>You must be logged in as a patient to view favorite doctors.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Heart size={36} fill="#fbbf24" color="#fbbf24" />
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '0.25rem' }}>Favorite Doctors</h1>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Your personal list of preferred medical professionals.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {doctors.map((doc) => (
                        <DoctorCard key={doc.id} doc={doc} />
                    ))}
                    {doctors.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
                            <Heart size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', color: '#4b5563', fontWeight: '600' }}>No favorite doctors yet</h3>
                            <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Start exploring and heart your preferred doctors to see them here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoriteDoctors;
