package com.smartclinic.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private long totalDoctors;
    private long totalPatients;
    private long appointmentsToday;
    private long activeSpecialties;
    private long totalFeedbacks;
    private long pendingComplaints;
}
