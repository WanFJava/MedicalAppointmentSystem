package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.PatientDto;
import com.smartclinic.backend.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping("/profile/{userId}")
    @PreAuthorize("hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<PatientDto> getPatientProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(patientService.getPatientProfileByUserId(userId));
    }

    @PutMapping("/profile/{userId}")
    @PreAuthorize("hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<PatientDto> updatePatientProfile(
            @PathVariable Long userId,
            @RequestBody PatientDto patientDto) {
        return ResponseEntity.ok(patientService.updatePatientProfile(userId, patientDto));
    }
}
