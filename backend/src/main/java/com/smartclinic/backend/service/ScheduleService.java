package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.ScheduleDto;
import com.smartclinic.backend.dto.ScheduleRequestDto;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleService {
    ScheduleDto createSchedule(Long doctorId, ScheduleRequestDto requestDto);
    ScheduleDto createOpenSchedule(ScheduleRequestDto requestDto);
    List<ScheduleDto> generateSchedules(Long doctorId, LocalDate date);
    List<ScheduleDto> generateOpenSchedules(LocalDate date);
    List<ScheduleDto> getSchedulesByDoctorAndDate(Long doctorId, LocalDate date);
    List<ScheduleDto> getAllSchedules(LocalDate date, Long doctorId);
    List<ScheduleDto> getAvailableSchedules(Long doctorId, LocalDate date);
    List<ScheduleDto> getAllUpcomingAvailableSchedules(Long doctorId);
    List<ScheduleDto> getOpenSchedules(LocalDate date);
    ScheduleDto registerDoctorForSchedule(Long scheduleId, Long doctorId);
    ScheduleDto updateScheduleStatus(Long scheduleId, com.smartclinic.backend.entity.ScheduleStatus status);
    void deleteSchedule(Long scheduleId);
}
