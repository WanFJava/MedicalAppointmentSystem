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

    private void validateScheduleTime(LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date == null || startTime == null || endTime == null) {
            throw new IllegalArgumentException("Ngày và khung giờ khám không được để trống.");
        }
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Giờ bắt đầu (" + startTime + ") phải nhỏ hơn giờ kết thúc (" + endTime + ").");
        }
        LocalDateTime shiftStart = LocalDateTime.of(date, startTime);
        if (LocalDateTime.now().isAfter(shiftStart)) {
            throw new IllegalArgumentException("Không thể tạo ca khám đã qua thời gian bắt đầu (Ca khám: " + date + " " + startTime + ").");
        }
    }

    private void checkDoctorScheduleOverlap(Long doctorId, LocalDate date, LocalTime startTime, LocalTime endTime, Long currentScheduleId) {
        if (doctorId == null) return;
        List<Schedule> existingDoctorSchedules = scheduleRepository.findByDoctorIdAndDate(doctorId, date);
        for (Schedule existing : existingDoctorSchedules) {
            if (existing.getStatus() != ScheduleStatus.CANCELLED) {
                if (currentScheduleId != null && existing.getId().equals(currentScheduleId)) {
                    continue;
                }
                boolean overlaps = startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime());
                if (overlaps) {
                    if (existing.getStatus() == ScheduleStatus.IN_PROGRESS) {
                        throw new IllegalArgumentException("Bác sĩ đang có ca trực ĐANG DIỄN RA trùng khung giờ (" 
                                + existing.getStartTime() + " - " + existing.getEndTime() + ") trong ngày " + date + ". Không thể đăng ký/tạo ca khác!");
                    } else {
                        throw new IllegalArgumentException("Bác sĩ đã có ca trực trùng khung giờ (" 
                                + existing.getStartTime() + " - " + existing.getEndTime() + ", Trạng thái: " + existing.getStatus() + ") trong ngày " + date + "!");
                    }
                }
            }
        }
    }

    @Override
    public ScheduleDto createSchedule(Long doctorId, ScheduleRequestDto requestDto) {
        validateScheduleTime(requestDto.getDate(), requestDto.getStartTime(), requestDto.getEndTime());
        if (doctorId != null) {
            checkDoctorScheduleOverlap(doctorId, requestDto.getDate(), requestDto.getStartTime(), requestDto.getEndTime(), null);
        }
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
        validateScheduleTime(requestDto.getDate(), requestDto.getStartTime(), requestDto.getEndTime());
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

        LocalDateTime now = LocalDateTime.now();
        List<Schedule> newSchedules = new ArrayList<>();

        LocalDateTime morningStart = LocalDateTime.of(date, LocalTime.of(8, 0));
        if (!now.isAfter(morningStart)) {
            Schedule morning = new Schedule();
            morning.setDoctor(doctor);
            morning.setDate(date);
            morning.setStartTime(LocalTime.of(8, 0));
            morning.setEndTime(LocalTime.of(11, 30));
            morning.setMaxPatient(10);
            morning.setCurrentPatient(0);
            morning.setStatus(ScheduleStatus.OPEN);
            newSchedules.add(morning);
        }

        LocalDateTime afternoonStart = LocalDateTime.of(date, LocalTime.of(13, 30));
        if (!now.isAfter(afternoonStart)) {
            Schedule afternoon = new Schedule();
            afternoon.setDoctor(doctor);
            afternoon.setDate(date);
            afternoon.setStartTime(LocalTime.of(13, 30));
            afternoon.setEndTime(LocalTime.of(17, 0));
            afternoon.setMaxPatient(12);
            afternoon.setCurrentPatient(0);
            afternoon.setStatus(ScheduleStatus.OPEN);
            newSchedules.add(afternoon);
        }

        if (newSchedules.isEmpty()) {
            throw new IllegalArgumentException("Không thể tự động sinh ca: Các ca khám mặc định ngày " + date + " đều đã qua thời gian bắt đầu!");
        }

        List<Schedule> savedSchedules = scheduleRepository.saveAll(newSchedules);
        return savedSchedules.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<ScheduleDto> generateOpenSchedules(LocalDate date) {
        LocalDateTime now = LocalDateTime.now();
        List<Schedule> newSchedules = new ArrayList<>();

        LocalDateTime morningStart = LocalDateTime.of(date, LocalTime.of(8, 0));
        if (!now.isAfter(morningStart)) {
            Schedule morning = new Schedule();
            morning.setDoctor(null);
            morning.setDate(date);
            morning.setStartTime(LocalTime.of(8, 0));
            morning.setEndTime(LocalTime.of(11, 30));
            morning.setMaxPatient(10);
            morning.setCurrentPatient(0);
            morning.setStatus(ScheduleStatus.OPEN);
            newSchedules.add(morning);
        }

        LocalDateTime afternoonStart = LocalDateTime.of(date, LocalTime.of(13, 30));
        if (!now.isAfter(afternoonStart)) {
            Schedule afternoon = new Schedule();
            afternoon.setDoctor(null);
            afternoon.setDate(date);
            afternoon.setStartTime(LocalTime.of(13, 30));
            afternoon.setEndTime(LocalTime.of(17, 0));
            afternoon.setMaxPatient(12);
            afternoon.setCurrentPatient(0);
            afternoon.setStatus(ScheduleStatus.OPEN);
            newSchedules.add(afternoon);
        }

        if (newSchedules.isEmpty()) {
            throw new IllegalArgumentException("Không thể tự động sinh ca mở: Các ca khám mặc định ngày " + date + " đều đã qua thời gian bắt đầu!");
        }

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

        // Overlap check
        checkDoctorScheduleOverlap(doctorId, schedule.getDate(), schedule.getStartTime(), schedule.getEndTime(), scheduleId);

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
