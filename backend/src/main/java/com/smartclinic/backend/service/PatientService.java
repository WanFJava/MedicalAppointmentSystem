package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.PatientDto;

public interface PatientService {
    PatientDto getPatientProfileByUserId(Long userId);
    PatientDto updatePatientProfile(Long userId, PatientDto patientDto);
}
