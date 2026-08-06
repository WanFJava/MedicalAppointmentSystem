package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HomeVisitRequestDto {
    private Long patientId;
    private String patientName;
    private String patientPhone;
    private String patientDob; // format YYYY-MM-DD
    private String patientAddress;
    
    private Long doctorId;
    private Long scheduleId;
    
    private String symptom;
    private String homeAddress;
    private BigDecimal travelFee;
    private String note;
    private String expectedTime;
}
