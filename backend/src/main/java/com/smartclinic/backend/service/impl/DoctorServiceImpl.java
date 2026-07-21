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

    @Override
    @Transactional
    public DoctorDto createDoctor(DoctorDto doctorDto) {
        User user;
        if (doctorDto.getUserId() != null) {
            user = userRepository.findById(doctorDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + doctorDto.getUserId()));
            
            // Ensure the user has DOCTOR role
            if (user.getRole() != Role.DOCTOR) {
                user.setRole(Role.DOCTOR);
                userRepository.save(user);
            }
        } else {
            // Create a new User for the doctor
            if (userRepository.existsByEmail(doctorDto.getEmail())) {
                throw new RuntimeException("Email is already taken");
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

        Specialty specialty = specialtyRepository.findById(doctorDto.getSpecialtyId())
                .orElseThrow(() -> new RuntimeException("Specialty not found with id: " + doctorDto.getSpecialtyId()));

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setSpecialty(specialty);
        doctor.setDegree(doctorDto.getDegree());
        doctor.setExperience(doctorDto.getExperience());
        doctor.setConsultationFee(doctorDto.getConsultationFee());

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

        Doctor updatedDoctor = doctorRepository.save(doctor);
        return mapToDto(updatedDoctor);
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
        dto.setSpecialtyId(doctor.getSpecialty().getId());
        dto.setSpecialtyName(doctor.getSpecialty().getName());
        dto.setDegree(doctor.getDegree());
        dto.setExperience(doctor.getExperience());
        dto.setConsultationFee(doctor.getConsultationFee());
        return dto;
    }
}
