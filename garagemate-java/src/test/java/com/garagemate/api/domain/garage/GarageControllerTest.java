package com.garagemate.api.domain.garage;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garagemate.api.config.TestSecurityConfig;
import com.garagemate.api.domain.garage.dto.*;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.VehicleType;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.integration.nominatim.GeocodeResult;
import com.garagemate.api.integration.nominatim.NominatimService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = GarageController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@Import(TestSecurityConfig.class)
@DisplayName("GarageController (web layer)")
class GarageControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean GarageService garageService;
    @MockBean NominatimService nominatimService;

    private GarageDto sampleGarage;

    @BeforeEach
    void setUp() {
        sampleGarage = buildDto("10");
    }

    // ── GET /api/garages ──────────────────────────────────────────────────────

    @Test @DisplayName("GET /api/garages → 200 with paginated list")
    void listGarages() throws Exception {
        given(garageService.listGarages(any(), any(), any(), eq(1), eq(20)))
                .willReturn(Map.of("data", List.of(sampleGarage),
                        "pagination", Map.of("page", 1, "total", 1)));

        mockMvc.perform(get("/api/garages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data[0]._id").value("10"));
    }

    // ── GET /api/garages/:id ──────────────────────────────────────────────────

    @Test @DisplayName("GET /api/garages/10 → 200")
    void getGarage() throws Exception {
        given(garageService.getGarage(10L)).willReturn(sampleGarage);

        mockMvc.perform(get("/api/garages/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data._id").value("10"))
                .andExpect(jsonPath("$.data.name").value("Test Garage"));
    }

    @Test @DisplayName("GET /api/garages/999 → 404")
    void getGarageNotFound() throws Exception {
        given(garageService.getGarage(999L)).willThrow(ApiException.notFound("Garage not found"));

        mockMvc.perform(get("/api/garages/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── GET /api/garages/nearby ───────────────────────────────────────────────

    @Test @DisplayName("GET /api/garages/nearby → 200 with distance")
    void searchNearby() throws Exception {
        GarageDto withDistance = GarageDto.builder()
                ._id("10").name("Test Garage")
                .phone("9876543210").address("123 St").city("Bangalore")
                .state("KA").pincode("560001")
                .location(GarageDto.LocationDto.builder()
                        .coordinates(new double[]{77.5946, 12.9716}).build())
                .distance(2.5).distanceInMeters(2500).isOpen(true)
                .services(List.of("Car Repair")).supportedVehicleTypes(List.of(VehicleType.CAR))
                .images(new ArrayList<>()).rating(BigDecimal.ZERO).reviewCount(0)
                .isAvailable(true).visitingCharge(new BigDecimal("99.00"))
                .verificationStatus(VerificationStatus.APPROVED)
                .build();

        given(garageService.searchNearby(any(NearbySearchParams.class)))
                .willReturn(List.of(withDistance));

        mockMvc.perform(get("/api/garages/nearby")
                        .param("latitude", "12.9716")
                        .param("longitude", "77.5946")
                        .param("radius", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0]._id").value("10"))
                .andExpect(jsonPath("$.data[0].distance").value(2.5))
                .andExpect(jsonPath("$.data[0].isOpen").value(true))
                .andExpect(jsonPath("$.data[0].location.coordinates[0]").value(77.5946));
    }

    @Test @DisplayName("GET /api/garages/nearby → 400 without lat/lng")
    void searchNearbyMissingParams() throws Exception {
        mockMvc.perform(get("/api/garages/nearby"))
                .andExpect(status().isBadRequest());
    }

    // ── GET /api/garages/reverse-geocode ─────────────────────────────────────

    @Test @DisplayName("GET /api/garages/reverse-geocode → 200")
    void reverseGeocode() throws Exception {
        given(nominatimService.reverseGeocode(12.9716, 77.5946))
                .willReturn(GeocodeResult.builder()
                        .displayName("Bangalore, Karnataka").city("Bangalore")
                        .latitude(12.9716).longitude(77.5946).address("Bangalore").build());

        mockMvc.perform(get("/api/garages/reverse-geocode")
                        .param("latitude", "12.9716")
                        .param("longitude", "77.5946"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.city").value("Bangalore"));
    }

    // ── Owner endpoints ───────────────────────────────────────────────────────

    @Test @DisplayName("GET /api/garages/my/profile → 200 for GARAGE_OWNER")
    void getMyGarage() throws Exception {
        setOwnerPrincipal();
        given(garageService.getMyGarage(1L)).willReturn(sampleGarage);

        mockMvc.perform(get("/api/garages/my/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data._id").value("10"));
    }

    @Test @DisplayName("PATCH /api/garages/my/profile → 200")
    void updateGarage() throws Exception {
        setOwnerPrincipal();
        given(garageService.updateGarage(eq(1L), any(UpdateGarageRequest.class)))
                .willReturn(sampleGarage);

        mockMvc.perform(patch("/api/garages/my/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test @DisplayName("PATCH /api/garages/my/availability → 200")
    void toggleAvailability() throws Exception {
        setOwnerPrincipal();
        given(garageService.toggleAvailability(1L, false))
                .willReturn(Map.of("isAvailable", false));

        mockMvc.perform(patch("/api/garages/my/availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isAvailable\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isAvailable").value(false));
    }

    @Test @DisplayName("POST /api/garages/my/images → 200")
    void addImages() throws Exception {
        setOwnerPrincipal();
        given(garageService.addImages(eq(1L), any(AddImagesRequest.class)))
                .willReturn(List.of(GarageImageDto.builder()
                        .url("https://res.cloudinary.com/test/img.jpg")
                        .publicId("garagemate/garages/img").type("gallery").build()));

        String body = objectMapper.writeValueAsString(new AddImagesRequest(List.of(
                new AddImagesRequest.ImageEntry(
                        "https://res.cloudinary.com/test/img.jpg",
                        "garagemate/garages/img", "gallery"))));

        mockMvc.perform(post("/api/garages/my/images")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].url").value("https://res.cloudinary.com/test/img.jpg"));
    }

    @Test @DisplayName("PATCH /api/garages/my/profile → 403 for USER role")
    void updateGarageWrongRole() throws Exception {
        setUserPrincipal();

        mockMvc.perform(patch("/api/garages/my/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hack\"}"))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("POST /api/garages/my/images → 422 when images empty")
    void addImagesEmpty() throws Exception {
        setOwnerPrincipal();

        mockMvc.perform(post("/api/garages/my/images")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"images\":[]}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setOwnerPrincipal() {
        UserPrincipal p = UserPrincipal.builder().userId(1L)
                .email("owner@test.com").role(UserRole.GARAGE_OWNER).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null,
                        List.of(new SimpleGrantedAuthority("ROLE_GARAGE_OWNER"))));
    }

    private void setUserPrincipal() {
        UserPrincipal p = UserPrincipal.builder().userId(2L)
                .email("user@test.com").role(UserRole.USER).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    private GarageDto buildDto(String id) {
        return GarageDto.builder()
                ._id(id).name("Test Garage").phone("9876543210")
                .address("123 Street").city("Bangalore").state("KA").pincode("560001")
                .location(GarageDto.LocationDto.builder()
                        .coordinates(new double[]{77.5946, 12.9716}).build())
                .services(List.of("Car Repair"))
                .supportedVehicleTypes(List.of(VehicleType.CAR))
                .images(new ArrayList<>())
                .rating(BigDecimal.ZERO).reviewCount(0)
                .isAvailable(true).visitingCharge(new BigDecimal("99.00"))
                .verificationStatus(VerificationStatus.APPROVED)
                .build();
    }
}
