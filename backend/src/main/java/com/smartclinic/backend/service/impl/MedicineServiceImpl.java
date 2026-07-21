package com.smartclinic.backend.service.impl;

import com.smartclinic.backend.entity.Medicine;
import com.smartclinic.backend.exception.ResourceNotFoundException;
import com.smartclinic.backend.repository.MedicineRepository;
import com.smartclinic.backend.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;

    @Override
    public Medicine createMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    @Override
    public Medicine updateMedicine(Long id, Medicine medicineDetails) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        
        medicine.setName(medicineDetails.getName());
        medicine.setUnit(medicineDetails.getUnit());
        medicine.setPrice(medicineDetails.getPrice());
        medicine.setQuantity(medicineDetails.getQuantity());
        medicine.setExpiredDate(medicineDetails.getExpiredDate());
        
        return medicineRepository.save(medicine);
    }

    @Override
    public void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        medicineRepository.delete(medicine);
    }

    @Override
    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
    }

    @Override
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }
}
