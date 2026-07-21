package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.ScheduleDto;
import com.smartclinic.backend.dto.ScheduleRequestDto;
import com.smartclinic.backend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ScheduleDto> createSchedule(
            @PathVariable Long doctorId,
            @RequestBody ScheduleRequestDto requestDto) {
        return ResponseEntity.ok(scheduleService.createSchedule(doctorId, requestDto));
    }

    @PostMapping("/generate/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<ScheduleDto>> generateSchedules(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scheduleService.generateSchedules(doctorId, date));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<ScheduleDto>> getSchedulesByDoctorAndDate(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scheduleService.getSchedulesByDoctorAndDate(doctorId, date));
    }

    @GetMapping("/available/doctor/{doctorId}")
    public ResponseEntity<List<ScheduleDto>> getAvailableSchedules(
            @PathVariable Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) {
            return ResponseEntity.ok(scheduleService.getAvailableSchedules(doctorId, date));
        }
        return ResponseEntity.ok(scheduleService.getAllUpcomingAvailableSchedules(doctorId));
    }
}
