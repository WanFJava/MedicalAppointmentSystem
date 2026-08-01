package com.smartclinic.backend.service;

import com.smartclinic.backend.entity.Medicine;
import java.util.List;

public interface MedicineService {
    Medicine createMedicine(Medicine medicine);
    Medicine updateMedicine(Long id, Medicine medicine);
    void deleteMedicine(Long id);
    Medicine getMedicineById(Long id);
    List<Medicine> getAllMedicines();
}
