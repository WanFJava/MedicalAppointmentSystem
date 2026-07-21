package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.DiagnosisRequestDto;
import com.smartclinic.backend.dto.MedicalRecordDto;
import com.smartclinic.backend.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping("/diagnose/{appointmentId}/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MedicalRecordDto> diagnosePatient(
            @PathVariable Long appointmentId,
            @PathVariable Long doctorId,
            @RequestBody DiagnosisRequestDto requestDto) {
        return new ResponseEntity<>(medicalRecordService.diagnosePatient(appointmentId, doctorId, requestDto), HttpStatus.CREATED);
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<MedicalRecordDto> getMedicalRecordByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordByAppointmentId(appointmentId));
    }
}
