package com.smartclinic.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionistDashboardDto {
    private long totalPatientsToday;
    private long totalAppointmentsToday;
    private long checkedInPatients;
    private long waitingPatients;
    private long cancelledAppointments;
    private double todayRevenue;
}
