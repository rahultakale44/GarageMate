package com.garagemate.api.domain.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterUserRequest {
    @NotBlank @Size(min = 2, max = 100)
    private String name;

    @NotBlank @Email
    private String email;

    @Pattern(regexp = "^\\d{10}$", message = "Mobile must be exactly 10 digits")
    private String mobile;

    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
