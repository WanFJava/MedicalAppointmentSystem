package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.DoctorDto;
import java.util.List;

public interface DoctorService {
    DoctorDto createDoctor(DoctorDto doctorDto);
    DoctorDto getDoctorById(Long id);
    List<DoctorDto> getAllDoctors();
    List<DoctorDto> getDoctorsBySpecialty(Long specialtyId);
    DoctorDto updateDoctor(Long id, DoctorDto doctorDto);
    DoctorDto updateDoctorStatus(Long id, com.smartclinic.backend.entity.Status status);
    void deleteDoctor(Long id);
    DoctorDto getDoctorByUserId(Long userId);
}
