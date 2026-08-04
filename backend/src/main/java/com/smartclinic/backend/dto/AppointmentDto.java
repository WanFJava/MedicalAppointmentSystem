package com.smartclinic.backend.dto;

import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.VisitType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long scheduleId;
    private LocalDate scheduleDate;
    private String timeSlot;
    private String symptom;
    private AppointmentStatus status;
    private Integer queueNumber;
    private Boolean isReviewed;
    private String paymentStatus;
    private String note;
    private Boolean hasComplaint;
    private VisitType visitType;
    private String homeAddress;
    private java.math.BigDecimal travelFee;
}
