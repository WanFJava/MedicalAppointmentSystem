package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.PatientDto;

public interface PatientService {
    PatientDto getPatientProfileByUserId(Long userId);
    PatientDto updatePatientProfile(Long userId, PatientDto patientDto);
    
    void addFavoriteDoctor(Long userId, Long doctorId);
    void removeFavoriteDoctor(Long userId, Long doctorId);
    java.util.List<com.smartclinic.backend.dto.DoctorDto> getFavoriteDoctors(Long userId);
}
