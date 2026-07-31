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

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    @Transactional
    public void autoUpdateExpiredSchedules() {
        LocalDate currentDate = LocalDate.now();
        LocalTime currentTime = LocalTime.now();

        List<ScheduleStatus> excludedStatuses = Arrays.asList(ScheduleStatus.COMPLETED, ScheduleStatus.CANCELLED);

        List<Schedule> expiredSchedules = scheduleRepository.findExpiredSchedules(currentDate, currentTime, excludedStatuses);

        if (!expiredSchedules.isEmpty()) {
            log.info("Found {} expired schedules to process.", expiredSchedules.size());
            for (Schedule schedule : expiredSchedules) {
                if (schedule.getStatus() != ScheduleStatus.IN_PROGRESS) {
                    schedule.setNote("Vắng bác sĩ");
                }
                schedule.setStatus(ScheduleStatus.COMPLETED);
            }
            scheduleRepository.saveAll(expiredSchedules);
            log.info("Successfully updated expired schedules to COMPLETED.");
        }
    }
}
