package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.FeedbackDto;
import com.smartclinic.backend.entity.Appointment;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Feedback;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.FeedbackRepository;
import com.smartclinic.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    @Override
    @Transactional
    public FeedbackDto createFeedback(FeedbackDto dto) {
        if (dto == null || dto.getAppointmentId() == null) {
            throw new IllegalArgumentException("Appointment is required.");
        }
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Can only review completed appointments.");
        }
        ensureCurrentPatientOwns(appointment);

        if (Boolean.TRUE.equals(appointment.getIsReviewed())
                || feedbackRepository.findByAppointmentId(appointment.getId()).isPresent()) {
            throw new IllegalArgumentException("This appointment is already reviewed.");
        }

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        Feedback feedback = new Feedback();
        feedback.setPatient(patient);
        feedback.setDoctor(doctor);
        feedback.setAppointment(appointment);
        feedback.setRating(dto.getRating());
        feedback.setComment(dto.getComment() == null ? "" : dto.getComment().trim());

        Feedback savedFeedback = feedbackRepository.save(feedback);

        // Update appointment status
        appointment.setIsReviewed(true);
        appointmentRepository.save(appointment);

        // Update doctor rating
        List<Feedback> doctorFeedbacks = feedbackRepository.findByDoctorIdOrderByIdDesc(doctor.getId());
        BigDecimal totalScore = doctorFeedbacks.stream()
                .map(Feedback::getRating)
                .map(BigDecimal::valueOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        doctor.setTotalReviews(doctorFeedbacks.size());
        doctor.setAverageRating(totalScore.divide(
                BigDecimal.valueOf(doctorFeedbacks.size()), 2, RoundingMode.HALF_UP));
        doctorRepository.save(doctor);

        return mapToDto(savedFeedback);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDto> getAllFeedbacks() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackDto> getFeedbacksByDoctor(Long doctorId) {
        return feedbackRepository.findByDoctorIdOrderByIdDesc(doctorId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackDto getFeedbackByAppointment(Long appointmentId) {
        Feedback feedback = feedbackRepository.findByAppointmentId(appointmentId).orElse(null);
        if (feedback == null) {
            return null;
        }
        ensureCanViewAppointment(feedback.getAppointment());
        return mapToDto(feedback);
    }

    private void ensureCurrentPatientOwns(Appointment appointment) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && hasRole(authentication, "PATIENT")
                && !appointment.getPatient().getUser().getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You can only review your own appointment.");
        }
    }

    private void ensureCanViewAppointment(Appointment appointment) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required.");
        }
        if (hasRole(authentication, "ADMIN") || hasRole(authentication, "RECEPTIONIST")) {
            return;
        }
        if (hasRole(authentication, "PATIENT")
                && appointment.getPatient().getUser().getEmail().equals(authentication.getName())) {
            return;
        }
        if (hasRole(authentication, "DOCTOR")
                && appointment.getDoctor().getUser().getEmail().equals(authentication.getName())) {
            return;
        }
        throw new AccessDeniedException("You do not have access to this feedback.");
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    private FeedbackDto mapToDto(Feedback feedback) {
        FeedbackDto dto = new FeedbackDto();
        dto.setId(feedback.getId());
        dto.setPatientId(feedback.getPatient().getUser().getId());
        dto.setPatientName(feedback.getPatient().getUser().getFullName());
        dto.setDoctorId(feedback.getDoctor().getId());
        dto.setDoctorName(feedback.getDoctor().getUser().getFullName());
        if (feedback.getAppointment() != null) {
            dto.setAppointmentId(feedback.getAppointment().getId());
        }
        dto.setRating(feedback.getRating());
        dto.setComment(feedback.getComment());
        dto.setCreatedAt(feedback.getCreatedAt());
        return dto;
    }
}
