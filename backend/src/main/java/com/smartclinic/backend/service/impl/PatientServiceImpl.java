package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.PatientDto;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.dto.DoctorDto;
import com.smartclinic.backend.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final com.smartclinic.backend.repository.AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public PatientDto createPatient(PatientDto patientDto) {
        if (userRepository.existsByEmail(patientDto.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setFullName(patientDto.getFullName());
        user.setEmail(patientDto.getEmail());
        user.setPassword(passwordEncoder.encode(patientDto.getPassword()));
        user.setPhone(patientDto.getPhone());
        user.setRole(com.smartclinic.backend.entity.Role.PATIENT);
        user.setStatus(com.smartclinic.backend.entity.Status.ACTIVE);

        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setBirthday(patientDto.getBirthday());
        patient.setGender(patientDto.getGender());
        patient.setAddress(patientDto.getAddress());
        patient.setBloodGroup(patientDto.getBloodGroup());
        patient.setAllergy(patientDto.getAllergy());

        Patient savedPatient = patientRepository.save(patient);

        return mapToDto(savedUser, savedPatient);
    }

    @Override
    public PatientDto getPatientProfileByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        ensurePatientIsSelf(user);

        Patient patient = patientRepository.findByUserId(userId).orElseGet(() -> {
            Patient p = new Patient();
            p.setUser(user);
            return patientRepository.save(p);
        });

        return mapToDto(user, patient);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientDto> getAllPatients() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.smartclinic.backend.entity.Role.PATIENT)
                .map(u -> {
                    Patient p = patientRepository.findByUserId(u.getId()).orElse(null);
                    return mapToDto(u, p);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PatientDto updatePatientProfile(Long userId, PatientDto patientDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        ensurePatientIsSelf(user);

        // Update User info
        user.setFullName(patientDto.getFullName());
        user.setPhone(patientDto.getPhone());
        userRepository.save(user);

        // Update or create Patient info
        Patient patient = patientRepository.findByUserId(userId).orElse(new Patient());

        if (patient.getId() == null) {
            patient.setUser(user);
        }

        patient.setBirthday(patientDto.getBirthday());
        patient.setGender(patientDto.getGender());
        patient.setAddress(patientDto.getAddress());
        patient.setBloodGroup(patientDto.getBloodGroup());
        patient.setAllergy(patientDto.getAllergy());

        Patient savedPatient = patientRepository.save(patient);

        return mapToDto(user, savedPatient);
    }

    private PatientDto mapToDto(User user, Patient patient) {
        PatientDto dto = new PatientDto();
        dto.setUserId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());

        if (patient != null) {
            dto.setId(patient.getId());
            dto.setBirthday(patient.getBirthday());
            dto.setGender(patient.getGender());
            dto.setAddress(patient.getAddress());
            dto.setBloodGroup(patient.getBloodGroup());
            dto.setAllergy(patient.getAllergy());
        }
        return dto;
    }

    @Override
    @Transactional
    public void addFavoriteDoctor(Long userId, Long doctorId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId).orElseThrow();
                    Patient p = new Patient();
                    p.setUser(user);
                    return patientRepository.save(p);
                });
        ensurePatientIsSelf(patient.getUser());
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        patient.getFavoriteDoctors().add(doctor);
        patientRepository.save(patient);
    }

    @Override
    @Transactional
    public void removeFavoriteDoctor(Long userId, Long doctorId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId).orElseThrow();
                    Patient p = new Patient();
                    p.setUser(user);
                    return patientRepository.save(p);
                });
        ensurePatientIsSelf(patient.getUser());
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        patient.getFavoriteDoctors().remove(doctor);
        patientRepository.save(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDto> getFavoriteDoctors(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElse(null);
        
        if (patient == null) {
            return java.util.Collections.emptyList();
        }
        
        ensurePatientIsSelf(patient.getUser());

        return patient.getFavoriteDoctors().stream().map(doctor -> {
            DoctorDto dto = new DoctorDto();
            dto.setId(doctor.getId());
            dto.setUserId(doctor.getUser().getId());
            dto.setFullName(doctor.getUser().getFullName());
            dto.setEmail(doctor.getUser().getEmail());
            dto.setPhone(doctor.getUser().getPhone());
            dto.setAvatar(doctor.getUser().getAvatar());
            dto.setSpecialtyId(doctor.getSpecialty().getId());
            dto.setSpecialtyName(doctor.getSpecialty().getName());
            dto.setDegree(doctor.getDegree());
            dto.setExperience(doctor.getExperience());
            dto.setConsultationFee(doctor.getConsultationFee());
            dto.setAverageRating(doctor.getAverageRating());
            dto.setTotalReviews(doctor.getTotalReviews());
            dto.setBiography(doctor.getBiography());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public void validatePatientStatusChange(Long patientId, com.smartclinic.backend.entity.Status newStatus) {
        if (newStatus == com.smartclinic.backend.entity.Status.ACTIVE) {
            return;
        }

        if (newStatus == com.smartclinic.backend.entity.Status.INACTIVE) {
            int activeAppointments = appointmentRepository.countByPatientIdAndStatusIn(patientId,
                java.util.Arrays.asList(
                    com.smartclinic.backend.entity.AppointmentStatus.CONFIRMED,
                    com.smartclinic.backend.entity.AppointmentStatus.CHECKED_IN,
                    com.smartclinic.backend.entity.AppointmentStatus.IN_PROGRESS
                ));

            if (activeAppointments > 0) {
                throw new IllegalArgumentException("Không thể ngừng hoạt động tài khoản vì bệnh nhân vẫn còn lịch khám chưa hoàn tất.");
            }
        } else if (newStatus == com.smartclinic.backend.entity.Status.LOCKED) {
            int ongoingAppointments = appointmentRepository.countByPatientIdAndStatusIn(patientId,
                java.util.Arrays.asList(
                    com.smartclinic.backend.entity.AppointmentStatus.CHECKED_IN,
                    com.smartclinic.backend.entity.AppointmentStatus.IN_PROGRESS
                ));

            if (ongoingAppointments > 0) {
                throw new IllegalArgumentException("Không thể khóa tài khoản vì bệnh nhân đang ở phòng khám (đã Check-in hoặc đang khám).");
            }
        }
    }

    private void ensurePatientIsSelf(User user) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(authority -> authority.getAuthority().equals("ROLE_PATIENT"))
                && !user.getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You do not have access to this patient profile.");
        }
    }
}
