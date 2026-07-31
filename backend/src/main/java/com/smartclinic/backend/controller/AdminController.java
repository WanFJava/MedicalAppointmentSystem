package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.DashboardDto;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final SpecialtyRepository specialtyRepository;
    private final FeedbackRepository feedbackRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardDto> getDashboardStats() {
        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long activeSpecialties = specialtyRepository.count();
        
        // Count appointments today
        LocalDate today = LocalDate.now();
        long appointmentsToday = appointmentRepository.findAll().stream()
                .filter(apt -> apt.getSchedule() != null && apt.getSchedule().getDate().equals(today))
                .count();

        DashboardDto stats = new DashboardDto(
                totalDoctors,
                totalPatients,
                appointmentsToday,
                activeSpecialties,
                feedbackRepository.count()
        );

        return ResponseEntity.ok(stats);
    }
}
