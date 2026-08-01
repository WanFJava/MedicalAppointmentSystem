package com.smartclinic.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintDto {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long appointmentId;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolvedBy; // name of the receptionist/admin
    private String resolutionNote;
    
    // Additional fields for better UI
    private String doctorName;
    private String scheduleDate;
    private String timeSlot;
}
