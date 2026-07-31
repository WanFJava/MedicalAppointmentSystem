package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.PatientDto;
import com.smartclinic.backend.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.smartclinic.backend.dto.DoctorDto;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping("/profile/{userId}")
    @PreAuthorize("hasRole('PATIENT') or hasRole('ADMIN') or hasRole('DOCTOR')")
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

    @PostMapping("/{userId}/favorites/{doctorId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> addFavoriteDoctor(@PathVariable Long userId, @PathVariable Long doctorId) {
        patientService.addFavoriteDoctor(userId, doctorId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/favorites/{doctorId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> removeFavoriteDoctor(@PathVariable Long userId, @PathVariable Long doctorId) {
        patientService.removeFavoriteDoctor(userId, doctorId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/favorites")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<DoctorDto>> getFavoriteDoctors(@PathVariable Long userId) {
        return ResponseEntity.ok(patientService.getFavoriteDoctors(userId));
    }
}
