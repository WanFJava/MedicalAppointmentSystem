package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.AppointmentDto;
import com.smartclinic.backend.dto.BookingRequestDto;
import com.smartclinic.backend.entity.Appointment;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Feedback;
import com.smartclinic.backend.entity.Prescription;
import com.smartclinic.backend.entity.PrescriptionDetail;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.BillRepository;
import com.smartclinic.backend.repository.MedicalRecordRepository;
import com.smartclinic.backend.repository.PrescriptionRepository;
import com.smartclinic.backend.repository.PrescriptionDetailRepository;
import com.smartclinic.backend.repository.FeedbackRepository;
import com.smartclinic.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final ScheduleRepository scheduleRepository;
    private final PatientRepository patientRepository;
    private final BillRepository billRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;
    private final FeedbackRepository feedbackRepository;

    @Override
    @Transactional
    public AppointmentDto bookAppointment(Long patientId, BookingRequestDto requestDto) {
        if (requestDto == null || requestDto.getDoctorId() == null || requestDto.getScheduleId() == null) {
            throw new IllegalArgumentException("Doctor and schedule are required.");
        }
        if (requestDto.getSymptom() == null || requestDto.getSymptom().trim().isEmpty()) {
            throw new IllegalArgumentException("Symptoms are required.");
        }

        User user = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.PATIENT) {
            throw new IllegalArgumentException("Appointments can only be booked for patient accounts.");
        }
        ensurePatientIsSelf(user);

        Patient patient = patientRepository.findByUserId(patientId)
                .orElseGet(() -> {
                    Patient newPatient = new Patient();
                    newPatient.setUser(user);
                    return patientRepository.save(newPatient);
                });

        Doctor doctor = doctorRepository.findById(requestDto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Schedule schedule = scheduleRepository.findById(requestDto.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (!schedule.getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("The selected schedule does not belong to this doctor.");
        }
        if (schedule.getDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book an appointment in the past.");
        }
        if (!"AVAILABLE".equals(schedule.getStatus())) {
            throw new RuntimeException("Schedule is no longer available");
        }
        int currentPatient = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
        int maxPatient = schedule.getMaxPatient() == null ? 0 : schedule.getMaxPatient();
        if (maxPatient <= 0 || currentPatient >= maxPatient) {
            throw new RuntimeException("Schedule is full.");
        }
        if (appointmentRepository.existsByPatientIdAndScheduleIdAndStatusNot(
                patient.getId(), schedule.getId(), AppointmentStatus.CANCELLED)) {
            throw new IllegalArgumentException("You already have an appointment in this schedule.");
        }

        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSchedule(schedule);
        appointment.setSymptom(requestDto.getSymptom().trim());
        appointment.setStatus(AppointmentStatus.PENDING); // Default status
        appointment.setIsReviewed(false);

        Appointment savedAppointment = appointmentRepository.save(appointment);

        return mapToDto(savedAppointment);
    }

    @Override
    public List<AppointmentDto> getPatientAppointments(Long patientId) {
        User patientUser = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensurePatientIsSelf(patientUser);
        return appointmentRepository.findByPatient_UserIdOrderByIdDesc(patientId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getDoctorAppointments(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        ensureDoctorIsSelf(doctor);
        return appointmentRepository.findByDoctorIdOrderByIdDesc(doctorId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getAllAppointments() {
        return appointmentRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentDto updateAppointmentStatus(Long appointmentId, AppointmentStatus status) {
        if (status == null) {
            throw new IllegalArgumentException("Status is required.");
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        AppointmentStatus oldStatus = appointment.getStatus();

        // Enforce patient rules
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            if (!appointment.getPatient().getUser().getEmail().equals(auth.getName())) {
                throw new AccessDeniedException("You can only cancel your own appointment.");
            }
            if (oldStatus != AppointmentStatus.PENDING) {
                throw new RuntimeException("Patients can only cancel appointments that are in PENDING status.");
            }
            if (status != AppointmentStatus.CANCELLED) {
                throw new RuntimeException("Patients can only cancel appointments, not change to other statuses.");
            }
        }

        if (oldStatus == status) {
            return mapToDto(appointment);
        }

        validateStatusTransition(oldStatus, status);

        // If confirmed from pending, occupy the schedule
        if (status == AppointmentStatus.CONFIRMED && oldStatus == AppointmentStatus.PENDING) {
            Schedule schedule = scheduleRepository.findByIdForUpdate(appointment.getSchedule().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Schedule not found."));
            int current = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
            int max = schedule.getMaxPatient() == null ? 0 : schedule.getMaxPatient();
            if (!"AVAILABLE".equals(schedule.getStatus()) || max <= 0 || current >= max) {
                throw new IllegalArgumentException("Cannot confirm appointment because the schedule is full or unavailable.");
            }
            schedule.setCurrentPatient(current + 1);
            if (schedule.getCurrentPatient() >= max) {
                schedule.setStatus("FULL");
            }
            scheduleRepository.save(schedule);
        }

        // If cancelled from a non-pending state (like confirmed), free up the schedule
        if (status == AppointmentStatus.CANCELLED && oldStatus != AppointmentStatus.PENDING) {
            Schedule schedule = scheduleRepository.findByIdForUpdate(appointment.getSchedule().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Schedule not found."));
            int current = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
            schedule.setCurrentPatient(Math.max(0, current - 1));
            schedule.setStatus("AVAILABLE");
            scheduleRepository.save(schedule);
        }

        appointment.setStatus(status);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return mapToDto(updatedAppointment);
    }

    @Override
    @Transactional
    public void deleteAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // If the appointment was occupying a schedule spot, free it up before deleting
        if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CANCELLED) {
            Schedule schedule = appointment.getSchedule();
            int current = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
            schedule.setCurrentPatient(Math.max(0, current - 1));
            schedule.setStatus("AVAILABLE");
            scheduleRepository.save(schedule);
        }
        
        // Cascading delete
        billRepository.findByAppointmentId(appointmentId).ifPresent(billRepository::delete);
        feedbackRepository.findByAppointmentId(appointmentId).ifPresent(feedback -> {
            Doctor reviewedDoctor = feedback.getDoctor();
            feedbackRepository.delete(feedback);
            feedbackRepository.flush();
            recalculateDoctorRating(reviewedDoctor);
        });
        
        medicalRecordRepository.findByAppointmentId(appointmentId).ifPresent(record -> {
            prescriptionRepository.findByMedicalRecordId(record.getId()).forEach(prescription -> {
                List<PrescriptionDetail> details = prescriptionDetailRepository.findByPrescriptionId(prescription.getId());
                prescriptionDetailRepository.deleteAll(details);
                prescriptionRepository.delete(prescription);
            });
            medicalRecordRepository.delete(record);
        });
        
        appointmentRepository.delete(appointment);
    }

    private void validateStatusTransition(AppointmentStatus oldStatus, AppointmentStatus newStatus) {
        boolean valid = switch (oldStatus) {
            case PENDING -> newStatus == AppointmentStatus.CONFIRMED
                    || newStatus == AppointmentStatus.CANCELLED;
            case CONFIRMED -> newStatus == AppointmentStatus.CHECKED_IN
                    || newStatus == AppointmentStatus.CANCELLED;
            case CHECKED_IN, COMPLETED, CANCELLED -> false;
        };
        if (!valid) {
            throw new IllegalArgumentException(
                    "Invalid appointment status transition: " + oldStatus + " -> " + newStatus);
        }
    }

    private void ensurePatientIsSelf(User patientUser) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && hasRole(authentication, "PATIENT")
                && !patientUser.getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You do not have access to this patient's appointments.");
        }
    }

    private void ensureDoctorIsSelf(Doctor doctor) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && hasRole(authentication, "DOCTOR")
                && !doctor.getUser().getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You do not have access to this doctor's appointments.");
        }
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    private void recalculateDoctorRating(Doctor doctor) {
        List<Feedback> feedbacks = feedbackRepository.findByDoctorIdOrderByIdDesc(doctor.getId());
        if (feedbacks.isEmpty()) {
            doctor.setAverageRating(BigDecimal.ZERO);
            doctor.setTotalReviews(0);
        } else {
            BigDecimal total = feedbacks.stream()
                    .map(Feedback::getRating)
                    .map(BigDecimal::valueOf)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            doctor.setAverageRating(total.divide(
                    BigDecimal.valueOf(feedbacks.size()), 2, RoundingMode.HALF_UP));
            doctor.setTotalReviews(feedbacks.size());
        }
        doctorRepository.save(doctor);
    }

    private AppointmentDto mapToDto(Appointment appointment) {
        return new AppointmentDto(
                appointment.getId(),
                appointment.getPatient().getUser().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getSchedule().getId(),
                appointment.getSchedule().getDate(),
                appointment.getSchedule().getStartTime() + " - " + appointment.getSchedule().getEndTime(),
                appointment.getSymptom(),
                appointment.getStatus(),
                appointment.getIsReviewed()
        );
    }
}
