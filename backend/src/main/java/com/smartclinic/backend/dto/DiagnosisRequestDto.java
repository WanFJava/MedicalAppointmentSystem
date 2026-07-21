package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisRequestDto {
    private String diagnosis;
    private String advice;
    private List<PrescriptionItemDto> prescriptions;
}
