package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.SpecialtyDto;
import java.util.List;

public interface SpecialtyService {
    SpecialtyDto createSpecialty(SpecialtyDto specialtyDto);
    SpecialtyDto getSpecialtyById(Long id);
    List<SpecialtyDto> getAllSpecialties();
    SpecialtyDto updateSpecialty(Long id, SpecialtyDto specialtyDto);
    void deleteSpecialty(Long id);
}
