package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.ReceptionistDashboardDto;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.BillStatus;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.BillRepository;
import com.smartclinic.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;

    @Override
    public ReceptionistDashboardDto getReceptionistDashboardStats(LocalDate date) {
        // Fetch all appointments for the given date
        var appointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getSchedule().getDate().equals(date))
                .toList();

        long totalAppointmentsToday = appointments.size();
        
        // Count unique patients for today's appointments
        long totalPatientsToday = appointments.stream()
                .map(a -> a.getPatient().getId())
                .distinct()
                .count();

        long checkedInPatients = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CHECKED_IN || a.getStatus() == AppointmentStatus.IN_PROGRESS || a.getStatus() == AppointmentStatus.COMPLETED)
                .count();

        long waitingPatients = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                .count();

        long cancelledAppointments = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED_BY_PATIENT || a.getStatus() == AppointmentStatus.CANCELLED_BY_DOCTOR)
                .count();

        // Calculate revenue for bills paid today
        // First get all paid bills
        var paidBills = billRepository.findAll().stream()
                .filter(b -> b.getStatus() == BillStatus.PAID && b.getPaidAt() != null && b.getPaidAt().toLocalDate().equals(date))
                .toList();

        double todayRevenue = paidBills.stream()
                .mapToDouble(b -> b.getTotalAmount().doubleValue())
                .sum();

        return ReceptionistDashboardDto.builder()
                .totalPatientsToday(totalPatientsToday)
                .totalAppointmentsToday(totalAppointmentsToday)
                .checkedInPatients(checkedInPatients)
                .waitingPatients(waitingPatients)
                .cancelledAppointments(cancelledAppointments)
                .todayRevenue(todayRevenue)
                .build();
    }
}
