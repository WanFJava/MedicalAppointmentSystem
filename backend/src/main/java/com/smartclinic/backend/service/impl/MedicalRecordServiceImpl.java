package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.DiagnosisRequestDto;
import com.smartclinic.backend.dto.MedicalRecordDto;
import com.smartclinic.backend.dto.PrescriptionDto;
import com.smartclinic.backend.dto.PrescriptionItemDto;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.MedicalRecordRepository;
import com.smartclinic.backend.repository.MedicineRepository;
import com.smartclinic.backend.repository.PrescriptionRepository;
import com.smartclinic.backend.repository.PrescriptionDetailRepository;
import com.smartclinic.backend.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public MedicalRecordDto diagnosePatient(Long appointmentId, Long doctorId, DiagnosisRequestDto requestDto) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (!appointment.getDoctor().getUser().getId().equals(doctorId) && !appointment.getDoctor().getId().equals(doctorId)) {
            throw new IllegalArgumentException("You can only diagnose your own patients.");
        }

        if (appointment.getStatus() != AppointmentStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Patient must be checked in before diagnosis.");
        }

        MedicalRecord record = new MedicalRecord();
        record.setAppointment(appointment);
        record.setDiagnosis(requestDto.getDiagnosis());
        record.setDoctorNote(requestDto.getAdvice());
        
        MedicalRecord savedRecord = medicalRecordRepository.save(record);

        if (requestDto.getPrescriptions() != null && !requestDto.getPrescriptions().isEmpty()) {
            Prescription prescription = new Prescription();
            prescription.setMedicalRecord(savedRecord);
            Prescription savedPrescription = prescriptionRepository.save(prescription);
            
            for (PrescriptionItemDto item : requestDto.getPrescriptions()) {
                Medicine medicine = medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", item.getMedicineId()));
                
                if (medicine.getQuantity() < item.getQuantity()) {
                    throw new IllegalArgumentException("Thuốc " + medicine.getName() + " không đủ số lượng trong kho. Còn lại: " + medicine.getQuantity());
                }
                
                // Deduct stock
                medicine.setQuantity(medicine.getQuantity() - item.getQuantity());
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

        return getMedicalRecordByAppointmentId(appointmentId);
    }

    @Override
    public MedicalRecordDto getMedicalRecordByAppointmentId(Long appointmentId) {
        MedicalRecord record = medicalRecordRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "appointmentId", appointmentId));

        List<Prescription> prescriptions = prescriptionRepository.findByMedicalRecordId(record.getId());
        
        List<PrescriptionDto> prescriptionDtos = java.util.Collections.emptyList();
        
        if (!prescriptions.isEmpty()) {
            // Take the first prescription linked to this record
            Prescription p = prescriptions.get(0);
            List<PrescriptionDetail> details = prescriptionDetailRepository.findByPrescriptionId(p.getId());
            
            prescriptionDtos = details.stream().map(d -> new PrescriptionDto(
                    d.getId(),
                    d.getMedicine().getId(),
                    d.getMedicine().getName(),
                    d.getDosage(),
                    d.getInstruction(),
                    d.getQuantity()
            )).collect(Collectors.toList());
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
}
