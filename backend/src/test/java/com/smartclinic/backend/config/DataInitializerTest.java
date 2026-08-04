package com.smartclinic.backend.config;

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

import static org.mockito.Mockito.verifyNoInteractions;
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
    void doesNotGenerateSchedulesAutomatically() {
        when(specialtyRepository.count()).thenReturn(1L);

        dataInitializer.run();

        verifyNoInteractions(scheduleService);
    }
}
