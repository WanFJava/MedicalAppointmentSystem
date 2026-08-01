package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDto {
    private Long id;
    private Long appointmentId;
    private Long doctorId;
    private String doctorName;
    private String diagnosis;
    private String advice;
    private LocalDateTime createdAt;
    private List<PrescriptionDto> prescriptions;
}
