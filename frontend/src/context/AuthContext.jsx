import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavoriteDoctors, addFavoriteDoctor, removeFavoriteDoctor } from '../api/patientApi';

// oxlint-disable-next-line react/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [favoriteDoctorIds, setFavoriteDoctorIds] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.role === 'PATIENT') {
                fetchFavorites(parsedUser.id);
            }
        }
        setLoading(false);
    }, []);

    const fetchFavorites = async (userId) => {
        try {
            const docs = await getFavoriteDoctors(userId);
            setFavoriteDoctorIds(new Set(docs.map(d => d.id)));
        } catch (error) {
            console.error("Failed to fetch favorites", error);
        }
    };

    const toggleFavorite = async (doctorId) => {
        if (!user || user.role !== 'PATIENT') return;
        try {
            if (favoriteDoctorIds.has(doctorId)) {
                await removeFavoriteDoctor(user.id, doctorId);
                setFavoriteDoctorIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(doctorId);
                    return newSet;
                });
            } else {
                await addFavoriteDoctor(user.id, doctorId);
                setFavoriteDoctorIds(prev => new Set(prev).add(doctorId));
            }
        } catch (error) {
            console.error("Failed to toggle favorite", error);
        }
    };

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', userData.accessToken);

        if (userData.role === 'PATIENT') {
            fetchFavorites(userData.id);
        }

        if (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userData.role)) {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    const logout = () => {
        setUser(null);
        setFavoriteDoctorIds(new Set());
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, favoriteDoctorIds, toggleFavorite }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
