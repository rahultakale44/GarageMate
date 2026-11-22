package com.garagemate.api.domain.auth.dto;

import com.garagemate.api.domain.vehicle.VehicleType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RegisterGarageRequest {
    @NotBlank @Size(min = 2)
    private String ownerName;

    @NotBlank @Email
    private String ownerEmail;

    @Pattern(regexp = "^\\d{10}$", message = "Owner phone must be 10 digits")
    private String ownerPhone;

    @NotBlank @Size(min = 8)
    private String password;

    @NotBlank @Size(min = 2)
    private String garageName;

    @Pattern(regexp = "^\\d{10}$", message = "Garage phone must be 10 digits")
    private String garagePhone;

    @NotBlank @Size(min = 10)
    private String address;

    @NotBlank @Size(min = 2)
    private String city;

    @NotBlank @Size(min = 2)
    private String state;

    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits")
    private String pincode;

    @NotNull @DecimalMin("-90") @DecimalMax("90")
    private BigDecimal latitude;

    @NotNull @DecimalMin("-180") @DecimalMax("180")
    private BigDecimal longitude;

    @Min(1) @Max(100)
    private Integer serviceRadius = 10;

    @NotEmpty
    private List<String> services;

    private String openingTime;
    private String closingTime;
    private String weeklyOff;
    private Boolean is24x7 = false;
    private Integer numberOfMechanics = 1;

    @NotEmpty
    private List<VehicleType> supportedVehicleTypes;
}
