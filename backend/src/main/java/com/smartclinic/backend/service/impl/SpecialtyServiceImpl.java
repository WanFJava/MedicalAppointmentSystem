package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.dto.SpecialtyDto;
import com.smartclinic.backend.entity.Doctor;
import com.smartclinic.backend.entity.Specialty;
import com.smartclinic.backend.repository.DoctorRepository;
import com.smartclinic.backend.repository.SpecialtyRepository;
import com.smartclinic.backend.service.SpecialtyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecialtyServiceImpl implements SpecialtyService {

    private final SpecialtyRepository specialtyRepository;
    private final DoctorRepository doctorRepository;

    @Override
    public SpecialtyDto createSpecialty(SpecialtyDto specialtyDto) {
        Specialty specialty = new Specialty();
        specialty.setName(specialtyDto.getName());
        specialty.setDescription(specialtyDto.getDescription());
        
        Specialty savedSpecialty = specialtyRepository.save(specialty);
        return mapToDto(savedSpecialty);
    }

    @Override
    public SpecialtyDto getSpecialtyById(Long id) {
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Specialty not found with id: " + id));
        return mapToDto(specialty);
    }

    @Override
    public List<SpecialtyDto> getAllSpecialties() {
        List<Specialty> specialties = specialtyRepository.findAll();
        return specialties.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public SpecialtyDto updateSpecialty(Long id, SpecialtyDto specialtyDto) {
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Specialty not found with id: " + id));
        
        specialty.setName(specialtyDto.getName());
        specialty.setDescription(specialtyDto.getDescription());
        
        Specialty updatedSpecialty = specialtyRepository.save(specialty);
        return mapToDto(updatedSpecialty);
    }

    @Override
    public void deleteSpecialty(Long id) {
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Specialty not found with id: " + id));

        List<Doctor> doctorsInSpecialty = doctorRepository.findBySpecialtyId(id);
        if (!doctorsInSpecialty.isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa chuyên khoa '" + specialty.getName() 
                    + "' vì đang có " + doctorsInSpecialty.size() + " bác sĩ đang hoạt động thuộc khoa này!");
        }

        specialtyRepository.delete(specialty);
    }

    private SpecialtyDto mapToDto(Specialty specialty) {
        return new SpecialtyDto(
                specialty.getId(),
                specialty.getName(),
                specialty.getDescription()
        );
    }
}
