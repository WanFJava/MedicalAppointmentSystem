package com.smartclinic.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordDto {
    private String email;
    private String otpCode;
    private String newPassword;
}
