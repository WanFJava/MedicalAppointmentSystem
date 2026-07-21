package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.BillDto;
import com.smartclinic.backend.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @PostMapping("/generate/{appointmentId}")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    public ResponseEntity<BillDto> generateBill(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(billService.generateBill(appointmentId));
    }

    @PutMapping("/{billId}/pay")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    public ResponseEntity<BillDto> payBill(@PathVariable Long billId) {
        return ResponseEntity.ok(billService.payBill(billId));
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<BillDto> getBillByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(billService.getBillByAppointmentId(appointmentId));
    }
}
