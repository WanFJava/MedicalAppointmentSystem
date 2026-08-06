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
import com.smartclinic.backend.entity.Role;
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
import com.smartclinic.backend.repository.ComplaintRepository;
import com.smartclinic.backend.service.AppointmentService;
import com.smartclinic.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import java.time.LocalDate;

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
    private final ComplaintRepository complaintRepository;
    private final NotificationService notificationService;

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

        if (user.getStatus() != com.smartclinic.backend.entity.Status.ACTIVE) {
            throw new IllegalArgumentException("Tài khoản của bạn đang bị khóa hoặc ngừng hoạt động. Không thể đặt lịch khám.");
        }

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

        if (schedule.getDoctor() == null || !schedule.getDoctor().getId().equals(doctor.getId())) {
            throw new IllegalArgumentException("The selected schedule does not belong to this doctor.");
        }
        if (schedule.getDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot book an appointment in the past.");
        }
        if (appointmentRepository.existsByPatientIdAndScheduleIdAndStatusNotIn(
                patient.getId(),
                schedule.getId(),
                List.of(AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_DOCTOR, AppointmentStatus.NO_SHOW_BY_DOCTOR, AppointmentStatus.NO_SHOW, AppointmentStatus.DECLINED))) {
            throw new IllegalArgumentException("You already have an appointment in this schedule.");
        }
        
        // Check for overlapping time slots on the same day
        List<Appointment> patientApts = appointmentRepository.findByPatient_UserIdOrderByIdDesc(user.getId());
        for (Appointment apt : patientApts) {
            if (apt.getSchedule() != null && apt.getSchedule().getDate().equals(schedule.getDate())) {
                boolean isCancelled = apt.getStatus() == AppointmentStatus.CANCELLED_BY_PATIENT ||
                                      apt.getStatus() == AppointmentStatus.CANCELLED_BY_DOCTOR ||
                                      apt.getStatus() == AppointmentStatus.NO_SHOW_BY_DOCTOR ||
                                      apt.getStatus() == AppointmentStatus.NO_SHOW ||
                                      apt.getStatus() == AppointmentStatus.DECLINED;
                if (!isCancelled) {
                    java.time.LocalTime existingStart = apt.getSchedule().getStartTime();
                    java.time.LocalTime existingEnd = apt.getSchedule().getEndTime();
                    java.time.LocalTime newStart = schedule.getStartTime();
                    java.time.LocalTime newEnd = schedule.getEndTime();
                    
                    if (existingStart != null && existingEnd != null && newStart != null && newEnd != null) {
                        // Overlap condition: (StartA < EndB) && (EndA > StartB)
                        if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
                            throw new IllegalArgumentException("Bạn đã có một lịch khám khác (" + existingStart + " - " + existingEnd + ") trùng với khung giờ này.");
                        }
                    }
                }
            }
        }

        if (schedule.getStatus() != ScheduleStatus.AVAILABLE) {
            throw new IllegalArgumentException("Ca làm việc này không ở trạng thái AVAILABLE để đặt lịch.");
        }

        // Clinic 1 slot = 1 patient rule
        if (schedule.getScheduleType() == com.smartclinic.backend.entity.ScheduleType.CLINIC) {
            if (requestDto.getExpectedTime() == null || requestDto.getExpectedTime().trim().isEmpty()) {
                throw new IllegalArgumentException("Khung giờ (slot) là bắt buộc cho khám tại phòng khám.");
            }
            boolean slotTaken = appointmentRepository.existsByScheduleIdAndExpectedTimeAndStatusNotIn(
                schedule.getId(),
                requestDto.getExpectedTime(),
                List.of(AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_DOCTOR, AppointmentStatus.NO_SHOW_BY_DOCTOR, AppointmentStatus.NO_SHOW, AppointmentStatus.DECLINED)
            );
            if (slotTaken) {
                throw new IllegalArgumentException("Khung giờ 30 phút này đã có bệnh nhân đặt. Vui lòng chọn khung giờ khác.");
            }
        }

        int current = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
        int max = schedule.getMaxPatient() == null ? 0 : schedule.getMaxPatient();
        if (max <= 0 || current >= max) {
            throw new IllegalArgumentException("Schedule is full.");
        }
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
        appointment.setSymptom(requestDto.getSymptom().trim());
        appointment.setExpectedTime(requestDto.getExpectedTime()); // Save the 30-min slot
        appointment.setStatus(AppointmentStatus.PENDING); // Default status
        appointment.setIsReviewed(false);

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Notify receptionists
        userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
            notificationService.sendNotification(receptionist.getId(), 
                "Bệnh nhân " + user.getFullName() + " vừa đặt lịch khám mới.");
        });
        
        // Notify doctor
        if (doctor.getUser() != null) {
            notificationService.sendNotification(doctor.getUser().getId(), "Có lịch khám mới từ bệnh nhân " + user.getFullName() + " vào ngày " + schedule.getDate());
        }
        
        // Notify patient
        notificationService.sendNotification(user.getId(), "Đặt lịch thành công ngày " + schedule.getDate() + " với bác sĩ " + doctor.getUser().getFullName());

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
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

        AppointmentStatus oldStatus = appointment.getStatus();

        // Enforce patient rules
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT") || a.getAuthority().equals("PATIENT"))) {
            if (!appointment.getPatient().getUser().getEmail().equals(auth.getName())) {
                throw new AccessDeniedException("You can only cancel your own appointment.");
            }
            if (oldStatus != AppointmentStatus.PENDING && oldStatus != AppointmentStatus.CONFIRMED && oldStatus != AppointmentStatus.PENDING_CONFIRMATION) {
                throw new IllegalArgumentException("Bệnh nhân chỉ có thể hủy lịch hẹn ở trạng thái Đang chờ (PENDING, PENDING_CONFIRMATION) hoặc Đã xác nhận (CONFIRMED).");
            }
            if (status != AppointmentStatus.CANCELLED_BY_PATIENT) {
                throw new IllegalArgumentException("Bệnh nhân chỉ có quyền hủy lịch hẹn.");
            }
        }

        // Enforce Doctor rules
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR") || a.getAuthority().equals("DOCTOR"))) {
            ensureDoctorIsSelf(appointment.getDoctor());
            if (status == AppointmentStatus.CONFIRMED && oldStatus != AppointmentStatus.PENDING_CONFIRMATION) {
                throw new IllegalArgumentException("Bác sĩ chỉ có quyền xác nhận lịch hẹn (CONFIRM) khi đang ở trạng thái chờ bác sĩ xác nhận (PENDING_CONFIRMATION).");
            }
            if ((status == AppointmentStatus.NO_SHOW || status == AppointmentStatus.NO_SHOW_BY_DOCTOR) && 
                (oldStatus == AppointmentStatus.COMPLETED || oldStatus == AppointmentStatus.CANCELLED_BY_PATIENT || oldStatus == AppointmentStatus.CANCELLED_BY_DOCTOR)) {
                throw new IllegalArgumentException("Không thể đánh dấu Vắng mặt (No Show) cho lịch hẹn đã kết thúc hoặc đã hủy.");
            }
        }

        appointment.setStatus(status);

        // Notify receptionist when doctor confirms a home visit
        if (status == AppointmentStatus.CONFIRMED && oldStatus == AppointmentStatus.PENDING_CONFIRMATION && appointment.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT) {
            userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
                notificationService.sendNotification(receptionist.getId(), 
                    "Bác sĩ " + appointment.getDoctor().getUser().getFullName() + " đã xác nhận lịch khám tại nhà cho bệnh nhân " + appointment.getPatient().getUser().getFullName());
            });
        }

        if (status == AppointmentStatus.IN_PROGRESS) {
            appointment.setActualStartTime(java.time.LocalTime.now());
        } else if (status == AppointmentStatus.COMPLETED) {
            appointment.setActualEndTime(java.time.LocalTime.now());
        }

        if (status == AppointmentStatus.CHECKED_IN && appointment.getQueueNumber() == null) {
            Integer maxQueue = appointmentRepository.findMaxQueueNumberForDoctorAndDate(
                    appointment.getDoctor().getId(),
                    appointment.getSchedule().getDate()
            );
            appointment.setQueueNumber(maxQueue == null ? 1 : maxQueue + 1);
        }

        // If cancelled, free up and reset the schedule spot to AVAILABLE.
        // NO_SHOW is treated like COMPLETED for schedule capacity, so it doesn't free the spot.
        // For HOME_VISIT, if cancelled by doctor (e.g. marked absent by receptionist), we also DO NOT free the spot (treat like NO_SHOW).
        boolean isCancellation = status == AppointmentStatus.CANCELLED_BY_PATIENT ||
                                 status == AppointmentStatus.DECLINED ||
                                 (status == AppointmentStatus.CANCELLED_BY_DOCTOR && appointment.getVisitType() != com.smartclinic.backend.entity.VisitType.HOME_VISIT);

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
        
        // Automated Expected Arrival Time recalculation for HOME_VISIT
        if (updatedAppointment.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT && status == AppointmentStatus.COMPLETED) {
            if (updatedAppointment.getActualEndTime() != null) {
                // Find next patient
                Appointment nextPatient = appointmentRepository.findFirstByDoctorIdAndScheduleDateAndStatusAndExpectedTimeGreaterThanOrderByExpectedTimeAsc(
                        updatedAppointment.getDoctor().getId(),
                        updatedAppointment.getSchedule().getDate(),
                        AppointmentStatus.CONFIRMED,
                        updatedAppointment.getExpectedTime() != null ? updatedAppointment.getExpectedTime() : ""
                );
                
                if (nextPatient != null && nextPatient.getExpectedTime() != null) {
                    try {
                        java.time.LocalTime originalExpected = java.time.LocalTime.parse(nextPatient.getExpectedTime());
                        java.time.LocalTime newExpected = updatedAppointment.getActualEndTime().plusMinutes(30); // Travel Gap
                        
                        // If new time is LATER than original by 15 mins or more
                        if (newExpected.isAfter(originalExpected.plusMinutes(14))) {
                            String formattedNewTime = String.format("%02d:%02d", newExpected.getHour(), newExpected.getMinute());
                            nextPatient.setExpectedTime(formattedNewTime);
                            appointmentRepository.save(nextPatient);
                            
                            // Send notification
                            if (nextPatient.getPatient() != null) {
                                String msg = "Lịch khám tại nhà của bạn đã được cập nhật. Do lịch khám trước kéo dài hơn dự kiến, bác sĩ sẽ đến khoảng " + formattedNewTime + ". Mong quý khách thông cảm vì sự bất tiện này.";
                                notificationService.sendNotification(nextPatient.getPatient().getUser().getId(), msg);
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Error recalculating expected time: " + e.getMessage());
                    }
                }
            }
        }

        // Sync Schedule status for Home Visits
        if (updatedAppointment.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT && updatedAppointment.getSchedule() != null) {
            Schedule schedule = updatedAppointment.getSchedule();
            if (status == AppointmentStatus.ON_THE_WAY || status == AppointmentStatus.ARRIVED || status == AppointmentStatus.IN_PROGRESS) {
                schedule.setStatus(ScheduleStatus.IN_PROGRESS);
                scheduleRepository.save(schedule);
            } else if (status == AppointmentStatus.COMPLETED) {
                schedule.setStatus(ScheduleStatus.COMPLETED);
                scheduleRepository.save(schedule);
            }
        }
        
        // Notify patient if status changed to CONFIRMED
        if (status == AppointmentStatus.CONFIRMED) {
            if (updatedAppointment.getPatient() != null) {
                notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                    "Lịch khám của bạn vào ngày " + updatedAppointment.getSchedule().getDate() + " đã được xác nhận.");
            }
            if (updatedAppointment.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT) {
                userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
                    notificationService.sendNotification(receptionist.getId(), 
                        "Bác sĩ " + updatedAppointment.getDoctor().getUser().getFullName() + " đã xác nhận ca khám tại nhà cho bệnh nhân " + updatedAppointment.getPatient().getUser().getFullName());
                });
            }
        }
        
        if (status == AppointmentStatus.ON_THE_WAY && updatedAppointment.getPatient() != null) {
            notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                "Bác sĩ " + updatedAppointment.getDoctor().getUser().getFullName() + " đang di chuyển đến nhà bạn. Vui lòng giữ liên lạc.");
        }
        
        if (status == AppointmentStatus.ARRIVED && updatedAppointment.getPatient() != null) {
            notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                "Bác sĩ " + updatedAppointment.getDoctor().getUser().getFullName() + " đã đến nơi. Vui lòng mở cửa.");
        }
        
        if (status == AppointmentStatus.NO_SHOW && updatedAppointment.getPatient() != null) {
            notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                "Lịch khám của bạn đã bị hủy do bác sĩ đánh dấu là vắng mặt (No Show).");
        }

        if (status == AppointmentStatus.NO_SHOW_BY_DOCTOR) {
            if (updatedAppointment.getPatient() != null) {
                notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                    "Lịch khám của bạn đã bị hủy do bác sĩ không đến (No Show by Doctor).");
            }
            userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
                notificationService.sendNotification(receptionist.getId(), 
                    "Bác sĩ " + updatedAppointment.getDoctor().getUser().getFullName() + " đã không đến ca khám của bệnh nhân " + updatedAppointment.getPatient().getUser().getFullName() + " (No Show by Doctor)");
            });
        }
        
        // Notify patient and receptionist if cancelled by doctor
        if (status == AppointmentStatus.CANCELLED_BY_DOCTOR) {
            if (updatedAppointment.getPatient() != null) {
                notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                    "Lịch khám của bạn vào ngày " + updatedAppointment.getSchedule().getDate() + " đã bị hủy bởi bác sĩ.");
            }
            userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
                notificationService.sendNotification(receptionist.getId(), 
                    "Bác sĩ vừa hủy lịch khám của bệnh nhân " + updatedAppointment.getPatient().getUser().getFullName());
            });
        }

        // Notify receptionist if cancelled by patient
        if (status == AppointmentStatus.CANCELLED_BY_PATIENT) {
            userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
                notificationService.sendNotification(receptionist.getId(), 
                    "Bệnh nhân " + updatedAppointment.getPatient().getUser().getFullName() + " vừa hủy lịch khám.");
            });
            if (updatedAppointment.getDoctor() != null && updatedAppointment.getDoctor().getUser() != null) {
                notificationService.sendNotification(updatedAppointment.getDoctor().getUser().getId(), "Bệnh nhân " + updatedAppointment.getPatient().getUser().getFullName() + " đã hủy lịch khám ngày " + updatedAppointment.getSchedule().getDate());
            }
        }
        
        // Notify doctor when checked in
        if (status == AppointmentStatus.CHECKED_IN && updatedAppointment.getDoctor() != null && updatedAppointment.getDoctor().getUser() != null) {
            notificationService.sendNotification(updatedAppointment.getDoctor().getUser().getId(), "Bệnh nhân " + updatedAppointment.getPatient().getUser().getFullName() + " đã đến check-in và đang chờ khám.");
        }

        return mapToDto(updatedAppointment);
    }

    @Override
    @Transactional
    public AppointmentDto changeAppointmentSchedule(Long appointmentId, Long newScheduleId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new IllegalArgumentException("Chỉ có thể thay đổi bác sĩ khi lịch hẹn ở trạng thái PENDING hoặc CONFIRMED.");
        }
        
        Schedule newSchedule = scheduleRepository.findById(newScheduleId)
                .orElseThrow(() -> new RuntimeException("New schedule not found"));
                
        if (newSchedule.getStatus() != ScheduleStatus.AVAILABLE) {
            throw new IllegalArgumentException("Ca khám mới không ở trạng thái AVAILABLE.");
        }
        
        int newCurrent = newSchedule.getCurrentPatient() == null ? 0 : newSchedule.getCurrentPatient();
        int newMax = newSchedule.getMaxPatient() == null ? 0 : newSchedule.getMaxPatient();
        if (newMax <= 0 || newCurrent >= newMax) {
            throw new IllegalArgumentException("Ca khám mới đã đầy.");
        }

        // Check for overlapping time slots on the same day for the patient
        List<Appointment> patientApts = appointmentRepository.findByPatient_UserIdOrderByIdDesc(appointment.getPatient().getUser().getId());
        for (Appointment apt : patientApts) {
            if (!apt.getId().equals(appointmentId) && apt.getSchedule() != null && apt.getSchedule().getDate().equals(newSchedule.getDate())) {
                boolean isCancelled = apt.getStatus() == AppointmentStatus.CANCELLED_BY_PATIENT ||
                                      apt.getStatus() == AppointmentStatus.CANCELLED_BY_DOCTOR ||
                                      apt.getStatus() == AppointmentStatus.NO_SHOW_BY_DOCTOR ||
                                      apt.getStatus() == AppointmentStatus.NO_SHOW ||
                                      apt.getStatus() == AppointmentStatus.DECLINED;
                if (!isCancelled) {
                    java.time.LocalTime existingStart = apt.getSchedule().getStartTime();
                    java.time.LocalTime existingEnd = apt.getSchedule().getEndTime();
                    java.time.LocalTime newStart = newSchedule.getStartTime();
                    java.time.LocalTime newEnd = newSchedule.getEndTime();
                    
                    if (existingStart != null && existingEnd != null && newStart != null && newEnd != null) {
                        // Overlap condition: (StartA < EndB) && (EndA > StartB)
                        if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
                            throw new IllegalArgumentException("Bệnh nhân đã có một lịch khám khác (" + existingStart + " - " + existingEnd + ") trùng với khung giờ này.");
                        }
                    }
                }
            }
        }
        
        Schedule oldSchedule = appointment.getSchedule();
        if (oldSchedule != null && !oldSchedule.getId().equals(newSchedule.getId())) {
            // Decrement old schedule
            int oldCurrent = oldSchedule.getCurrentPatient() == null ? 0 : oldSchedule.getCurrentPatient();
            oldSchedule.setCurrentPatient(Math.max(0, oldCurrent - 1));
            if (oldSchedule.getStatus() != ScheduleStatus.CANCELLED) {
                oldSchedule.setStatus(ScheduleStatus.AVAILABLE);
            }
            scheduleRepository.save(oldSchedule);
        }
        
        // Increment new schedule
        newSchedule.setCurrentPatient(newCurrent + 1);
        if (newSchedule.getCurrentPatient() >= newMax) {
            newSchedule.setStatus(ScheduleStatus.FULL);
        }
        scheduleRepository.save(newSchedule);
        
        appointment.setSchedule(newSchedule);
        appointment.setDoctor(newSchedule.getDoctor());
        
        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Notifications
        if (appointment.getPatient() != null) {
            notificationService.sendNotification(appointment.getPatient().getUser().getId(), "Lịch khám của bạn đã được đổi sang ngày " + newSchedule.getDate() + " (" + newSchedule.getStartTime() + " - " + newSchedule.getEndTime() + ") với bác sĩ " + newSchedule.getDoctor().getUser().getFullName());
        }
        if (newSchedule.getDoctor() != null && newSchedule.getDoctor().getUser() != null) {
            notificationService.sendNotification(newSchedule.getDoctor().getUser().getId(), "Có bệnh nhân " + appointment.getPatient().getUser().getFullName() + " đổi sang lịch khám của bạn vào ngày " + newSchedule.getDate());
        }
        if (oldSchedule != null && oldSchedule.getDoctor() != null && oldSchedule.getDoctor().getUser() != null && !oldSchedule.getDoctor().getId().equals(newSchedule.getDoctor().getId())) {
            notificationService.sendNotification(oldSchedule.getDoctor().getUser().getId(), "Bệnh nhân " + appointment.getPatient().getUser().getFullName() + " đã đổi lịch khám sang bác sĩ khác.");
        }
        userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
            notificationService.sendNotification(receptionist.getId(), "Lịch hẹn của bệnh nhân " + appointment.getPatient().getUser().getFullName() + " đã được thay đổi.");
        });
        
        return mapToDto(savedAppointment);
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

        boolean hasComplaint = false;
        if (appointment.getId() != null) {
            hasComplaint = complaintRepository.existsByAppointmentId(appointment.getId());
        }
        java.math.BigDecimal consultationFee = (appointment.getDoctor() != null) ? appointment.getDoctor().getConsultationFee() : null;

        AppointmentDto dto = new AppointmentDto(
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
                appointment.getNote(),
                hasComplaint,
                appointment.getVisitType(),
                appointment.getHomeAddress(),
                appointment.getTravelFee(),
                appointment.getExpectedTime(),
                consultationFee
        );
        return dto;
    }

    @Override
    @Transactional
    public AppointmentDto createHomeVisit(com.smartclinic.backend.dto.HomeVisitRequestDto requestDto) {
        if (requestDto == null || requestDto.getDoctorId() == null || requestDto.getScheduleId() == null) {
            throw new IllegalArgumentException("Doctor and schedule are required.");
        }

        Patient patient;
        User user;
        
        if (requestDto.getPatientId() != null) {
            patient = patientRepository.findById(requestDto.getPatientId())
                    .orElseThrow(() -> new RuntimeException("Patient not found for id: " + requestDto.getPatientId()));
            user = patient.getUser();
        } else {
            user = userRepository.findByPhone(requestDto.getPatientPhone()).orElse(null);
            if (user == null) {
                user = new User();
                user.setFullName(requestDto.getPatientName());
                user.setPhone(requestDto.getPatientPhone());
                user.setEmail(requestDto.getPatientPhone() + "@homevisit.local"); // dummy email
                user.setPassword("123456"); // dummy password
                user.setRole(Role.PATIENT);
                user.setStatus(com.smartclinic.backend.entity.Status.ACTIVE);
                user = userRepository.save(user);
            }

            patient = patientRepository.findByUserId(user.getId()).orElse(null);
            if (patient == null) {
                patient = new Patient();
                patient.setUser(user);
                patient.setAddress(requestDto.getPatientAddress());
                if (requestDto.getPatientDob() != null && !requestDto.getPatientDob().isEmpty()) {
                    patient.setBirthday(LocalDate.parse(requestDto.getPatientDob()));
                }
                patient = patientRepository.save(patient);
            }
        }

        Doctor doctor = doctorRepository.findById(requestDto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Schedule schedule = scheduleRepository.findById(requestDto.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        // Check for overlapping time slots on the same day for the patient
        if (user.getId() != null) {
            List<Appointment> patientApts = appointmentRepository.findByPatient_UserIdOrderByIdDesc(user.getId());
            for (Appointment apt : patientApts) {
                if (apt.getSchedule() != null && apt.getSchedule().getDate().equals(schedule.getDate())) {
                    boolean isCancelled = apt.getStatus() == AppointmentStatus.CANCELLED_BY_PATIENT ||
                                          apt.getStatus() == AppointmentStatus.CANCELLED_BY_DOCTOR ||
                                          apt.getStatus() == AppointmentStatus.NO_SHOW_BY_DOCTOR ||
                                          apt.getStatus() == AppointmentStatus.NO_SHOW ||
                                          apt.getStatus() == AppointmentStatus.DECLINED;
                    if (!isCancelled) {
                        java.time.LocalTime existingStart = apt.getSchedule().getStartTime();
                        java.time.LocalTime existingEnd = apt.getSchedule().getEndTime();
                        
                        if (apt.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT && apt.getExpectedTime() != null) {
                            try {
                                if (apt.getExpectedTime().contains(" - ")) {
                                    String[] p = apt.getExpectedTime().split(" - ");
                                    existingStart = java.time.LocalTime.parse(p[0]);
                                    existingEnd = java.time.LocalTime.parse(p[1]);
                                } else {
                                    existingStart = java.time.LocalTime.parse(apt.getExpectedTime());
                                    existingEnd = existingStart.plusMinutes(30);
                                }
                            } catch (Exception ignored) {}
                        }

                        java.time.LocalTime newStart = schedule.getStartTime();
                        java.time.LocalTime newEnd = schedule.getEndTime();
                        
                        if (requestDto.getExpectedTime() != null) {
                            try {
                                if (requestDto.getExpectedTime().contains(" - ")) {
                                    String[] p = requestDto.getExpectedTime().split(" - ");
                                    newStart = java.time.LocalTime.parse(p[0]);
                                    newEnd = java.time.LocalTime.parse(p[1]);
                                } else {
                                    newStart = java.time.LocalTime.parse(requestDto.getExpectedTime());
                                    newEnd = newStart.plusMinutes(30);
                                }
                            } catch (Exception ignored) {}
                        }
                        
                        if (existingStart != null && existingEnd != null && newStart != null && newEnd != null) {
                            // Overlap condition: (StartA < EndB) && (EndA > StartB)
                            if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
                                throw new IllegalArgumentException("Bệnh nhân đã có một lịch khám khác (" + existingStart + " - " + existingEnd + ") trùng với khung giờ này.");
                            }
                        }
                    }
                }
            }
        }

        // (Removed strict currentPatient >= maxPatient check here for HOME_VISIT to allow multiple pending requests)
        // schedule.setCurrentPatient(current + 1);
        // if (max > 0 && schedule.getCurrentPatient() >= max) {
        //     schedule.setStatus(ScheduleStatus.FULL);
        // }
        // scheduleRepository.save(schedule);

        // Validate 1-hour prior rule for HOME visits
        java.time.LocalTime newStart = null;
        java.time.LocalTime newEnd = null;
        if (requestDto.getExpectedTime() != null && !requestDto.getExpectedTime().trim().isEmpty()) {
            try {
                String[] parts = requestDto.getExpectedTime().split(" - ");
                newStart = java.time.LocalTime.parse(parts[0]);
                newEnd = java.time.LocalTime.parse(parts[1]);
                java.time.LocalDateTime desiredDateTime = java.time.LocalDateTime.of(schedule.getDate(), newStart);
                
                if (java.time.LocalDateTime.now().plusHours(1).isAfter(desiredDateTime)) {
                    throw new IllegalArgumentException("Bạn cần đặt lịch ít nhất 1 giờ trước thời gian mong muốn để phòng khám có đủ thời gian sắp xếp bác sĩ và lộ trình di chuyển. Vui lòng chọn khoảng thời gian khác hoặc ngày khác.");
                }

                if (java.time.Duration.between(newStart, newEnd).toMinutes() < 30) {
                    throw new IllegalArgumentException("Khoảng thời gian mong muốn phải kéo dài ít nhất 30 phút.");
                }
            } catch (Exception e) {
                if (e instanceof IllegalArgumentException) {
                    throw e;
                }
            }
        }

        // Validate 30-minute buffer between appointments for the same doctor
        if (newStart != null && newEnd != null) {
            List<Appointment> doctorApts = appointmentRepository.findByDoctorIdOrderByIdDesc(doctor.getId());
            for (Appointment apt : doctorApts) {
                if (apt.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT && 
                    apt.getSchedule() != null && 
                    apt.getSchedule().getDate().equals(schedule.getDate())) {
                    
                    boolean isCancelled = apt.getStatus() == AppointmentStatus.CANCELLED_BY_PATIENT ||
                                          apt.getStatus() == AppointmentStatus.CANCELLED_BY_DOCTOR ||
                                          apt.getStatus() == AppointmentStatus.NO_SHOW_BY_DOCTOR ||
                                          apt.getStatus() == AppointmentStatus.NO_SHOW ||
                                          apt.getStatus() == AppointmentStatus.DECLINED;
                    
                    if (!isCancelled && apt.getExpectedTime() != null) {
                        java.time.LocalTime existingStart;
                        java.time.LocalTime existingEnd;
                        try {
                            if (apt.getExpectedTime().contains(" - ")) {
                                String[] p = apt.getExpectedTime().split(" - ");
                                existingStart = java.time.LocalTime.parse(p[0]);
                                existingEnd = java.time.LocalTime.parse(p[1]);
                            } else {
                                existingStart = java.time.LocalTime.parse(apt.getExpectedTime());
                                existingEnd = existingStart.plusMinutes(30);
                            }

                            boolean isSafeBefore = !newEnd.plusMinutes(30).isAfter(existingStart); // newEnd + 30 <= existingStart
                            boolean isSafeAfter = !existingEnd.plusMinutes(30).isAfter(newStart); // existingEnd + 30 <= newStart
                            
                            if (!isSafeBefore && !isSafeAfter) {
                                throw new IllegalArgumentException("Lịch đặt phải cách các ca khám khác ít nhất 30 phút để bác sĩ di chuyển. Khung giờ này đang quá sát với một ca khám khác.");
                            }
                        } catch (Exception e) {
                            if (e instanceof IllegalArgumentException) {
                                throw e;
                            }
                        }
                    }
                }
            }
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .schedule(schedule)
                .symptom(requestDto.getSymptom())
                .status(AppointmentStatus.PENDING)
                .visitType(com.smartclinic.backend.entity.VisitType.HOME_VISIT)
                .homeAddress(requestDto.getHomeAddress())
                .travelFee(requestDto.getTravelFee())
                .note(requestDto.getNote())
                .isReviewed(false)
                .isReminded(false)
                .expectedTime(requestDto.getExpectedTime())
                .build();

        appointment = appointmentRepository.save(appointment);
        
        notificationService.sendNotification(
                doctor.getUser().getId(),
                "Có lịch khám tại nhà mới từ Bệnh nhân " + user.getFullName() + " vào ngày " + schedule.getDate() + "."
        );

        final User finalUser = user;
        userRepository.findByRole(Role.RECEPTIONIST).forEach(receptionist -> {
            notificationService.sendNotification(receptionist.getId(), 
                "Bệnh nhân " + finalUser.getFullName() + " vừa đặt một lịch khám tại nhà mới (Chờ xử lý).");
        });

        return mapToDto(appointment);
    }

    @Override
    @Transactional
    public AppointmentDto confirmHomeVisit(Long appointmentId, String exactTime, java.math.BigDecimal travelFee) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        if (appointment.getVisitType() != com.smartclinic.backend.entity.VisitType.HOME_VISIT) {
            throw new IllegalArgumentException("Chỉ áp dụng cho khám tại nhà.");
        }

        // Check if there is another confirmed home visit for the same doctor at the same exact time
        List<Appointment> doctorApts = appointmentRepository.findByDoctorIdOrderByIdDesc(appointment.getDoctor().getId());
        for (Appointment apt : doctorApts) {
            if (!apt.getId().equals(appointmentId) && 
                apt.getVisitType() == com.smartclinic.backend.entity.VisitType.HOME_VISIT &&
                (apt.getStatus() == AppointmentStatus.CONFIRMED || apt.getStatus() == AppointmentStatus.ON_THE_WAY || apt.getStatus() == AppointmentStatus.ARRIVED || apt.getStatus() == AppointmentStatus.IN_PROGRESS)) {
                if (apt.getSchedule().getDate().equals(appointment.getSchedule().getDate())) {
                    if (exactTime.equals(apt.getExpectedTime())) {
                        throw new IllegalArgumentException("Bác sĩ đã có một lịch khám tại nhà khác vào lúc " + exactTime + " ngày hôm nay.");
                    }
                }
            }
        }

        appointment.setExpectedTime(exactTime);
        appointment.setTravelFee(travelFee);
        appointment.setStatus(AppointmentStatus.PENDING_CONFIRMATION);

        // Optional: Increase schedule currentPatient count here if we want to track confirmed ones.
        Schedule schedule = appointment.getSchedule();
        int current = schedule.getCurrentPatient() == null ? 0 : schedule.getCurrentPatient();
        int max = schedule.getMaxPatient() == null ? 0 : schedule.getMaxPatient();
        schedule.setCurrentPatient(current + 1);
        if (max > 0 && schedule.getCurrentPatient() >= max) {
            schedule.setStatus(ScheduleStatus.FULL);
        }
        scheduleRepository.save(schedule);

        appointment = appointmentRepository.save(appointment);

        // Notify patient
        if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
            String msg = "Lịch khám tại nhà của bạn đã được xác nhận. Giờ đến dự kiến: " + exactTime + ". Phí di chuyển: " + (travelFee != null ? travelFee.longValue() + " VNĐ" : "0 VNĐ") + ".";
            notificationService.sendNotification(appointment.getPatient().getUser().getId(), msg);
        }

        return mapToDto(appointment);
    }

    @Override
    @Transactional
    public AppointmentDto declineHomeVisitOutOfRange(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        if (appointment.getVisitType() != com.smartclinic.backend.entity.VisitType.HOME_VISIT) {
            throw new IllegalArgumentException("Chỉ áp dụng cho khám tại nhà.");
        }

        appointment.setStatus(AppointmentStatus.DECLINED);
        Appointment updatedAppointment = appointmentRepository.save(appointment);

        if (updatedAppointment.getPatient() != null && updatedAppointment.getPatient().getUser() != null) {
            notificationService.sendNotification(updatedAppointment.getPatient().getUser().getId(),
                "Địa chỉ của bạn nằm ngoài phạm vi phục vụ khám tại nhà (15 km). Vui lòng liên hệ phòng khám để được hỗ trợ.");
        }

        return mapToDto(updatedAppointment);
    }
}
