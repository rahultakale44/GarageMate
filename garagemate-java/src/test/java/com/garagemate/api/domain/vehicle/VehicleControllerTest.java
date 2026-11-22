package com.garagemate.api.domain.vehicle;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garagemate.api.config.TestSecurityConfig;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.dto.CreateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.UpdateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.VehicleDto;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.security.JwtAuthenticationFilter;
import com.garagemate.api.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = VehicleController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@Import(TestSecurityConfig.class)
@DisplayName("VehicleController (web layer)")
class VehicleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean VehicleService vehicleService;

    private VehicleDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDto = VehicleDto.builder()
                .id("10")
                .userId("1")
                .vehicleType(VehicleType.CAR)
                .brand("Toyota")
                .vehicleModel("Corolla")
                .registrationNumber("MH12AB1234")
                .fuelType("Petrol")
                .manufacturingYear(2020)
                .build();

        UserPrincipal principal = UserPrincipal.builder()
                .userId(1L)
                .email("alice@example.com")
                .role(UserRole.USER)
                .build();
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // ── GET /api/vehicles ─────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/vehicles → 200 with list")
    void listVehicles() throws Exception {
        given(vehicleService.listVehicles(1L)).willReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value("10"))
                .andExpect(jsonPath("$.data[0].brand").value("Toyota"))
                .andExpect(jsonPath("$.data[0].userId").value("1"));
    }

    // ── POST /api/vehicles ────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/vehicles → 201 with created vehicle")
    void createVehicle() throws Exception {
        given(vehicleService.createVehicle(eq(1L), any(CreateVehicleRequest.class)))
                .willReturn(sampleDto);

        CreateVehicleRequest req = new CreateVehicleRequest(
                VehicleType.CAR, "Toyota", "Corolla",
                "MH12AB1234", "Petrol", 2020, null, null);

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Vehicle added successfully"))
                .andExpect(jsonPath("$.data.id").value("10"));
    }

    @Test
    @DisplayName("POST /api/vehicles → 422 when required fields missing")
    void createVehicle_validationFailure() throws Exception {
        // Missing required fields
        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── GET /api/vehicles/:id ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/vehicles/10 → 200 for owner")
    void getVehicle() throws Exception {
        given(vehicleService.getVehicle(10L, 1L)).willReturn(sampleDto);

        mockMvc.perform(get("/api/vehicles/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("10"))
                .andExpect(jsonPath("$.data.registrationNumber").value("MH12AB1234"));
    }

    @Test
    @DisplayName("GET /api/vehicles/10 → 404 for other user (ownership isolation)")
    void getVehicle_otherUser() throws Exception {
        given(vehicleService.getVehicle(10L, 1L))
                .willThrow(ApiException.notFound("Vehicle not found"));

        mockMvc.perform(get("/api/vehicles/10"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── PATCH /api/vehicles/:id ───────────────────────────────────────────────

    @Test
    @DisplayName("PATCH /api/vehicles/10 → 200 with updated vehicle")
    void updateVehicle() throws Exception {
        VehicleDto updated = VehicleDto.builder().id("10").userId("1")
                .vehicleType(VehicleType.CAR).brand("Honda").vehicleModel("Corolla")
                .registrationNumber("MH12AB1234").fuelType("Petrol").manufacturingYear(2020)
                .build();
        given(vehicleService.updateVehicle(eq(10L), eq(1L), any(UpdateVehicleRequest.class)))
                .willReturn(updated);

        mockMvc.perform(patch("/api/vehicles/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"brand\":\"Honda\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Vehicle updated successfully"))
                .andExpect(jsonPath("$.data.brand").value("Honda"));
    }

    // ── DELETE /api/vehicles/:id ──────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/vehicles/10 → 200 on success")
    void deleteVehicle() throws Exception {
        doNothing().when(vehicleService).deleteVehicle(10L, 1L);

        mockMvc.perform(delete("/api/vehicles/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Vehicle deleted successfully"));
    }

    @Test
    @DisplayName("DELETE /api/vehicles/10 → 404 for other user")
    void deleteVehicle_notOwner() throws Exception {
        doThrow(ApiException.notFound("Vehicle not found"))
                .when(vehicleService).deleteVehicle(10L, 1L);

        mockMvc.perform(delete("/api/vehicles/10"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
