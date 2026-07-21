package com.smartclinic.backend.controller;

import com.smartclinic.backend.dto.SpecialtyDto;
import com.smartclinic.backend.service.SpecialtyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
@RequiredArgsConstructor
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyDto> createSpecialty(@RequestBody SpecialtyDto specialtyDto) {
        return new ResponseEntity<>(specialtyService.createSpecialty(specialtyDto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpecialtyDto> getSpecialtyById(@PathVariable("id") Long specialtyId) {
        return ResponseEntity.ok(specialtyService.getSpecialtyById(specialtyId));
    }

    @GetMapping
    public ResponseEntity<List<SpecialtyDto>> getAllSpecialties() {
        return ResponseEntity.ok(specialtyService.getAllSpecialties());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyDto> updateSpecialty(@PathVariable("id") Long specialtyId,
                                                        @RequestBody SpecialtyDto specialtyDto) {
        return ResponseEntity.ok(specialtyService.updateSpecialty(specialtyId, specialtyDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteSpecialty(@PathVariable("id") Long specialtyId) {
        specialtyService.deleteSpecialty(specialtyId);
        return ResponseEntity.ok("Specialty deleted successfully.");
    }
}
