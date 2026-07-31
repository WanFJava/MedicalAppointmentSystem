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
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
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
    private final PatientRepository patientRepository;

    @Override
    @Transactional
    public FeedbackDto createFeedback(FeedbackDto dto) {
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Can only review completed appointments");
        }
        if (Boolean.TRUE.equals(appointment.getIsReviewed())) {
            throw new RuntimeException("This appointment is already reviewed");
        }

        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();

        Feedback feedback = new Feedback();
        feedback.setPatient(patient);
        feedback.setDoctor(doctor);
        feedback.setAppointment(appointment);
        feedback.setRating(dto.getRating());
        feedback.setComment(dto.getComment());

        Feedback savedFeedback = feedbackRepository.save(feedback);

        // Update appointment status
        appointment.setIsReviewed(true);
        appointmentRepository.save(appointment);

        // Update doctor rating by recalculating from all feedbacks to ensure correctness
        List<Feedback> allFeedbacks = feedbackRepository.findByDoctorIdOrderByIdDesc(doctor.getId());
        int newTotalReviews = allFeedbacks.size();
        
        BigDecimal newAverage = BigDecimal.ZERO;
        if (newTotalReviews > 0) {
            double sum = allFeedbacks.stream().mapToInt(Feedback::getRating).sum();
            newAverage = new BigDecimal(sum / newTotalReviews).setScale(2, RoundingMode.HALF_UP);
        }

        doctor.setTotalReviews(newTotalReviews);
        doctor.setAverageRating(newAverage);
        doctorRepository.save(doctor);

        return mapToDto(savedFeedback);
    }

    @Override
    public List<FeedbackDto> getFeedbacksByDoctor(Long doctorId) {
        return feedbackRepository.findByDoctorIdOrderByIdDesc(doctorId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public FeedbackDto getFeedbackByAppointment(Long appointmentId) {
        return feedbackRepository.findByAppointmentId(appointmentId)
                .map(this::mapToDto)
                .orElse(null);
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
