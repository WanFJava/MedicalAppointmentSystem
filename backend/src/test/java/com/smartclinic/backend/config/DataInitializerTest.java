package com.smartclinic.backend.config;

import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.ScheduleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private SpecialtyRepository specialtyRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ScheduleService scheduleService;

    @InjectMocks
    private DataInitializer dataInitializer;

    @Test
    void replenishesMissingDaysWhenTheScheduleTableAlreadyHasRows() {
        LocalDate today = LocalDate.now();

        when(specialtyRepository.count()).thenReturn(1L);

        Doctor doctor = new Doctor();
        doctor.setId(10L);
        when(doctorRepository.findAll()).thenReturn(List.of(doctor));
        when(scheduleRepository.findByDoctorIdAndDate(doctor.getId(), today))
                .thenReturn(List.of(new Schedule()));
        when(scheduleRepository.findByDoctorIdAndDate(doctor.getId(), today.plusDays(1)))
                .thenReturn(List.of());
        when(scheduleRepository.findByDoctorIdAndDate(doctor.getId(), today.plusDays(2)))
                .thenReturn(List.of());

        dataInitializer.run();

        verify(scheduleService, never()).generateSchedules(doctor.getId(), today);
        verify(scheduleService).generateSchedules(doctor.getId(), today.plusDays(1));
        verify(scheduleService).generateSchedules(doctor.getId(), today.plusDays(2));
    }
}
