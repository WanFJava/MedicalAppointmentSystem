package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.DiagnosisRequestDto;
import com.smartclinic.backend.dto.MedicalRecordDto;
import com.smartclinic.backend.dto.PrescriptionDto;
import com.smartclinic.backend.dto.PrescriptionItemDto;
import com.smartclinic.backend.entity.Appointment;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.MedicalRecord;
import com.smartclinic.backend.entity.Medicine;
import com.smartclinic.backend.entity.Prescription;
import com.smartclinic.backend.entity.PrescriptionDetail;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.MedicalRecordRepository;
import com.smartclinic.backend.repository.MedicineRepository;
import com.smartclinic.backend.repository.PrescriptionDetailRepository;
import com.smartclinic.backend.repository.PrescriptionRepository;
import com.smartclinic.backend.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicineRepository medicineRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;

    @Override
    @Transactional
    public MedicalRecordDto diagnosePatient(
            Long appointmentId, Long doctorId, DiagnosisRequestDto requestDto) {
        if (requestDto == null || requestDto.getDiagnosis() == null
                || requestDto.getDiagnosis().trim().isEmpty()) {
            throw new IllegalArgumentException("Diagnosis is required.");
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        boolean doctorMatches = appointment.getDoctor().getId().equals(doctorId)
                || appointment.getDoctor().getUser().getId().equals(doctorId);
        if (!doctorMatches) {
            throw new IllegalArgumentException("You can only diagnose your own patients.");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !appointment.getDoctor().getUser().getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You can only diagnose your own patients.");
        }
        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Patient must be checked in before diagnosis.");
        }
        if (medicalRecordRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new IllegalArgumentException("This appointment already has a medical record.");
        }

        MedicalRecord record = new MedicalRecord();
        record.setAppointment(appointment);
        record.setDiagnosis(requestDto.getDiagnosis().trim());
        record.setDoctorNote(requestDto.getAdvice() == null ? "" : requestDto.getAdvice().trim());
        MedicalRecord savedRecord = medicalRecordRepository.save(record);

        if (requestDto.getPrescriptions() != null && !requestDto.getPrescriptions().isEmpty()) {
            Prescription prescription = new Prescription();
            prescription.setMedicalRecord(savedRecord);
            Prescription savedPrescription = prescriptionRepository.save(prescription);

            for (PrescriptionItemDto item : requestDto.getPrescriptions()) {
                validatePrescriptionItem(item);
                Medicine medicine = medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Medicine", "id", item.getMedicineId()));

                int availableQuantity = medicine.getQuantity() == null ? 0 : medicine.getQuantity();
                if (availableQuantity < item.getQuantity()) {
                    throw new IllegalArgumentException(
                            "Medicine " + medicine.getName()
                                    + " does not have enough stock. Remaining: " + availableQuantity);
                }

                medicine.setQuantity(availableQuantity - item.getQuantity());
                medicineRepository.save(medicine);

                PrescriptionDetail detail = new PrescriptionDetail();
                detail.setPrescription(savedPrescription);
                detail.setMedicine(medicine);
                detail.setDosage(item.getDosage());
                detail.setInstruction(item.getInstruction());
                detail.setQuantity(item.getQuantity());
                prescriptionDetailRepository.save(detail);
            }
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        return mapToDto(savedRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordDto getMedicalRecordByAppointmentId(Long appointmentId) {
        MedicalRecord record = medicalRecordRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "MedicalRecord", "appointmentId", appointmentId));
        ensureCanView(record.getAppointment());
        return mapToDto(record);
    }

    private MedicalRecordDto mapToDto(MedicalRecord record) {
        List<Prescription> prescriptions =
                prescriptionRepository.findByMedicalRecordId(record.getId());
        List<PrescriptionDto> prescriptionDtos = Collections.emptyList();

        if (!prescriptions.isEmpty()) {
            List<PrescriptionDetail> details =
                    prescriptionDetailRepository.findByPrescriptionId(prescriptions.get(0).getId());
            prescriptionDtos = details.stream().map(detail -> {
                BigDecimal unitPrice = detail.getMedicine().getPrice();
                BigDecimal totalPrice = unitPrice.multiply(
                        BigDecimal.valueOf(detail.getQuantity()));
                return new PrescriptionDto(
                        detail.getId(),
                        detail.getMedicine().getId(),
                        detail.getMedicine().getName(),
                        detail.getDosage(),
                        detail.getInstruction(),
                        detail.getQuantity(),
                        unitPrice,
                        totalPrice
                );
            }).collect(Collectors.toList());
        }

        return new MedicalRecordDto(
                record.getId(),
                record.getAppointment().getId(),
                record.getAppointment().getDoctor().getId(),
                record.getAppointment().getDoctor().getUser().getFullName(),
                record.getDiagnosis(),
                record.getDoctorNote(),
                record.getCreatedAt(),
                prescriptionDtos
        );
    }

    private void validatePrescriptionItem(PrescriptionItemDto item) {
        if (item == null || item.getMedicineId() == null
                || item.getQuantity() == null || item.getQuantity() <= 0) {
            throw new IllegalArgumentException(
                    "Prescription medicine and a quantity greater than zero are required.");
        }
    }

    private void ensureCanView(Appointment appointment) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required.");
        }
        boolean staff = authentication.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_RECEPTIONIST"));
        if (staff) {
            return;
        }
        boolean patientOwns = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_PATIENT"))
                && appointment.getPatient().getUser().getEmail().equals(authentication.getName());
        boolean doctorOwns = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_DOCTOR"))
                && appointment.getDoctor().getUser().getEmail().equals(authentication.getName());
        if (!patientOwns && !doctorOwns) {
            throw new AccessDeniedException("You do not have access to this medical record.");
        }
    }
}
