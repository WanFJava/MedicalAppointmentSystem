package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.PatientDto;
import com.smartclinic.backend.entity.Patient;
import com.smartclinic.backend.entity.User;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.PatientRepository;
import com.smartclinic.backend.repository.UserRepository;
import com.smartclinic.backend.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

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
}
