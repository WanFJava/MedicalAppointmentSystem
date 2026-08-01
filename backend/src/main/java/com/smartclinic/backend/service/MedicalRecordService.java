package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.DiagnosisRequestDto;
import com.smartclinic.backend.dto.MedicalRecordDto;

public interface MedicalRecordService {
    MedicalRecordDto diagnosePatient(Long appointmentId, Long doctorId, DiagnosisRequestDto requestDto);
    MedicalRecordDto getMedicalRecordByAppointmentId(Long appointmentId);
}
