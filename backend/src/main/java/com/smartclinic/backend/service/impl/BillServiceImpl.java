package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.BillDto;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.BillRepository;
import com.smartclinic.backend.repository.MedicalRecordRepository;
import com.smartclinic.backend.repository.PrescriptionRepository;
import com.smartclinic.backend.repository.PrescriptionDetailRepository;
import com.smartclinic.backend.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;

    @Override
    @Transactional
    public BillDto generateBill(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot generate bill for incomplete appointment.");
        }

        Optional<Bill> existingBill = billRepository.findByAppointmentId(appointmentId);
        if (existingBill.isPresent()) {
            return mapToDto(existingBill.get());
        }

        BigDecimal totalAmount = appointment.getDoctor().getConsultationFee() != null 
                ? appointment.getDoctor().getConsultationFee() 
                : BigDecimal.ZERO;

        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findByAppointmentId(appointmentId);
        if (recordOpt.isPresent()) {
            List<Prescription> prescriptions = prescriptionRepository.findByMedicalRecordId(recordOpt.get().getId());
            if (!prescriptions.isEmpty()) {
                Prescription p = prescriptions.get(0);
                List<PrescriptionDetail> details = prescriptionDetailRepository.findByPrescriptionId(p.getId());
                for (PrescriptionDetail d : details) {
                    BigDecimal medicinePrice = d.getMedicine().getPrice();
                    Integer quantity = d.getQuantity();
                    if (medicinePrice != null && quantity != null) {
                        totalAmount = totalAmount.add(medicinePrice.multiply(BigDecimal.valueOf(quantity)));
                    }
                }
            }
        }

        Bill bill = new Bill();
        bill.setAppointment(appointment);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(BillStatus.PENDING);
        
        Bill savedBill = billRepository.save(bill);
        return mapToDto(savedBill);
    }

    @Override
    @Transactional
    public BillDto payBill(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));

        if (bill.getStatus() == BillStatus.PAID) {
            throw new IllegalArgumentException("Bill is already paid.");
        }

        bill.setStatus(BillStatus.PAID);
        Bill savedBill = billRepository.save(bill);

        Appointment appointment = bill.getAppointment();
        appointment.setStatus(AppointmentStatus.PAID);
        appointmentRepository.save(appointment);

        return mapToDto(savedBill);
    }

    @Override
    public BillDto getBillByAppointmentId(Long appointmentId) {
        Bill bill = billRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "appointmentId", appointmentId));
        return mapToDto(bill);
    }

    private BillDto mapToDto(Bill bill) {
        return new BillDto(
                bill.getId(),
                bill.getAppointment().getId(),
                bill.getTotalAmount(),
                bill.getStatus(),
                bill.getCreatedAt()
        );
    }
}
