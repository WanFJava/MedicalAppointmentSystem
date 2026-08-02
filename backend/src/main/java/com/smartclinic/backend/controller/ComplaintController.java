package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.ComplaintDto;

import com.smartclinic.backend.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    // PATIENT: Create a complaint
    @PostMapping("/patient/{patientUserId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ComplaintDto> createComplaint(@PathVariable Long patientUserId, @RequestBody ComplaintDto complaintDto) {
        return new ResponseEntity<>(complaintService.createComplaint(patientUserId, complaintDto), HttpStatus.CREATED);
    }

    // PATIENT: Get their own complaints
    @GetMapping("/patient/{patientUserId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<ComplaintDto>> getMyComplaints(@PathVariable Long patientUserId) {
        return ResponseEntity.ok(complaintService.getPatientComplaints(patientUserId));
    }

    // RECEPTIONIST/ADMIN: Get all complaints
    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<List<ComplaintDto>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    // RECEPTIONIST/ADMIN: Resolve complaint
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<ComplaintDto> resolveComplaint(
            @PathVariable Long id, 
            @RequestParam Long resolvedByUserId, 
            @RequestBody ComplaintDto complaintDto) {
        return ResponseEntity.ok(complaintService.resolveComplaint(id, resolvedByUserId, complaintDto.getResolutionNote()));
    }
}
