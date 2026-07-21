package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDto {
    private Long id;
    private Long medicineId;
    private String medicineName;
    private String dosage;
    private String instruction;
    private Integer quantity;
}
