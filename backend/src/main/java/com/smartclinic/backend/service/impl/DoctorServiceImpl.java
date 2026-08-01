package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.DoctorDto;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Specialty;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.smartclinic.backend.repository.FeedbackRepository feedbackRepository;
    private final com.smartclinic.backend.repository.AppointmentRepository appointmentRepository;
    private final com.smartclinic.backend.repository.ScheduleRepository scheduleRepository;

    @Override
    @Transactional
    public DoctorDto createDoctor(DoctorDto doctorDto) {
        User user;
        if (doctorDto.getUserId() != null) {
            user = userRepository.findById(doctorDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản người dùng với ID: " + doctorDto.getUserId()));
            
            // Ensure the user has DOCTOR role
            if (user.getRole() != Role.DOCTOR) {
                user.setRole(Role.DOCTOR);
                userRepository.save(user);
            }
        } else {
            // Create a new User for the doctor
            if (userRepository.existsByEmail(doctorDto.getEmail())) {
                throw new IllegalArgumentException("Email '" + doctorDto.getEmail() + "' đã được sử dụng trong hệ thống! Vui lòng chọn email khác.");
            }
            user = new User();
            user.setFullName(doctorDto.getFullName());
            user.setEmail(doctorDto.getEmail());
            user.setPhone(doctorDto.getPhone());
            user.setPassword(passwordEncoder.encode(doctorDto.getPassword()));
            user.setRole(Role.DOCTOR);
            user.setStatus(com.smartclinic.backend.entity.Status.ACTIVE);
            user = userRepository.save(user);
        }

        if (doctorDto.getSpecialtyId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn Chuyên khoa hợp lệ cho Bác sĩ!");
        }

        Specialty specialty = specialtyRepository.findById(doctorDto.getSpecialtyId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Chuyên khoa với ID: " + doctorDto.getSpecialtyId()));

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setSpecialty(specialty);
        doctor.setDegree(doctorDto.getDegree());
        doctor.setExperience(doctorDto.getExperience());
        doctor.setConsultationFee(doctorDto.getConsultationFee());
        doctor.setBiography(doctorDto.getBiography());

        Doctor savedDoctor = doctorRepository.save(doctor);
        return mapToDto(savedDoctor);
    }

    @Override
    public DoctorDto getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        return mapToDto(doctor);
    }

    @Override
    public List<DoctorDto> getAllDoctors() {
        return doctorRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<DoctorDto> getDoctorsBySpecialty(Long specialtyId) {
        return doctorRepository.findBySpecialtyId(specialtyId).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorDto updateDoctor(Long id, DoctorDto doctorDto) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));

        Specialty specialty = specialtyRepository.findById(doctorDto.getSpecialtyId())
                .orElseThrow(() -> new RuntimeException("Specialty not found with id: " + doctorDto.getSpecialtyId()));

        doctor.setSpecialty(specialty);
        doctor.setDegree(doctorDto.getDegree());
        doctor.setExperience(doctorDto.getExperience());
        doctor.setConsultationFee(doctorDto.getConsultationFee());
        doctor.setBiography(doctorDto.getBiography());

        if (doctorDto.getStatus() != null && doctor.getUser() != null && doctorDto.getStatus() != doctor.getUser().getStatus()) {
            validateDoctorStatusChange(doctor.getId(), doctorDto.getStatus());
            doctor.getUser().setStatus(doctorDto.getStatus());
            userRepository.save(doctor.getUser());
        }

        Doctor updatedDoctor = doctorRepository.save(doctor);
        return mapToDto(updatedDoctor);
    }

    @Override
    @Transactional
    public DoctorDto updateDoctorStatus(Long id, com.smartclinic.backend.entity.Status status) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ với ID: " + id));

        User user = doctor.getUser();
        if (user != null) {
            validateDoctorStatusChange(doctor.getId(), status);
            user.setStatus(status);
            userRepository.save(user);
        }

        return mapToDto(doctor);
    }

    @Override
    public void validateDoctorStatusChange(Long doctorId, com.smartclinic.backend.entity.Status newStatus) {
        if (newStatus == com.smartclinic.backend.entity.Status.ACTIVE) {
            return;
        }

        if (newStatus == com.smartclinic.backend.entity.Status.INACTIVE) {
            int activeSchedules = scheduleRepository.countByDoctorIdAndStatusIn(doctorId, 
                java.util.Arrays.asList(
                    com.smartclinic.backend.entity.ScheduleStatus.FULL,
                    com.smartclinic.backend.entity.ScheduleStatus.IN_PROGRESS
                ));
            int activeAppointments = appointmentRepository.countByDoctorIdAndStatusIn(doctorId, 
                java.util.Arrays.asList(
                    com.smartclinic.backend.entity.AppointmentStatus.CONFIRMED,
                    com.smartclinic.backend.entity.AppointmentStatus.CHECKED_IN,
                    com.smartclinic.backend.entity.AppointmentStatus.IN_PROGRESS
                ));
            
            if (activeSchedules > 0 || activeAppointments > 0) {
                throw new IllegalArgumentException("Không thể ngừng hoạt động (INACTIVE) vì bác sĩ đang có lịch làm (FULL/IN_PROGRESS) hoặc lịch hẹn (CONFIRMED/CHECKED_IN/IN_PROGRESS). Vui lòng hoàn tất hoặc chuyển các lịch này trước.");
            }
        } else if (newStatus == com.smartclinic.backend.entity.Status.LOCKED) {
            int inProgressSchedules = scheduleRepository.countByDoctorIdAndStatusIn(doctorId, 
                java.util.Collections.singletonList(com.smartclinic.backend.entity.ScheduleStatus.IN_PROGRESS));
            
            int ongoingAppointments = appointmentRepository.countByDoctorIdAndStatusIn(doctorId, 
                java.util.Arrays.asList(
                    com.smartclinic.backend.entity.AppointmentStatus.CHECKED_IN,
                    com.smartclinic.backend.entity.AppointmentStatus.IN_PROGRESS
                ));
            
            if (inProgressSchedules > 0 || ongoingAppointments > 0) {
                throw new IllegalArgumentException("Không thể khóa tài khoản vì bác sĩ đang có ca trực diễn ra hoặc đang có bệnh nhân chờ khám (CHECKED_IN/IN_PROGRESS).");
            }
        }
    }

    @Override
    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        doctorRepository.delete(doctor);
    }

    @Override
    public DoctorDto getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found for user id: " + userId));
        return mapToDto(doctor);
    }

    private DoctorDto mapToDto(Doctor doctor) {
        DoctorDto dto = new DoctorDto();
        dto.setId(doctor.getId());
        dto.setUserId(doctor.getUser().getId());
        dto.setFullName(doctor.getUser().getFullName());
        dto.setEmail(doctor.getUser().getEmail());
        dto.setPhone(doctor.getUser().getPhone());
        dto.setAvatar(doctor.getUser().getAvatar());
        dto.setStatus(doctor.getUser() != null ? doctor.getUser().getStatus() : com.smartclinic.backend.entity.Status.ACTIVE);
        dto.setSpecialtyId(doctor.getSpecialty().getId());
        dto.setSpecialtyName(doctor.getSpecialty().getName());
        dto.setDegree(doctor.getDegree());
        dto.setExperience(doctor.getExperience());
        dto.setConsultationFee(doctor.getConsultationFee());
        java.util.List<com.smartclinic.backend.entity.Feedback> fbs = feedbackRepository.findByDoctorIdOrderByIdDesc(doctor.getId());
        if (fbs != null && !fbs.isEmpty()) {
            dto.setTotalReviews(fbs.size());
            double sum = fbs.stream().mapToInt(com.smartclinic.backend.entity.Feedback::getRating).sum();
            dto.setAverageRating(new java.math.BigDecimal(sum / fbs.size()).setScale(1, java.math.RoundingMode.HALF_UP));
        } else {
            dto.setAverageRating(java.math.BigDecimal.ZERO);
            dto.setTotalReviews(0);
        }

        dto.setBiography(doctor.getBiography());
        return dto;
    }
}
