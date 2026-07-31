package com.smartclinic.backend.dto;

import com.smartclinic.backend.entity.BillStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BillDto {
    private Long id;
    private Long appointmentId;
    private BigDecimal consultationFee;
    private BigDecimal medicineFee;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private BillStatus status;
    private LocalDateTime createdAt;
}
