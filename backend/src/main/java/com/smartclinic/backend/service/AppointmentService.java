package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.AppointmentDto;
import com.smartclinic.backend.dto.BookingRequestDto;
import com.smartclinic.backend.entity.AppointmentStatus;

import java.util.List;

public interface AppointmentService {
    AppointmentDto bookAppointment(Long patientId, BookingRequestDto requestDto);
    List<AppointmentDto> getPatientAppointments(Long patientId);
    List<AppointmentDto> getDoctorAppointments(Long doctorId);
    List<AppointmentDto> getAllAppointments();
    AppointmentDto updateAppointmentStatus(Long appointmentId, AppointmentStatus status);
}
