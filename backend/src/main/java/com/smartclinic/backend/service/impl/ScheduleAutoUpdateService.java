package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.ScheduleStatus;
import com.smartclinic.backend.repository.ScheduleRepository;
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
                if (schedule.getStatus() != ScheduleStatus.IN_PROGRESS) {
                    schedule.setNote("Vắng bác sĩ");
                    schedule.setStatus(ScheduleStatus.CANCELLED);

                    // Cascade cancellation to appointments
                    List<com.smartclinic.backend.entity.Appointment> relatedApts = appointmentRepository.findByScheduleId(schedule.getId());
                    for (com.smartclinic.backend.entity.Appointment apt : relatedApts) {
                        if (apt.getStatus() != com.smartclinic.backend.entity.AppointmentStatus.COMPLETED && apt.getStatus() != com.smartclinic.backend.entity.AppointmentStatus.CANCELLED_BY_PATIENT && apt.getStatus() != com.smartclinic.backend.entity.AppointmentStatus.CANCELLED_BY_DOCTOR) {
                            apt.setStatus(com.smartclinic.backend.entity.AppointmentStatus.CANCELLED_BY_DOCTOR);
                            apt.setNote("Vắng bác sĩ");
                            appointmentRepository.save(apt);
                        }
                    }
                } else {
                    schedule.setStatus(ScheduleStatus.COMPLETED);
                }
            }
            scheduleRepository.saveAll(expiredSchedules);
            log.info("Successfully updated expired schedules.");
        }
    }
}
