package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.BillDto;
import com.smartclinic.backend.entity.*;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.BillRepository;
import com.smartclinic.backend.repository.MedicalRecordRepository;
import com.smartclinic.backend.repository.PrescriptionRepository;
import com.smartclinic.backend.repository.PrescriptionDetailRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.BillService;
import com.smartclinic.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final NotificationService notificationService;
    private final UserRepository userRepository;

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

        BigDecimal travelFee = appointment.getTravelFee() != null ? appointment.getTravelFee() : BigDecimal.ZERO;
        BigDecimal totalAmount = consultationFee.add(medicineFee).add(travelFee);

        Bill bill = new Bill();
        bill.setAppointment(appointment);
        bill.setConsultationFee(consultationFee);
        bill.setMedicineFee(medicineFee);
        bill.setDiscount(BigDecimal.ZERO);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(BillStatus.UNPAID);
        bill.setCreatedAt(LocalDateTime.now());
        Bill savedBill = billRepository.save(bill);

        // Notify patient
        if (appointment.getPatient() != null) {
            String message = appointment.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT ?
                "Hóa đơn thanh toán cho lịch khám ngày " + appointment.getSchedule().getDate() + " đã được tạo. Vui lòng thanh toán trực tuyến." :
                "Hóa đơn thanh toán cho lịch khám ngày " + appointment.getSchedule().getDate() + " đã được tạo. Vui lòng thanh toán tại quầy lễ tân.";
            notificationService.sendNotification(appointment.getPatient().getUser().getId(), message);
        }

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

        // Notify patient
        if (bill.getAppointment().getPatient() != null) {
            notificationService.sendNotification(bill.getAppointment().getPatient().getUser().getId(),
                "Hóa đơn thanh toán cho lịch khám ngày " + bill.getAppointment().getSchedule().getDate() + " đã được thanh toán thành công.");
        }
        // Notify receptionists
        String patientName = bill.getAppointment().getPatient() != null && bill.getAppointment().getPatient().getUser() != null 
            ? bill.getAppointment().getPatient().getUser().getFullName() 
            : "một bệnh nhân";
            
        userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
            notificationService.sendNotification(receptionist.getId(), 
                "Bệnh nhân " + patientName + " đã thanh toán thành công hóa đơn " + billId);
        });

        return mapToDto(savedBill);
    }

    @Override
    public BillDto getBillByAppointmentId(Long appointmentId) {
        java.util.Optional<Bill> billOpt = billRepository.findByAppointmentId(appointmentId);
        if (billOpt.isEmpty()) {
            Appointment appointment = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));
            if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
                // Auto generate bill if it doesn't exist and appointment is completed
                return generateBill(appointmentId);
            } else {
                throw new ResourceNotFoundException("Bill", "appointmentId", appointmentId);
            }
        }
        Bill bill = billOpt.get();
        ensureCanView(bill.getAppointment());
        return mapToDto(bill);
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
        boolean patientOwnsAppointment = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_PATIENT"))
                && appointment.getPatient().getUser().getEmail().equals(authentication.getName());
        if (!patientOwnsAppointment) {
            throw new AccessDeniedException("You do not have access to this invoice.");
        }
    }

    private BillDto mapToDto(Bill bill) {
        return new BillDto(
                bill.getId(),
                bill.getAppointment().getId(),
                bill.getConsultationFee(),
                bill.getMedicineFee(),
                bill.getAppointment().getTravelFee() != null ? bill.getAppointment().getTravelFee() : BigDecimal.ZERO,
                bill.getDiscount(),
                bill.getTotalAmount(),
                bill.getStatus(),
                bill.getCreatedAt()
        );
    }
}
