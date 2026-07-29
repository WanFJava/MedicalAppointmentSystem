package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.BillDto;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.BillRepository;
import com.smartclinic.backend.repository.MedicalRecordRepository;
import com.smartclinic.backend.repository.PrescriptionRepository;
import com.smartclinic.backend.repository.PrescriptionDetailRepository;
import com.smartclinic.backend.repository.MedicineRepository;
import com.smartclinic.backend.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionDetailRepository prescriptionDetailRepository;
    private final MedicineRepository medicineRepository;

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

        BigDecimal consultationFee = appointment.getDoctor().getConsultationFee() != null 
                ? appointment.getDoctor().getConsultationFee() 
                : BigDecimal.ZERO;
        
        BigDecimal medicineFee = BigDecimal.ZERO;

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
                        medicineFee = medicineFee.add(medicinePrice.multiply(BigDecimal.valueOf(quantity)));
                    }
                }
            }
        }

        BigDecimal totalAmount = consultationFee.add(medicineFee);

        Bill bill = new Bill();
        bill.setAppointment(appointment);
        bill.setConsultationFee(consultationFee);
        bill.setMedicineFee(medicineFee);
        bill.setDiscount(BigDecimal.ZERO);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(BillStatus.UNPAID);
        bill.setCreatedAt(LocalDateTime.now());
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
        bill.setPaidAt(java.time.LocalDateTime.now());
        bill.setPaymentMethod("CASH"); // Or whatever default
        Bill savedBill = billRepository.save(bill);

        // Deduct medicine quantity
        Optional<MedicalRecord> recordOpt = medicalRecordRepository.findByAppointmentId(bill.getAppointment().getId());
        if (recordOpt.isPresent()) {
            List<Prescription> prescriptions = prescriptionRepository.findByMedicalRecordId(recordOpt.get().getId());
            if (!prescriptions.isEmpty()) {
                Prescription p = prescriptions.get(0);
                List<PrescriptionDetail> details = prescriptionDetailRepository.findByPrescriptionId(p.getId());
                for (PrescriptionDetail d : details) {
                    Medicine m = d.getMedicine();
                    int deductAmount = d.getQuantity() != null ? d.getQuantity() : 0;
                    if (m != null && m.getQuantity() != null && deductAmount > 0) {
                        int newQuantity = m.getQuantity() - deductAmount;
                        m.setQuantity(Math.max(0, newQuantity));
                        medicineRepository.save(m);
                    }
                }
            }
        }

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
                bill.getConsultationFee(),
                bill.getMedicineFee(),
                bill.getDiscount(),
                bill.getTotalAmount(),
                bill.getStatus(),
                bill.getCreatedAt()
        );
    }
}
