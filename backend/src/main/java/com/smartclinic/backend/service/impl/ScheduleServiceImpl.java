package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.entity.ScheduleStatus;

import com.smartclinic.backend.dto.ScheduleDto;
import com.smartclinic.backend.dto.ScheduleRequestDto;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;

    @Override
    public ScheduleDto createSchedule(Long doctorId, ScheduleRequestDto requestDto) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));
                
        Schedule schedule = new Schedule();
        schedule.setDoctor(doctor);
        schedule.setDate(requestDto.getDate());
        schedule.setStartTime(requestDto.getStartTime());
        schedule.setEndTime(requestDto.getEndTime());
        schedule.setMaxPatient(requestDto.getMaxPatient());
        schedule.setCurrentPatient(0);
        schedule.setStatus(ScheduleStatus.OPEN);
        
        return mapToDto(scheduleRepository.save(schedule));
    }

    @Override
    public List<ScheduleDto> generateSchedules(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));
                
        // Check if schedules already exist for this date
        List<Schedule> existingSchedules = scheduleRepository.findByDoctorIdAndDate(doctorId, date);
        if (!existingSchedules.isEmpty()) {
            return existingSchedules.stream().map(this::mapToDto).collect(Collectors.toList());
        }

        List<Schedule> newSchedules = new ArrayList<>();
        // Generate Morning Shift
        Schedule morning = new Schedule();
        morning.setDoctor(doctor);
        morning.setDate(date);
        morning.setStartTime(LocalTime.of(8, 0));
        morning.setEndTime(LocalTime.of(11, 30));
        morning.setMaxPatient(10);
        morning.setCurrentPatient(0);
        morning.setStatus(ScheduleStatus.OPEN);
        newSchedules.add(morning);

        // Generate Afternoon Shift
        Schedule afternoon = new Schedule();
        afternoon.setDoctor(doctor);
        afternoon.setDate(date);
        afternoon.setStartTime(LocalTime.of(13, 30));
        afternoon.setEndTime(LocalTime.of(17, 0));
        afternoon.setMaxPatient(12);
        afternoon.setCurrentPatient(0);
        afternoon.setStatus(ScheduleStatus.OPEN);
        newSchedules.add(afternoon);

        List<Schedule> savedSchedules = scheduleRepository.saveAll(newSchedules);
        return savedSchedules.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<ScheduleDto> getSchedulesByDoctorAndDate(Long doctorId, LocalDate date) {
        return scheduleRepository.findByDoctorIdAndDate(doctorId, date)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<ScheduleDto> getAvailableSchedules(Long doctorId, LocalDate date) {
        return scheduleRepository.findByDoctorIdAndDateAndStatus(doctorId, date, ScheduleStatus.AVAILABLE)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<ScheduleDto> getAllUpcomingAvailableSchedules(Long doctorId) {
        return scheduleRepository.findByDoctorIdAndDateGreaterThanEqualAndStatusOrderByDateAscStartTimeAsc(doctorId, LocalDate.now(), ScheduleStatus.AVAILABLE)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public ScheduleDto updateScheduleStatus(Long scheduleId, ScheduleStatus status) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus(status);
        return mapToDto(scheduleRepository.save(schedule));
    }

    private ScheduleDto mapToDto(Schedule schedule) {
        return new ScheduleDto(
                schedule.getId(),
                schedule.getDoctor().getId(),
                schedule.getDoctor().getUser().getFullName(),
                schedule.getDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getMaxPatient(),
                schedule.getCurrentPatient(),
                schedule.getStatus()
        );
    }
}
