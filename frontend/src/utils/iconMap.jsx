import React from 'react';
import { Heart, Baby, Eye, Ear, Bone, Activity, Stethoscope, Brain, Smile, Sparkles } from 'lucide-react';

export const getSpecialtyIconAndColor = (specName) => {
    const name = specName.toLowerCase();
    
    if (name.includes('tim') || name.includes('cardio')) {
        return { icon: Heart, color: '#ef4444', bg: '#fee2e2' }; // Red
    }
    if (name.includes('nhi') || name.includes('pediatric')) {
        return { icon: Baby, color: '#f59e0b', bg: '#fef3c7' }; // Yellow/Orange
    }
    if (name.includes('mắt') || name.includes('eye')) {
        return { icon: Eye, color: '#3b82f6', bg: '#dbeafe' }; // Blue
    }
    if (name.includes('tai mũi họng') || name.includes('ent')) {
        return { icon: Ear, color: '#8b5cf6', bg: '#ede9fe' }; // Purple
    }
    if (name.includes('xương') || name.includes('cơ xương') || name.includes('ortho')) {
        return { icon: Bone, color: '#64748b', bg: '#f1f5f9' }; // Slate
    }
    if (name.includes('thần kinh') || name.includes('neuro')) {
        return { icon: Brain, color: '#d946ef', bg: '#fae8ff' }; // Fuchsia
    }
    if (name.includes('nha khoa') || name.includes('răng')) {
        return { icon: Smile, color: '#0ea5e9', bg: '#e0f2fe' }; // Sky
    }
    if (name.includes('da liễu') || name.includes('derma')) {
        return { icon: Sparkles, color: '#ec4899', bg: '#fce7f3' }; // Pink
    }
    
    // Default
    return { icon: Stethoscope, color: '#4f46e5', bg: '#e0e7ff' }; // Indigo
};
