package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.AppointmentDto;
import com.smartclinic.backend.dto.BookingRequestDto;
import com.smartclinic.backend.entity.Appointment;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final ScheduleRepository scheduleRepository;
    private final PatientRepository patientRepository;

    @Override
    @Transactional
    public AppointmentDto bookAppointment(Long patientId, BookingRequestDto requestDto) {
        User user = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Patient patient = patientRepository.findByUserId(patientId)
                .orElseGet(() -> {
                    Patient newPatient = new Patient();
                    newPatient.setUser(user);
                    return patientRepository.save(newPatient);
                });

        Doctor doctor = doctorRepository.findById(requestDto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Schedule schedule = scheduleRepository.findById(requestDto.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (!"AVAILABLE".equals(schedule.getStatus())) {
            throw new RuntimeException("Schedule is no longer available");
        }

        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSchedule(schedule);
        appointment.setSymptom(requestDto.getSymptom());
        appointment.setStatus(AppointmentStatus.PENDING); // Default status

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Mark schedule as booked
        schedule.setCurrentPatient(schedule.getCurrentPatient() + 1);
        if (schedule.getCurrentPatient() >= schedule.getMaxPatient()) {
            schedule.setStatus("FULL");
        }
        scheduleRepository.save(schedule);

        return mapToDto(savedAppointment);
    }

    @Override
    public List<AppointmentDto> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatient_UserId(patientId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentDto> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentDto updateAppointmentStatus(Long appointmentId, AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setStatus(status);

        // If cancelled, free up the schedule
        if (status == AppointmentStatus.CANCELLED) {
            Schedule schedule = appointment.getSchedule();
            schedule.setCurrentPatient(Math.max(0, schedule.getCurrentPatient() - 1));
            schedule.setStatus("AVAILABLE");
            scheduleRepository.save(schedule);
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return mapToDto(updatedAppointment);
    }

    private AppointmentDto mapToDto(Appointment appointment) {
        return new AppointmentDto(
                appointment.getId(),
                appointment.getPatient().getUser().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getSchedule().getId(),
                appointment.getSchedule().getDate(),
                appointment.getSchedule().getStartTime() + " - " + appointment.getSchedule().getEndTime(),
                appointment.getSymptom(),
                appointment.getStatus()
        );
    }
}
