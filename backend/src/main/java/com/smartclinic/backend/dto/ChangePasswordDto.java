package com.smartclinic.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordDto {
    private String currentPassword;
    private String newPassword;
}
