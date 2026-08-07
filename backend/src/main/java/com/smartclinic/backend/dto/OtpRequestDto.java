package com.smartclinic.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OtpRequestDto {
    private String email;
    private String otpCode;
}
