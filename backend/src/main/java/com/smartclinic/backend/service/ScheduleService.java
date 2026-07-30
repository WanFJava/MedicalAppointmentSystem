package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.ScheduleDto;
import com.smartclinic.backend.dto.ScheduleRequestDto;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleService {
    ScheduleDto createSchedule(Long doctorId, ScheduleRequestDto requestDto);
    List<ScheduleDto> generateSchedules(Long doctorId, LocalDate date);
    List<ScheduleDto> getSchedulesByDoctorAndDate(Long doctorId, LocalDate date);
    List<ScheduleDto> getAvailableSchedules(Long doctorId, LocalDate date);
    List<ScheduleDto> getAllUpcomingAvailableSchedules(Long doctorId);
    ScheduleDto updateScheduleStatus(Long scheduleId, com.smartclinic.backend.entity.ScheduleStatus status);
}
