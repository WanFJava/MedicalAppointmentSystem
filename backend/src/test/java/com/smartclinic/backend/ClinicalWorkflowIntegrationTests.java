package com.smartclinic.backend;

import com.smartclinic.backend.dto.AppointmentDto;
import com.smartclinic.backend.dto.BillDto;
import com.smartclinic.backend.dto.BookingRequestDto;
import com.smartclinic.backend.dto.DiagnosisRequestDto;
import com.smartclinic.backend.dto.FeedbackDto;
import com.smartclinic.backend.dto.PrescriptionItemDto;
import com.smartclinic.backend.entity.Appointment;
import com.smartclinic.backend.entity.AppointmentStatus;
import com.smartclinic.backend.entity.BillStatus;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Medicine;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Schedule;
import com.smartclinic.backend.entity.ScheduleStatus;
import com.smartclinic.backend.entity.Specialty;
import com.smartclinic.backend.entity.Status;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.AppointmentRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.MedicineRepository;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.ScheduleRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.AppointmentService;
import com.smartclinic.backend.service.BillService;
import com.smartclinic.backend.service.FeedbackService;
import com.smartclinic.backend.service.MedicalRecordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ClinicalWorkflowIntegrationTests {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private MedicalRecordService medicalRecordService;

    @Autowired
    private BillService billService;

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void fullClinicalWorkflowCreatesRecordBillAndFeedbackWithoutDoubleDeductingStock() {
        Fixture fixture = createFixture(5);
        Medicine medicine = new Medicine();
        medicine.setName("Workflow medicine " + UUID.randomUUID());
        medicine.setUnit("tablet");
        medicine.setPrice(BigDecimal.valueOf(10));
        medicine.setQuantity(10);
        medicine.setExpiredDate(LocalDate.now().plusYears(1));
        medicine = medicineRepository.save(medicine);

        authenticate(fixture.patientUser().getEmail(), Role.PATIENT);
        AppointmentDto booked = appointmentService.bookAppointment(
                fixture.patientUser().getId(),
                new BookingRequestDto(
                        fixture.doctor().getId(),
                        fixture.schedule().getId(),
                        "Persistent headache"
                )
        );
        assertThat(booked.getStatus()).isEqualTo(AppointmentStatus.PENDING);

        authenticate("receptionist@test.local", Role.RECEPTIONIST);
        appointmentService.updateAppointmentStatus(booked.getId(), AppointmentStatus.CONFIRMED);
        appointmentService.updateAppointmentStatus(booked.getId(), AppointmentStatus.CHECKED_IN);
        assertThat(scheduleRepository.findById(fixture.schedule().getId()).orElseThrow()
                .getCurrentPatient()).isEqualTo(1);

        authenticate(fixture.doctorUser().getEmail(), Role.DOCTOR);
        PrescriptionItemDto prescription = new PrescriptionItemDto(
                medicine.getId(), "1 tablet", "After meals", 2);
        medicalRecordService.diagnosePatient(
                booked.getId(),
                fixture.doctor().getId(),
                new DiagnosisRequestDto(
                        "Tension headache",
                        "Rest and drink water",
                        List.of(prescription)
                )
        );
        assertThat(appointmentRepository.findById(booked.getId()).orElseThrow().getStatus())
                .isEqualTo(AppointmentStatus.COMPLETED);
        assertThat(medicineRepository.findById(medicine.getId()).orElseThrow().getQuantity())
                .isEqualTo(8);

        authenticate("receptionist@test.local", Role.RECEPTIONIST);
        BillDto bill = billService.generateBill(booked.getId());
        BillDto paidBill = billService.payBill(bill.getId());
        assertThat(paidBill.getStatus()).isEqualTo(BillStatus.PAID);
        assertThat(medicineRepository.findById(medicine.getId()).orElseThrow().getQuantity())
                .as("stock is deducted when prescribed, not a second time when paid")
                .isEqualTo(8);

        authenticate(fixture.patientUser().getEmail(), Role.PATIENT);
        FeedbackDto feedbackRequest = new FeedbackDto();
        feedbackRequest.setAppointmentId(booked.getId());
        feedbackRequest.setRating(5);
        feedbackRequest.setComment("Clear explanation and helpful treatment.");
        FeedbackDto savedFeedback = feedbackService.createFeedback(feedbackRequest);

        assertThat(savedFeedback.getPatientId()).isEqualTo(fixture.patientUser().getId());
        assertThat(savedFeedback.getDoctorId()).isEqualTo(fixture.doctor().getId());
        assertThat(feedbackService.getFeedbackByAppointment(booked.getId()).getRating()).isEqualTo(5);

        Doctor ratedDoctor = doctorRepository.findById(fixture.doctor().getId()).orElseThrow();
        assertThat(ratedDoctor.getTotalReviews()).isEqualTo(1);
        assertThat(ratedDoctor.getAverageRating()).isEqualByComparingTo("5.00");
        assertThat(appointmentRepository.findById(booked.getId()).orElseThrow().getIsReviewed())
                .isTrue();

        authenticate("admin@test.local", Role.ADMIN);
        assertThat(feedbackService.getAllFeedbacks())
                .extracting(FeedbackDto::getId)
                .contains(savedFeedback.getId());
    }

    @Test
    void bookingRejectsDoctorScheduleMismatchDuplicateAndFullSchedule() {
        Fixture fixture = createFixture(1);
        Doctor anotherDoctor = createDoctor(fixture.specialty());

        authenticate(fixture.patientUser().getEmail(), Role.PATIENT);
        BookingRequestDto mismatchedRequest = new BookingRequestDto(
                anotherDoctor.getId(), fixture.schedule().getId(), "Fever");
        assertThatThrownBy(() -> appointmentService.bookAppointment(
                fixture.patientUser().getId(), mismatchedRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not belong");

        BookingRequestDto validRequest = new BookingRequestDto(
                fixture.doctor().getId(), fixture.schedule().getId(), "Fever");
        appointmentService.bookAppointment(fixture.patientUser().getId(), validRequest);
        assertThatThrownBy(() -> appointmentService.bookAppointment(
                fixture.patientUser().getId(), validRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already have");

        Fixture secondFixture = createFixture(1);
        secondFixture.schedule().setCurrentPatient(1);
        secondFixture.schedule().setStatus(ScheduleStatus.AVAILABLE);
        scheduleRepository.save(secondFixture.schedule());
        authenticate(secondFixture.patientUser().getEmail(), Role.PATIENT);
        assertThatThrownBy(() -> appointmentService.bookAppointment(
                secondFixture.patientUser().getId(),
                new BookingRequestDto(
                        secondFixture.doctor().getId(),
                        secondFixture.schedule().getId(),
                        "Back pain"
                )))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("full");
    }

    @Test
    void bookingRequiresAtLeastTwentyFourHoursNotice() {
        Fixture fixture = createFixture(2);
        LocalDateTime tooSoon = LocalDateTime.now()
                .plusHours(23)
                .withSecond(0)
                .withNano(0);
        fixture.schedule().setDate(tooSoon.toLocalDate());
        fixture.schedule().setStartTime(tooSoon.toLocalTime());
        fixture.schedule().setEndTime(tooSoon.plusMinutes(30).toLocalTime());
        scheduleRepository.save(fixture.schedule());

        authenticate(fixture.patientUser().getEmail(), Role.PATIENT);
        BookingRequestDto request = new BookingRequestDto(
                fixture.doctor().getId(),
                fixture.schedule().getId(),
                "Follow-up"
        );

        assertThatThrownBy(() -> appointmentService.bookAppointment(
                fixture.patientUser().getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("24 giờ");
    }

    @Test
    void patientCannotAccessAnotherPatientsAppointmentsOrSubmitInvalidRating() {
        Fixture fixture = createFixture(2);
        Fixture anotherFixture = createFixture(2);

        authenticate(fixture.patientUser().getEmail(), Role.PATIENT);
        assertThatThrownBy(() -> appointmentService.getPatientAppointments(
                anotherFixture.patientUser().getId()))
                .isInstanceOf(AccessDeniedException.class);

        Appointment completedAppointment = new Appointment();
        completedAppointment.setPatient(fixture.patient());
        completedAppointment.setDoctor(fixture.doctor());
        completedAppointment.setSchedule(fixture.schedule());
        completedAppointment.setSymptom("Follow-up");
        completedAppointment.setStatus(AppointmentStatus.COMPLETED);
        completedAppointment.setIsReviewed(false);
        completedAppointment = appointmentRepository.save(completedAppointment);

        FeedbackDto invalidFeedback = new FeedbackDto();
        invalidFeedback.setAppointmentId(completedAppointment.getId());
        invalidFeedback.setRating(6);
        assertThatThrownBy(() -> feedbackService.createFeedback(invalidFeedback))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 5");
    }

    private Fixture createFixture(int maxPatients) {
        String suffix = UUID.randomUUID().toString();

        User patientUser = createUser(
                "Patient " + suffix, "patient-" + suffix + "@test.local", Role.PATIENT);
        Patient patient = new Patient();
        patient.setUser(patientUser);
        patient = patientRepository.save(patient);

        Specialty specialty = new Specialty();
        specialty.setName("Specialty " + suffix);
        specialty.setDescription("Integration test specialty");
        specialty = specialtyRepository.save(specialty);

        Doctor doctor = createDoctor(specialty);
        User doctorUser = doctor.getUser();

        Schedule schedule = new Schedule();
        schedule.setDoctor(doctor);
        schedule.setDate(LocalDate.now().plusDays(2));
        schedule.setStartTime(LocalTime.of(9, 0));
        schedule.setEndTime(LocalTime.of(10, 0));
        schedule.setMaxPatient(maxPatients);
        schedule.setCurrentPatient(0);
        schedule.setStatus(ScheduleStatus.AVAILABLE);
        schedule = scheduleRepository.save(schedule);

        return new Fixture(patientUser, patient, doctorUser, doctor, specialty, schedule);
    }

    private Doctor createDoctor(Specialty specialty) {
        String suffix = UUID.randomUUID().toString();
        User doctorUser = createUser(
                "Doctor " + suffix, "doctor-" + suffix + "@test.local", Role.DOCTOR);
        Doctor doctor = new Doctor();
        doctor.setUser(doctorUser);
        doctor.setSpecialty(specialty);
        doctor.setDegree("MD");
        doctor.setExperience(10);
        doctor.setConsultationFee(BigDecimal.valueOf(100));
        doctor.setAverageRating(BigDecimal.ZERO);
        doctor.setTotalReviews(0);
        return doctorRepository.save(doctor);
    }

    private User createUser(String fullName, String email, Role role) {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword("password");
        user.setRole(role);
        user.setStatus(Status.ACTIVE);
        return userRepository.save(user);
    }

    private void authenticate(String username, Role role) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
                );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private record Fixture(
            User patientUser,
            Patient patient,
            User doctorUser,
            Doctor doctor,
            Specialty specialty,
            Schedule schedule
    ) {
    }
}
