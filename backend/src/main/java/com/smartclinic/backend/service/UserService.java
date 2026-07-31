package com.smartclinic.backend.service;

import com.smartclinic.backend.dto.UserDto;

import java.util.List;

public interface UserService {
    List<UserDto> getAllUsers();
    UserDto createUser(UserDto userDto);
    UserDto updateUser(Long id, UserDto userDto);
    void lockUser(Long id);
}
