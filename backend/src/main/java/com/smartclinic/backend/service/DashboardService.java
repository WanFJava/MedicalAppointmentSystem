package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.ReceptionistDashboardDto;
import java.time.LocalDate;

public interface DashboardService {
    ReceptionistDashboardDto getReceptionistDashboardStats(LocalDate date);
}
