package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.BillDto;

public interface BillService {
    BillDto generateBill(Long appointmentId);
    BillDto payBill(Long billId);
    BillDto getBillByAppointmentId(Long appointmentId);
}
