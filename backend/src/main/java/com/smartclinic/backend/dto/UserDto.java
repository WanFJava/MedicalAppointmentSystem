package com.smartclinic.backend.dto;

import com.smartclinic.backend.entity.Role;
import com.smartclinic.backend.entity.Status;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String password; // Used for creation, can be null on get
    private String phone;
    private String avatar;
    private Role role;
    private Status status;
}
