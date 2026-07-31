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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;

    private void autoCancelExpiredOpenSchedules(List<Schedule> schedules) {
        LocalDateTime now = LocalDateTime.now();
        List<Schedule> expiredList = new ArrayList<>();
        for (Schedule s : schedules) {
            if (s.getStatus() == ScheduleStatus.OPEN && s.getDoctor() == null) {
                LocalDateTime shiftStart = LocalDateTime.of(s.getDate(), s.getStartTime());
                if (now.isAfter(shiftStart)) {
                    s.setStatus(ScheduleStatus.CANCELLED);
                    expiredList.add(s);
                }
            }
        }
        if (!expiredList.isEmpty()) {
            scheduleRepository.saveAll(expiredList);
        }
    }

    @Override
    public ScheduleDto createSchedule(Long doctorId, ScheduleRequestDto requestDto) {
        Doctor doctor = doctorId != null ? doctorRepository.findById(doctorId).orElse(null) : null;
                
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
    public ScheduleDto createOpenSchedule(ScheduleRequestDto requestDto) {
        Schedule schedule = new Schedule();
        schedule.setDoctor(null);
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
        if (doctorId == null) {
            return generateOpenSchedules(date);
        }
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));
                
        List<Schedule> existingSchedules = scheduleRepository.findByDoctorIdAndDate(doctorId, date);
        if (!existingSchedules.isEmpty()) {
            return existingSchedules.stream().map(this::mapToDto).collect(Collectors.toList());
        }

        List<Schedule> newSchedules = new ArrayList<>();
        Schedule morning = new Schedule();
        morning.setDoctor(doctor);
        morning.setDate(date);
        morning.setStartTime(LocalTime.of(8, 0));
        morning.setEndTime(LocalTime.of(11, 30));
        morning.setMaxPatient(10);
        morning.setCurrentPatient(0);
        morning.setStatus(ScheduleStatus.OPEN);
        newSchedules.add(morning);

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
    public List<ScheduleDto> generateOpenSchedules(LocalDate date) {
        List<Schedule> newSchedules = new ArrayList<>();
        Schedule morning = new Schedule();
        morning.setDoctor(null);
        morning.setDate(date);
        morning.setStartTime(LocalTime.of(8, 0));
        morning.setEndTime(LocalTime.of(11, 30));
        morning.setMaxPatient(10);
        morning.setCurrentPatient(0);
        morning.setStatus(ScheduleStatus.OPEN);
        newSchedules.add(morning);

        Schedule afternoon = new Schedule();
        afternoon.setDoctor(null);
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
    public List<ScheduleDto> getAllSchedules(LocalDate date, Long doctorId) {
        List<Schedule> list;
        if (date != null && doctorId != null) {
            list = scheduleRepository.findByDoctorIdAndDate(doctorId, date);
        } else if (date != null) {
            list = scheduleRepository.findByDateOrderByStartTimeAsc(date);
        } else if (doctorId != null) {
            list = scheduleRepository.findByDoctorIdAndDate(doctorId, LocalDate.now());
        } else {
            list = scheduleRepository.findByDateOrderByStartTimeAsc(LocalDate.now());
        }
        autoCancelExpiredOpenSchedules(list);
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
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
    public List<ScheduleDto> getOpenSchedules(LocalDate date) {
        List<Schedule> openSchedules;
        if (date != null) {
            openSchedules = scheduleRepository.findByStatusAndDate(ScheduleStatus.OPEN, date);
        } else {
            openSchedules = scheduleRepository.findAll().stream()
                    .filter(s -> s.getStatus() == ScheduleStatus.OPEN)
                    .collect(Collectors.toList());
        }
        autoCancelExpiredOpenSchedules(openSchedules);
        return openSchedules.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.OPEN)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ScheduleDto registerDoctorForSchedule(Long scheduleId, Long doctorId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + scheduleId));

        if (schedule.getStatus() != ScheduleStatus.OPEN) {
            throw new RuntimeException("Ca khám này không ở trạng thái OPEN để đăng ký.");
        }

        // Rule 1: Check deadline (shiftStart must be > now)
        LocalDateTime shiftStart = LocalDateTime.of(schedule.getDate(), schedule.getStartTime());
        if (LocalDateTime.now().isAfter(shiftStart)) {
            schedule.setStatus(ScheduleStatus.CANCELLED);
            scheduleRepository.save(schedule);
            throw new RuntimeException("Ca làm việc đã quá thời gian bắt đầu (" + schedule.getDate() + " " + schedule.getStartTime() + "). Hệ thống đã tự động hủy ca.");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));

        // Rule 2: Overlap check (doctor cannot have another non-cancelled shift overlapping this time)
        List<Schedule> existingDoctorSchedules = scheduleRepository.findByDoctorIdAndDate(doctorId, schedule.getDate());
        for (Schedule existing : existingDoctorSchedules) {
            if (existing.getStatus() != ScheduleStatus.CANCELLED && !existing.getId().equals(scheduleId)) {
                boolean overlaps = schedule.getStartTime().isBefore(existing.getEndTime()) && schedule.getEndTime().isAfter(existing.getStartTime());
                if (overlaps) {
                    throw new RuntimeException("Bạn đã có ca trực khác trùng khung giờ (" + existing.getStartTime() + " - " + existing.getEndTime() + ") trong ngày " + schedule.getDate() + "!");
                }
            }
        }

        schedule.setDoctor(doctor);
        schedule.setStatus(ScheduleStatus.AVAILABLE);

        return mapToDto(scheduleRepository.save(schedule));
    }

    @Override
    public ScheduleDto updateScheduleStatus(Long scheduleId, ScheduleStatus status) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus(status);
        return mapToDto(scheduleRepository.save(schedule));
    }

    @Override
    public void deleteSchedule(Long scheduleId) {
        if (!scheduleRepository.existsById(scheduleId)) {
            throw new RuntimeException("Schedule not found with id: " + scheduleId);
        }
        scheduleRepository.deleteById(scheduleId);
    }

    private ScheduleDto mapToDto(Schedule schedule) {
        Long doctorId = schedule.getDoctor() != null ? schedule.getDoctor().getId() : null;
        String doctorName = schedule.getDoctor() != null && schedule.getDoctor().getUser() != null
                ? schedule.getDoctor().getUser().getFullName() : "Chưa có bác sĩ";
        return new ScheduleDto(
                schedule.getId(),
                doctorId,
                doctorName,
                schedule.getDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getMaxPatient(),
                schedule.getCurrentPatient(),
                schedule.getStatus()
        );
    }
}
