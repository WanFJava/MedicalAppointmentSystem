package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.ComplaintDto;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.ComplaintRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.ComplaintService;
import com.smartclinic.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public ComplaintDto createComplaint(Long patientUserId, ComplaintDto complaintDto) {
        Patient patient = patientRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", patientUserId));

        Appointment appointment = appointmentRepository.findById(complaintDto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", complaintDto.getAppointmentId()));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new IllegalArgumentException("Appointment does not belong to this patient");
        }

        if (complaintRepository.existsByAppointmentId(appointment.getId())) {
            throw new IllegalArgumentException("Bạn đã gửi khiếu nại cho lịch hẹn này rồi.");
        }

        Complaint complaint = new Complaint();
        complaint.setPatient(patient);
        complaint.setAppointment(appointment);
        complaint.setReason(complaintDto.getReason());
        
        Complaint saved = complaintRepository.save(complaint);
        
        // Notify receptionists
        userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
            notificationService.sendNotification(receptionist.getId(), 
                "Có khiếu nại mới từ bệnh nhân " + patient.getUser().getFullName() + " (Lịch hẹn ID: " + appointment.getId() + ")");
        });
        
        return mapToDto(saved);
    }

    @Override
    public List<ComplaintDto> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintDto> getPatientComplaints(Long patientUserId) {
        Patient patient = patientRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", patientUserId));
                
        return complaintRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintDto resolveComplaint(Long id, Long resolvedByUserId, String resolutionNote) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint", "id", id));
                
        User user = userRepository.findById(resolvedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", resolvedByUserId));

        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(LocalDateTime.now());
        complaint.setResolvedBy(user);
        complaint.setResolutionNote(resolutionNote);
        
        Complaint saved = complaintRepository.save(complaint);
        
        // Notify patient
        if (complaint.getPatient() != null && complaint.getPatient().getUser() != null) {
            notificationService.sendNotification(complaint.getPatient().getUser().getId(), 
                "Khiếu nại của bạn về lịch khám ID " + complaint.getAppointment().getId() + " đã được xử lý.");
        }
        
        return mapToDto(saved);
    }

    private ComplaintDto mapToDto(Complaint complaint) {
        Appointment apt = complaint.getAppointment();
        return ComplaintDto.builder()
                .id(complaint.getId())
                .patientId(complaint.getPatient().getId())
                .patientName(complaint.getPatient().getUser().getFullName())
                .appointmentId(apt.getId())
                .reason(complaint.getReason())
                .status(complaint.getStatus().name())
                .createdAt(complaint.getCreatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .resolvedBy(complaint.getResolvedBy() != null ? complaint.getResolvedBy().getFullName() : null)
                .resolutionNote(complaint.getResolutionNote())
                .doctorName(apt.getDoctor().getUser().getFullName())
                .scheduleDate(apt.getSchedule().getDate().toString())
                .timeSlot(apt.getSchedule().getStartTime().toString() + " - " + apt.getSchedule().getEndTime().toString())
                .build();
    }
}
