package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.AppointmentDto;
import com.smartclinic.backend.dto.BookingRequestDto;
import com.smartclinic.backend.entity.Appointment;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.ScheduleStatus;
import com.smartclinic.backend.entity.User;
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
import com.smartclinic.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

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

    @Override
    @Transactional
    public AppointmentDto bookAppointment(Long patientId, BookingRequestDto requestDto) {
        User user = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

        if (schedule.getStatus() != ScheduleStatus.AVAILABLE) {
            throw new IllegalArgumentException("Ca làm việc này không ở trạng thái AVAILABLE để đặt lịch.");
        }

        int current = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
        int max = schedule.getMaxPatient() == null ? 10 : schedule.getMaxPatient();
        schedule.setCurrentPatient(current + 1);
        if (schedule.getCurrentPatient() >= max) {
            schedule.setStatus(ScheduleStatus.FULL);
        }
        scheduleRepository.save(schedule);

        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSchedule(schedule);
        appointment.setSymptom(requestDto.getSymptom());
        appointment.setStatus(AppointmentStatus.PENDING); // Default status

        Appointment savedAppointment = appointmentRepository.save(appointment);

        return mapToDto(savedAppointment);
    }

    @Override
    public List<AppointmentDto> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatient_UserIdOrderByIdDesc(patientId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getDoctorAppointments(Long doctorId) {
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
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        
        AppointmentStatus oldStatus = appointment.getStatus();

        // Enforce patient rules
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT") || a.getAuthority().equals("PATIENT"))) {
            if (oldStatus != AppointmentStatus.PENDING && oldStatus != AppointmentStatus.CONFIRMED) {
                throw new IllegalArgumentException("Bệnh nhân chỉ có thể hủy lịch hẹn ở trạng thái Đang chờ (PENDING) hoặc Đã xác nhận (CONFIRMED).");
            }
            if (status != AppointmentStatus.CANCELLED_BY_PATIENT) {
                throw new IllegalArgumentException("Bệnh nhân chỉ có quyền hủy lịch hẹn.");
            }
        }

        // Enforce Doctor rules
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR") || a.getAuthority().equals("DOCTOR"))) {
            if (status == AppointmentStatus.CONFIRMED) {
                throw new IllegalArgumentException("Bác sĩ không có quyền xác nhận (CONFIRM) lịch hẹn. Việc này do Lễ tân thực hiện.");
            }
            if (status == AppointmentStatus.NO_SHOW && oldStatus != AppointmentStatus.CHECKED_IN) {
                throw new IllegalArgumentException("Chỉ có thể đánh dấu Vắng mặt (No Show) sau khi bệnh nhân đã Check-in.");
            }
        }

        appointment.setStatus(status);

        if (status == AppointmentStatus.CHECKED_IN && appointment.getQueueNumber() == null) {
            Integer maxQueue = appointmentRepository.findMaxQueueNumberForDoctorAndDate(
                    appointment.getDoctor().getId(),
                    appointment.getSchedule().getDate()
            );
            appointment.setQueueNumber(maxQueue == null ? 1 : maxQueue + 1);
        }

        // If cancelled, free up and reset the schedule spot to AVAILABLE.
        // NO_SHOW is treated like COMPLETED for schedule capacity, so it doesn't free the spot.
        boolean isCancellation = status == AppointmentStatus.CANCELLED_BY_PATIENT || 
                                 status == AppointmentStatus.CANCELLED_BY_DOCTOR;

        if (isCancellation) {
            Schedule schedule = appointment.getSchedule();
            if (schedule != null) {
                int currentPatientCount = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
                int newCurrent = Math.max(0, currentPatientCount - 1);
                schedule.setCurrentPatient(newCurrent);
                
                // Reset schedule status to AVAILABLE so doctor schedule remains active & available
                if (schedule.getStatus() != ScheduleStatus.CANCELLED) {
                    schedule.setStatus(ScheduleStatus.AVAILABLE);
                }
                scheduleRepository.save(schedule);
            }
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return mapToDto(updatedAppointment);
    }

    @Override
    @Transactional
    public void deleteAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // If the appointment was occupying a schedule spot, free it up before deleting
        if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CANCELLED_BY_PATIENT && appointment.getStatus() != AppointmentStatus.CANCELLED_BY_DOCTOR) {
            Schedule schedule = appointment.getSchedule();
            if (schedule != null) {
                schedule.setCurrentPatient(Math.max(0, (schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient()) - 1));
                schedule.setStatus(ScheduleStatus.AVAILABLE);
                scheduleRepository.save(schedule);
            }
        }
        
        // Cascading delete
        billRepository.findByAppointmentId(appointmentId).ifPresent(billRepository::delete);
        
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

    @Override
    @Transactional
    public void callNext(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
                
        if (appointment.getSchedule() != null && appointment.getSchedule().getStatus() != ScheduleStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bác sĩ chưa bắt đầu ca làm việc này. Lễ tân không thể gọi bệnh nhân.");
        }
        
        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        appointmentRepository.save(appointment);
    }

    @Override
    @Transactional
    public void swapQueue(Long id1, Long id2) {
        Appointment apt1 = appointmentRepository.findById(id1).orElseThrow();
        Appointment apt2 = appointmentRepository.findById(id2).orElseThrow();
        
        Integer temp = apt1.getQueueNumber();
        apt1.setQueueNumber(apt2.getQueueNumber());
        apt2.setQueueNumber(temp);
        
        appointmentRepository.save(apt1);
        appointmentRepository.save(apt2);
    }

    @Override
    @Transactional
    public void skipQueue(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        Integer maxQueue = appointmentRepository.findMaxQueueNumberForDoctorAndDate(
                appointment.getDoctor().getId(),
                appointment.getSchedule().getDate()
        );
        appointment.setQueueNumber(maxQueue == null ? 1 : maxQueue + 1);
        appointmentRepository.save(appointment);
    }

    private AppointmentDto mapToDto(Appointment appointment) {
        Long patientUserId = (appointment.getPatient() != null && appointment.getPatient().getUser() != null)
                ? appointment.getPatient().getUser().getId() : null;
        String patientName = (appointment.getPatient() != null && appointment.getPatient().getUser() != null)
                ? appointment.getPatient().getUser().getFullName() : "Bệnh nhân";

        Long doctorId = (appointment.getDoctor() != null) ? appointment.getDoctor().getId() : null;
        String doctorName = (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null)
                ? appointment.getDoctor().getUser().getFullName() : "Chưa phân công bác sĩ";

        Long scheduleId = (appointment.getSchedule() != null) ? appointment.getSchedule().getId() : null;
        java.time.LocalDate scheduleDate = (appointment.getSchedule() != null) ? appointment.getSchedule().getDate() : null;
        String timeSlot = (appointment.getSchedule() != null)
                ? appointment.getSchedule().getStartTime() + " - " + appointment.getSchedule().getEndTime() : "";

        String paymentStatus = "UNPAID";
        if (appointment.getId() != null) {
            java.util.Optional<com.smartclinic.backend.entity.Bill> billOpt = billRepository.findByAppointmentId(appointment.getId());
            if (billOpt.isPresent() && billOpt.get().getStatus() == com.smartclinic.backend.entity.BillStatus.PAID) {
                paymentStatus = "PAID";
            }
        }

        return new AppointmentDto(
                appointment.getId(),
                patientUserId,
                patientName,
                doctorId,
                doctorName,
                scheduleId,
                scheduleDate,
                timeSlot,
                appointment.getSymptom(),
                appointment.getStatus(),
                appointment.getQueueNumber(),
                appointment.getIsReviewed(),
                paymentStatus,
                appointment.getNote()
        );
    }
}
