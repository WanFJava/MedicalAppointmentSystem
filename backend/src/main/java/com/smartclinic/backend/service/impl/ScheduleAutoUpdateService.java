package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.ScheduleStatus;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleAutoUpdateService {

    private final ScheduleRepository scheduleRepository;
    private final com.smartclinic.backend.repository.AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    @Transactional
    public void autoUpdateExpiredSchedules() {
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate currentDate = LocalDate.now(zoneId);
        LocalTime currentTime = LocalTime.now(zoneId).withNano(0);

        List<Schedule> expiredSchedules = new java.util.ArrayList<>();

        // Check today's schedules
        List<Schedule> todaySchedules = scheduleRepository.findByDate(currentDate);
        for (Schedule s : todaySchedules) {
            if (s.getStatus() != ScheduleStatus.COMPLETED && s.getStatus() != ScheduleStatus.CANCELLED) {
                if (s.getEndTime() != null && (s.getEndTime().isBefore(currentTime) || s.getEndTime().equals(currentTime))) {
                    expiredSchedules.add(s);
                }
            }
        }

        // Check yesterday's schedules (in case the server was down and missed them)
        List<Schedule> yesterdaySchedules = scheduleRepository.findByDate(currentDate.minusDays(1));
        for (Schedule s : yesterdaySchedules) {
            if (s.getStatus() != ScheduleStatus.COMPLETED && s.getStatus() != ScheduleStatus.CANCELLED) {
                expiredSchedules.add(s);
            }
        }

        log.info("Running Schedule Auto Update. Date: {}, Time: {}. Found {} expired schedules.", currentDate, currentTime, expiredSchedules.size());

        if (!expiredSchedules.isEmpty()) {
            log.info("Found {} expired schedules to process.", expiredSchedules.size());
            for (Schedule schedule : expiredSchedules) {
                List<com.smartclinic.backend.entity.Appointment> relatedApts = appointmentRepository.findByScheduleId(schedule.getId());
                boolean doctorStarted = (schedule.getStatus() == ScheduleStatus.IN_PROGRESS || schedule.getStatus() == ScheduleStatus.COMPLETED);
                boolean patientWaiting = relatedApts.stream().anyMatch(a -> a.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.CHECKED_IN);

                if (!doctorStarted && patientWaiting) {
                    // Doctor absent: patient checked in but doctor didn't start
                    schedule.setNote("Vắng bác sĩ");
                    schedule.setStatus(ScheduleStatus.CANCELLED);

                    for (com.smartclinic.backend.entity.Appointment apt : relatedApts) {
                        if (apt.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.CHECKED_IN) {
                            apt.setStatus(com.smartclinic.backend.entity.AppointmentStatus.CANCELLED_BY_DOCTOR);
                            apt.setNote("Vắng bác sĩ");
                            appointmentRepository.save(apt);
                        } else if (apt.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.PENDING || apt.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.CONFIRMED) {
                            apt.setStatus(com.smartclinic.backend.entity.AppointmentStatus.NO_SHOW);
                            appointmentRepository.save(apt);
                        }
                    }
                } else {
                    // Doctor started OR no patient checked in
                    if (schedule.getStatus() != ScheduleStatus.COMPLETED) {
                        schedule.setStatus(ScheduleStatus.COMPLETED);
                    }
                    
                    // Mark any pending/confirmed as NO_SHOW
                    for (com.smartclinic.backend.entity.Appointment apt : relatedApts) {
                        if (apt.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.PENDING || apt.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.CONFIRMED) {
                            apt.setStatus(com.smartclinic.backend.entity.AppointmentStatus.NO_SHOW);
                            appointmentRepository.save(apt);
                        }
                    }
                }
            }
            scheduleRepository.saveAll(expiredSchedules);
            log.info("Successfully updated expired schedules.");
        }
    }

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    @Transactional
    public void remindUpcomingAppointments() {
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate currentDate = LocalDate.now(zoneId);
        LocalTime currentTime = LocalTime.now(zoneId).withNano(0);
        LocalTime reminderThreshold = currentTime.plusMinutes(30);

        List<Schedule> todaySchedules = scheduleRepository.findByDate(currentDate);
        for (Schedule schedule : todaySchedules) {
            if (schedule.getStartTime() != null && schedule.getStartTime().isAfter(currentTime) && schedule.getStartTime().isBefore(reminderThreshold) || schedule.getStartTime().equals(reminderThreshold)) {
                List<com.smartclinic.backend.entity.Appointment> appointments = appointmentRepository.findByScheduleId(schedule.getId());
                for (com.smartclinic.backend.entity.Appointment apt : appointments) {
                    if (apt.getStatus() == com.smartclinic.backend.entity.AppointmentStatus.CONFIRMED && (apt.getIsReminded() == null || !apt.getIsReminded())) {
                        if (apt.getPatient() != null && apt.getPatient().getUser() != null) {
                            notificationService.sendNotification(apt.getPatient().getUser().getId(), 
                                "Nhắc nhở: Bạn có lịch khám vào lúc " + schedule.getStartTime() + " hôm nay. Vui lòng đến đúng giờ để làm thủ tục check-in.");
                            apt.setIsReminded(true);
                            appointmentRepository.save(apt);
                        }
                    }
                }
            }
        }
    }
}
