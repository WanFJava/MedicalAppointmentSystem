package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.DashboardDto;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.FeedbackRepository;
import com.smartclinic.backend.repository.ComplaintRepository;
import com.smartclinic.backend.entity.ComplaintStatus;
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
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final SpecialtyRepository specialtyRepository;
    private final FeedbackRepository feedbackRepository;
    private final ComplaintRepository complaintRepository;
    private final com.smartclinic.backend.repository.NotificationRepository notificationRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDto> getDashboardStats() {
        long totalDoctors = doctorRepository.findAll().stream()
                .filter(d -> d.getUser() != null && d.getUser().getStatus() == com.smartclinic.backend.entity.Status.ACTIVE)
                .count();
        long totalPatients = patientRepository.count();
        long activeSpecialties = specialtyRepository.count();

        // Count appointments today
        LocalDate today = LocalDate.now();
        long appointmentsToday = appointmentRepository.findAll().stream()
                .filter(apt -> apt.getSchedule() != null && apt.getSchedule().getDate().equals(today))
                .count();

        // Count feedbacks and complaints
        long totalFeedbacks = feedbackRepository.count();
        long pendingComplaints = complaintRepository.findAll().stream()
                .filter(c -> c.getStatus() == ComplaintStatus.PENDING)
                .count();

        DashboardDto stats = new DashboardDto(
                totalDoctors,
                totalPatients,
                appointmentsToday,
                activeSpecialties,
                totalFeedbacks,
                pendingComplaints
        );

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<java.util.List<com.smartclinic.backend.dto.NotificationDto>> getRecentActivity() {
        java.util.List<com.smartclinic.backend.entity.Notification> all = notificationRepository.findTop10ByOrderByCreatedAtDesc();
        java.util.List<com.smartclinic.backend.dto.NotificationDto> dtos = all.stream().map(n -> {
            long minutes = java.time.Duration.between(n.getCreatedAt(), java.time.LocalDateTime.now()).toMinutes();
            String timeAgo = minutes < 60 ? minutes + " phút trước" : (minutes / 60) + " giờ trước";
            return com.smartclinic.backend.dto.NotificationDto.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .timeAgo(timeAgo)
                .build();
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
