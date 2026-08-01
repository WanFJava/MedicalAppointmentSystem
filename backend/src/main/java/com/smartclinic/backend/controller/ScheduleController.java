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
    private final com.smartclinic.backend.service.impl.ScheduleAutoUpdateService scheduleAutoUpdateService;

    @PostMapping("/force-auto-update")
    public ResponseEntity<String> forceAutoUpdate() {
        scheduleAutoUpdateService.autoUpdateExpiredSchedules();
        return ResponseEntity.ok("Triggered auto update");
    }

    @PostMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScheduleDto> createSchedule(
            @PathVariable Long doctorId,
            @RequestBody ScheduleRequestDto requestDto) {
        return ResponseEntity.ok(scheduleService.createSchedule(doctorId, requestDto));
    }

    @PostMapping("/open")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScheduleDto> createOpenSchedule(
            @RequestBody ScheduleRequestDto requestDto) {
        return ResponseEntity.ok(scheduleService.createOpenSchedule(requestDto));
    }

    @PostMapping("/generate/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ScheduleDto>> generateSchedules(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scheduleService.generateSchedules(doctorId, date));
    }

    @PostMapping("/generate-open")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ScheduleDto>> generateOpenSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scheduleService.generateOpenSchedules(date));
    }

    @GetMapping("/open")
    public ResponseEntity<List<ScheduleDto>> getOpenSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(scheduleService.getOpenSchedules(date));
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

    @GetMapping
    public ResponseEntity<List<ScheduleDto>> getAllSchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId) {
        return ResponseEntity.ok(scheduleService.getAllSchedules(date, doctorId));
    }

    @PutMapping("/{scheduleId}/register/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ScheduleDto> registerDoctorForSchedule(
            @PathVariable Long scheduleId,
            @PathVariable Long doctorId) {
        return ResponseEntity.ok(scheduleService.registerDoctorForSchedule(scheduleId, doctorId));
    }

    @PutMapping("/{scheduleId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ScheduleDto> updateScheduleStatus(
            @PathVariable Long scheduleId,
            @RequestParam com.smartclinic.backend.entity.ScheduleStatus status) {
        return ResponseEntity.ok(scheduleService.updateScheduleStatus(scheduleId, status));
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long scheduleId) {
        scheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }
}
