package com.smartclinic.backend.config;

import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.entity.Specialty;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;
    private final DoctorRepository doctorRepository;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleService scheduleService;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Create Admin
        if (userRepository.findByEmail("admin@clinic.com").isEmpty()) {
            User admin = new User();
            admin.setFullName("System Admin");
            admin.setEmail("admin@clinic.com");
            admin.setPassword("admin123"); 
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }

        // Create Receptionist
        if (userRepository.findByEmail("receptionist@clinic.com").isEmpty()) {
            User receptionist = new User();
            receptionist.setFullName("Lễ tân Hoa");
            receptionist.setEmail("receptionist@clinic.com");
            receptionist.setPassword("123456");
            receptionist.setRole(Role.RECEPTIONIST);
            userRepository.save(receptionist);
        }

        // Create Patient
        if (userRepository.findByEmail("patient@clinic.com").isEmpty()) {
            User patient = new User();
            patient.setFullName("Bệnh nhân An");
            patient.setEmail("patient@clinic.com");
            patient.setPassword("123456");
            patient.setRole(Role.PATIENT);
            userRepository.save(patient);
        }

        // Create Specialties if none exist
        if (specialtyRepository.count() == 0) {
            Specialty cardio = new Specialty();
            cardio.setName("Tim mạch (Cardiology)");
            cardio.setDescription("Chuyên khoa tim mạch");
            cardio = specialtyRepository.save(cardio);

            Specialty neuro = new Specialty();
            neuro.setName("Thần kinh (Neurology)");
            neuro.setDescription("Chuyên khoa thần kinh");
            neuro = specialtyRepository.save(neuro);

            Specialty derma = new Specialty();
            derma.setName("Da liễu (Dermatology)");
            derma.setDescription("Chuyên khoa da liễu");
            derma = specialtyRepository.save(derma);

            // Create Doctors
            User userDoc1 = new User();
            userDoc1.setFullName("BS. Nguyễn Văn Tuấn");
            userDoc1.setEmail("bs.tuan@clinic.com");
            userDoc1.setPassword("123456");
            userDoc1.setRole(Role.DOCTOR);
            userDoc1 = userRepository.save(userDoc1);

            Doctor doc1 = new Doctor();
            doc1.setUser(userDoc1);
            doc1.setSpecialty(cardio);
            doc1.setDegree("Tiến sĩ, Bác sĩ CKII");
            doc1.setExperience(15);
            doc1.setConsultationFee(BigDecimal.valueOf(500000.0));
            doc1 = doctorRepository.save(doc1);

            User userDoc2 = new User();
            userDoc2.setFullName("BS. Trần Thị Mai");
            userDoc2.setEmail("bs.mai@clinic.com");
            userDoc2.setPassword("123456");
            userDoc2.setRole(Role.DOCTOR);
            userDoc2 = userRepository.save(userDoc2);

            Doctor doc2 = new Doctor();
            doc2.setUser(userDoc2);
            doc2.setSpecialty(cardio);
            doc2.setDegree("Thạc sĩ, Bác sĩ CKI");
            doc2.setExperience(8);
            doc2.setConsultationFee(BigDecimal.valueOf(300000.0));
            doc2 = doctorRepository.save(doc2);

            User userDoc3 = new User();
            userDoc3.setFullName("BS. Lê Hoàng Cường");
            userDoc3.setEmail("bs.cuong@clinic.com");
            userDoc3.setPassword("123456");
            userDoc3.setRole(Role.DOCTOR);
            userDoc3 = userRepository.save(userDoc3);

            Doctor doc3 = new Doctor();
            doc3.setUser(userDoc3);
            doc3.setSpecialty(neuro);
            doc3.setDegree("Giáo sư, Tiến sĩ");
            doc3.setExperience(20);
            doc3.setConsultationFee(BigDecimal.valueOf(800000.0));
            doc3 = doctorRepository.save(doc3);

        }

        // Generate Schedules if none exist
        if (scheduleRepository.count() == 0) {
            LocalDate today = LocalDate.now();
            List<Doctor> doctors = doctorRepository.findAll();
            for (Doctor doc : doctors) {
                for (int i = 0; i < 3; i++) {
                    scheduleService.generateSchedules(doc.getId(), today.plusDays(i));
                }
            }
        }
    }
}
