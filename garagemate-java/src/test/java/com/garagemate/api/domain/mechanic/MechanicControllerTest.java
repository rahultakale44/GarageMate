package com.garagemate.api.domain.mechanic;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garagemate.api.config.TestSecurityConfig;
import com.garagemate.api.domain.mechanic.dto.*;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.VehicleType;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.security.JwtAuthenticationFilter;
import com.garagemate.api.security.UserPrincipal;
import org.junit.jupiter.api.*;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = MechanicController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@Import(TestSecurityConfig.class)
@DisplayName("MechanicController (web layer)")
class MechanicControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean MechanicService mechanicService;

    private MechanicDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDto = buildDto("100", "10");
        setOwnerPrincipal();
    }

    // ── GET /api/mechanics ────────────────────────────────────────────────────

    @Test @DisplayName("GET /api/mechanics → 200 with list")
    void listMechanics() throws Exception {
        given(mechanicService.listMechanics(1L)).willReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/mechanics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0]._id").value("100"))
                .andExpect(jsonPath("$.data[0].garageId").value("10"))
                .andExpect(jsonPath("$.data[0].name").value("Ali"))
                .andExpect(jsonPath("$.data[0].status").value("AVAILABLE"));
    }

    @Test @DisplayName("GET /api/mechanics → 403 for USER role")
    void listMechanicsWrongRole() throws Exception {
        setUserPrincipal();

        mockMvc.perform(get("/api/mechanics"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/mechanics ───────────────────────────────────────────────────

    @Test @DisplayName("POST /api/mechanics → 201 with created mechanic")
    void createMechanic() throws Exception {
        given(mechanicService.createMechanic(eq(1L), any(CreateMechanicRequest.class)))
                .willReturn(sampleDto);

        CreateMechanicRequest req = new CreateMechanicRequest(
                "Ali", "9876543210", null, List.of("Engine Repair"), null, 5);

        mockMvc.perform(post("/api/mechanics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mechanic added successfully"))
                .andExpect(jsonPath("$.data._id").value("100"));
    }

    @Test @DisplayName("POST /api/mechanics → 422 when name missing")
    void createMechanicValidationFail() throws Exception {
        mockMvc.perform(post("/api/mechanics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9876543210\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test @DisplayName("POST /api/mechanics → 422 when phone format invalid")
    void createMechanicInvalidPhone() throws Exception {
        mockMvc.perform(post("/api/mechanics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ali\",\"phone\":\"123\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── GET /api/mechanics/:id ────────────────────────────────────────────────

    @Test @DisplayName("GET /api/mechanics/100 → 200 for owner")
    void getMechanic() throws Exception {
        given(mechanicService.getMechanic(100L, 1L)).willReturn(sampleDto);

        mockMvc.perform(get("/api/mechanics/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data._id").value("100"))
                .andExpect(jsonPath("$.data.skills[0]").value("Engine Repair"));
    }

    @Test @DisplayName("GET /api/mechanics/100 → 404 for mechanic in another garage")
    void getMechanicOwnershipIsolation() throws Exception {
        given(mechanicService.getMechanic(100L, 1L))
                .willThrow(ApiException.notFound("Mechanic not found"));

        mockMvc.perform(get("/api/mechanics/100"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── PATCH /api/mechanics/:id/location (must match before /:id) ────────────

    @Test @DisplayName("PATCH /api/mechanics/100/location → 200 with location")
    void updateLocation() throws Exception {
        MechanicDto.LocationDto loc = MechanicDto.LocationDto.builder()
                .coordinates(new double[]{77.5946, 12.9716}).build();
        given(mechanicService.updateLocation(eq(100L), eq(1L), any(UpdateLocationRequest.class)))
                .willReturn(loc);

        mockMvc.perform(patch("/api/mechanics/100/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"latitude\":12.9716,\"longitude\":77.5946}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.type").value("Point"))
                .andExpect(jsonPath("$.data.coordinates[0]").value(77.5946))
                .andExpect(jsonPath("$.data.coordinates[1]").value(12.9716));
    }

    @Test @DisplayName("PATCH /api/mechanics/100/location → 422 when latitude missing")
    void updateLocationMissingLatitude() throws Exception {
        mockMvc.perform(patch("/api/mechanics/100/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"longitude\":77.5946}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test @DisplayName("PATCH /api/mechanics/100/location → 422 when latitude out of range")
    void updateLocationInvalidLatitude() throws Exception {
        mockMvc.perform(patch("/api/mechanics/100/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"latitude\":91.0,\"longitude\":77.5946}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test @DisplayName("PATCH /api/mechanics/100/location → 422 when longitude out of range")
    void updateLocationInvalidLongitude() throws Exception {
        mockMvc.perform(patch("/api/mechanics/100/location")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"latitude\":12.9716,\"longitude\":181.0}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── PATCH /api/mechanics/:id ──────────────────────────────────────────────

    @Test @DisplayName("PATCH /api/mechanics/100 → 200 with updated mechanic")
    void updateMechanic() throws Exception {
        MechanicDto updated = buildDto("100", "10");
        given(mechanicService.updateMechanic(eq(100L), eq(1L), any(UpdateMechanicRequest.class)))
                .willReturn(updated);

        mockMvc.perform(patch("/api/mechanics/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ali Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mechanic updated successfully"));
    }

    // ── DELETE /api/mechanics/:id ─────────────────────────────────────────────

    @Test @DisplayName("DELETE /api/mechanics/100 → 200 on success")
    void deleteMechanic() throws Exception {
        doNothing().when(mechanicService).deleteMechanic(100L, 1L);

        mockMvc.perform(delete("/api/mechanics/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Mechanic deleted successfully"));
    }

    @Test @DisplayName("DELETE /api/mechanics/100 → 404 when not found")
    void deleteMechanicNotFound() throws Exception {
        doThrow(ApiException.notFound("Mechanic not found"))
                .when(mechanicService).deleteMechanic(100L, 1L);

        mockMvc.perform(delete("/api/mechanics/100"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── Unauthenticated access ────────────────────────────────────────────────

    @Test @DisplayName("Any mechanic endpoint → 403 when unauthenticated")
    void unauthenticatedAccess() throws Exception {
        // Clear security context (no principal)
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/mechanics"))
                .andExpect(status().isForbidden());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setOwnerPrincipal() {
        UserPrincipal p = UserPrincipal.builder()
                .userId(1L).email("owner@test.com").role(UserRole.GARAGE_OWNER).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null,
                        List.of(new SimpleGrantedAuthority("ROLE_GARAGE_OWNER"))));
    }

    private void setUserPrincipal() {
        UserPrincipal p = UserPrincipal.builder()
                .userId(2L).email("user@test.com").role(UserRole.USER).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    private MechanicDto buildDto(String id, String garageId) {
        return MechanicDto.builder()
                ._id(id).garageId(garageId)
                .name("Ali").phone("9876543210")
                .skills(List.of("Engine Repair"))
                .vehicleExpertise(List.of(VehicleType.CAR))
                .experience(5)
                .status(MechanicStatus.AVAILABLE)
                .build();
    }
}
