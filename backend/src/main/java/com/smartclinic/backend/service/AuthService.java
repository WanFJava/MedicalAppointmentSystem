package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.LoginDto;
import com.smartclinic.backend.dto.RegisterDto;

public interface AuthService {
    String login(LoginDto loginDto);
    String register(RegisterDto registerDto);
}
