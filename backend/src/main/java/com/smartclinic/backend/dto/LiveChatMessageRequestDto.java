package com.smartclinic.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LiveChatMessageRequestDto {

    @NotBlank
    @Size(max = 1000)
    private String content;
}
