package com.smartclinic.backend.dto;

import com.smartclinic.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private Long id;
    private String fullName;
    private String email;
    private Role role;

    public JwtAuthResponse(String accessToken, Long id, String fullName, String email, Role role) {
        this.accessToken = accessToken;
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
    }
}
