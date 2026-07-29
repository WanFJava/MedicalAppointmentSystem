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

    @Override
    public PatientDto getPatientProfileByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Patient patient = patientRepository.findByUserId(userId).orElse(null);

        return mapToDto(user, patient);
    }

    @Override
    @Transactional
    public PatientDto updatePatientProfile(Long userId, PatientDto patientDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

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
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", userId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));
        
        patient.getFavoriteDoctors().add(doctor);
        patientRepository.save(patient);
    }

    @Override
    @Transactional
    public void removeFavoriteDoctor(Long userId, Long doctorId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", userId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));
        
        patient.getFavoriteDoctors().remove(doctor);
        patientRepository.save(patient);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorDto> getFavoriteDoctors(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", userId));
        
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
}
