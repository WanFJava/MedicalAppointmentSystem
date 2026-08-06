package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.AppointmentDto;
import com.smartclinic.backend.dto.BookingRequestDto;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @Autowired
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/book/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<AppointmentDto> bookAppointment(
            @PathVariable("patientId") Long patientId,
            @RequestBody BookingRequestDto requestDto) {
        return ResponseEntity.ok(appointmentService.bookAppointment(patientId, requestDto));
    }

    @PostMapping("/home-visit")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'PATIENT')")
    public ResponseEntity<AppointmentDto> createHomeVisit(
            @RequestBody com.smartclinic.backend.dto.HomeVisitRequestDto requestDto) {
        return ResponseEntity.ok(appointmentService.createHomeVisit(requestDto));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<List<AppointmentDto>> getPatientAppointments(@PathVariable("patientId") Long patientId) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<AppointmentDto>> getDoctorAppointments(@PathVariable("doctorId") Long doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<List<AppointmentDto>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PutMapping("/{appointmentId}/status")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<AppointmentDto> updateAppointmentStatus(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestParam("status") AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(appointmentId, status));
    }

    @PutMapping("/{appointmentId}/confirm-home-visit")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<AppointmentDto> confirmHomeVisit(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestParam("exactTime") String exactTime,
            @RequestParam(value = "travelFee", required = false) java.math.BigDecimal travelFee) {
        return ResponseEntity.ok(appointmentService.confirmHomeVisit(appointmentId, exactTime, travelFee));
    }

    @PutMapping("/{appointmentId}/decline-home-visit-out-of-range")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<AppointmentDto> declineHomeVisitOutOfRange(
            @PathVariable("appointmentId") Long appointmentId) {
        return ResponseEntity.ok(appointmentService.declineHomeVisitOutOfRange(appointmentId));
    }

    @PutMapping("/{appointmentId}/change-schedule")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<AppointmentDto> changeAppointmentSchedule(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestParam("newScheduleId") Long newScheduleId) {
        return ResponseEntity.ok(appointmentService.changeAppointmentSchedule(appointmentId, newScheduleId));
    }

    @DeleteMapping("/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAppointment(@PathVariable("appointmentId") Long appointmentId) {
        appointmentService.deleteAppointment(appointmentId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{appointmentId}/queue/call")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<Void> callNext(@PathVariable("appointmentId") Long appointmentId) {
        appointmentService.callNext(appointmentId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/queue/swap")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<Void> swapQueue(@RequestParam("id1") Long id1, @RequestParam("id2") Long id2) {
        appointmentService.swapQueue(id1, id2);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{appointmentId}/queue/skip")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<Void> skipQueue(@PathVariable("appointmentId") Long appointmentId) {
        appointmentService.skipQueue(appointmentId);
        return ResponseEntity.ok().build();
    }
}
