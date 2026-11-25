package com.garagemate.api.domain.request;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garagemate.api.config.TestSecurityConfig;
import com.garagemate.api.domain.request.dto.*;
import com.garagemate.api.domain.user.UserRole;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = RequestController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@Import(TestSecurityConfig.class)
@DisplayName("RequestController (web layer)")
class RequestControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean  RequestService requestService;

    private RequestDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDto = RequestDto.builder()
                ._id("100")
                .status(RequestStatus.DRAFT)
                .issueCategory(IssueCategory.TYRE_PUNCTURE)
                .issueDescription("Flat tyre")
                .latitude(new BigDecimal("12.9716"))
                .longitude(new BigDecimal("77.5946"))
                .address("Test Location")
                .urgency(Urgency.MEDIUM)
                .bookingFee(new BigDecimal("99.00"))
                .issueImages(List.of())
                .statusHistory(List.of())
                .build();
    }

    // ── POST /api/requests ────────────────────────────────────────────────────

    @Test @DisplayName("POST /api/requests → 201 for USER")
    void createRequest() throws Exception {
        setUserPrincipal();
        given(requestService.createRequest(eq(1L), any(CreateRequestRequest.class)))
                .willReturn(sampleDto);

        String body = objectMapper.writeValueAsString(new CreateRequestRequest(
                "10", IssueCategory.TYRE_PUNCTURE, "Flat tyre on highway",
                null, new BigDecimal("12.9716"), new BigDecimal("77.5946"),
                "Test Location", null, null, null, null, null, Urgency.MEDIUM
        ));

        mockMvc.perform(post("/api/requests")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data._id").value("100"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.bookingFee").value(99.0));
    }

    @Test @DisplayName("POST /api/requests → 403 for GARAGE_OWNER")
    void createRequestWrongRole() throws Exception {
        setOwnerPrincipal();
        // Send a valid body — authorization check fires after binding
        String body = objectMapper.writeValueAsString(new CreateRequestRequest(
                "10", IssueCategory.TYRE_PUNCTURE, "Flat tyre on highway",
                null, new BigDecimal("12.9716"), new BigDecimal("77.5946"),
                "Test Location", null, null, null, null, null, Urgency.MEDIUM
        ));
        mockMvc.perform(post("/api/requests")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
    }

    @Test @DisplayName("POST /api/requests → 422 when vehicleId missing")
    void createRequestMissingVehicle() throws Exception {
        setUserPrincipal();
        mockMvc.perform(post("/api/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"issueDescription\":\"desc 1234\",\"latitude\":12,\"longitude\":77,\"address\":\"addr\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test @DisplayName("POST /api/requests → 422 when issueDescription too short")
    void createRequestShortDescription() throws Exception {
        setUserPrincipal();
        mockMvc.perform(post("/api/requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"vehicleId\":\"10\",\"issueCategory\":\"TYRE_PUNCTURE\"," +
                                "\"issueDescription\":\"short\"," +
                                "\"latitude\":12.9,\"longitude\":77.5,\"address\":\"addr 1234\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── GET /api/requests/my ──────────────────────────────────────────────────

    @Test @DisplayName("GET /api/requests/my → 200 for USER")
    void getMyRequests() throws Exception {
        setUserPrincipal();
        given(requestService.getMyRequests(1L, null)).willReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/requests/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0]._id").value("100"));
    }

    @Test @DisplayName("GET /api/requests/my → 403 for GARAGE_OWNER")
    void getMyRequestsWrongRole() throws Exception {
        setOwnerPrincipal();
        mockMvc.perform(get("/api/requests/my"))
                .andExpect(status().isForbidden());
    }

    // ── GET /api/requests/garage ──────────────────────────────────────────────

    @Test @DisplayName("GET /api/requests/garage → 200 for GARAGE_OWNER")
    void getGarageRequests() throws Exception {
        setOwnerPrincipal();
        given(requestService.getGarageRequests(2L, null)).willReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/requests/garage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0]._id").value("100"));
    }

    // ── GET /api/requests/:id ─────────────────────────────────────────────────

    @Test @DisplayName("GET /api/requests/100 → 200 for owner")
    void getRequest() throws Exception {
        setUserPrincipal();
        given(requestService.getRequest(100L, 1L, "USER")).willReturn(sampleDto);

        mockMvc.perform(get("/api/requests/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data._id").value("100"));
    }

    @Test @DisplayName("GET /api/requests/100 → 403 when access denied")
    void getRequestAccessDenied() throws Exception {
        setUserPrincipal();
        given(requestService.getRequest(100L, 1L, "USER"))
                .willThrow(ApiException.forbidden("Access denied"));

        mockMvc.perform(get("/api/requests/100"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/requests/:id/accept ─────────────────────────────────────────

    @Test @DisplayName("POST /api/requests/100/accept → 200 for GARAGE_OWNER")
    void acceptRequest() throws Exception {
        setOwnerPrincipal();
        RequestDto accepted = RequestDto.builder()._id("100")
                .status(RequestStatus.GARAGE_ACCEPTED).bookingFee(new BigDecimal("99"))
                .issueCategory(IssueCategory.TYRE_PUNCTURE).issueDescription("x")
                .latitude(BigDecimal.ONE).longitude(BigDecimal.ONE).address("a")
                .urgency(Urgency.MEDIUM).issueImages(List.of()).statusHistory(List.of()).build();
        given(requestService.acceptRequest(100L, 2L)).willReturn(accepted);

        mockMvc.perform(post("/api/requests/100/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("GARAGE_ACCEPTED"));
    }

    @Test @DisplayName("POST /api/requests/100/accept → 403 for USER")
    void acceptRequestWrongRole() throws Exception {
        setUserPrincipal();
        mockMvc.perform(post("/api/requests/100/accept"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/requests/:id/reject ─────────────────────────────────────────

    @Test @DisplayName("POST /api/requests/100/reject → 200 for GARAGE_OWNER")
    void rejectRequest() throws Exception {
        setOwnerPrincipal();
        doNothing().when(requestService).rejectRequest(100L, 2L);

        mockMvc.perform(post("/api/requests/100/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ── POST /api/requests/:id/assign-mechanic ────────────────────────────────

    @Test @DisplayName("POST /api/requests/100/assign-mechanic → 200")
    void assignMechanic() throws Exception {
        setOwnerPrincipal();
        given(requestService.assignMechanic(eq(100L), eq(2L), any(AssignMechanicRequest.class)))
                .willReturn(sampleDto);

        mockMvc.perform(post("/api/requests/100/assign-mechanic")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mechanicId\":\"30\"}"))
                .andExpect(status().isOk());
    }

    @Test @DisplayName("POST /api/requests/100/assign-mechanic → 422 when mechanicId missing")
    void assignMechanicMissingId() throws Exception {
        setOwnerPrincipal();
        mockMvc.perform(post("/api/requests/100/assign-mechanic")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── PATCH /api/requests/:id/eta ───────────────────────────────────────────

    @Test @DisplayName("PATCH /api/requests/100/eta → 200")
    void updateEta() throws Exception {
        setOwnerPrincipal();
        given(requestService.updateEta(eq(100L), eq(2L), any(UpdateEtaRequest.class)))
                .willReturn(Map.of("estimatedArrivalMinutes", 30));

        mockMvc.perform(patch("/api/requests/100/eta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estimatedArrivalMinutes\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estimatedArrivalMinutes").value(30));
    }

    @Test @DisplayName("PATCH /api/requests/100/eta → 422 when ETA out of range")
    void updateEtaOutOfRange() throws Exception {
        setOwnerPrincipal();
        mockMvc.perform(patch("/api/requests/100/eta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estimatedArrivalMinutes\":200}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── POST /api/requests/:id/generate-otp ──────────────────────────────────

    @Test @DisplayName("POST /api/requests/100/generate-otp → 200")
    void generateOtp() throws Exception {
        setOwnerPrincipal();
        given(requestService.generateOtp(100L, 2L)).willReturn(Map.of("otp", "123456"));

        mockMvc.perform(post("/api/requests/100/generate-otp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.otp").value("123456"));
    }

    // ── PATCH /api/requests/:id/status ───────────────────────────────────────

    @Test @DisplayName("PATCH /api/requests/100/status → 200 for GARAGE_OWNER")
    void updateStatus() throws Exception {
        setOwnerPrincipal();
        given(requestService.updateStatus(eq(100L), eq(2L), eq("GARAGE_OWNER"),
                any(UpdateStatusRequest.class))).willReturn(sampleDto);

        mockMvc.perform(patch("/api/requests/100/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PAYMENT_PENDING\"}"))
                .andExpect(status().isOk());
    }

    @Test @DisplayName("PATCH /api/requests/100/status → 403 for USER")
    void updateStatusWrongRole() throws Exception {
        setUserPrincipal();
        mockMvc.perform(patch("/api/requests/100/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PAYMENT_PENDING\"}"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/requests/:id/cancel ─────────────────────────────────────────

    @Test @DisplayName("POST /api/requests/100/cancel → 200 for USER")
    void cancelRequest() throws Exception {
        setUserPrincipal();
        doNothing().when(requestService).cancelRequest(eq(100L), eq(1L), any());

        mockMvc.perform(post("/api/requests/100/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Changed mind\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test @DisplayName("POST /api/requests/100/cancel → 400 on invalid transition")
    void cancelRequestInvalidTransition() throws Exception {
        setUserPrincipal();
        doThrow(ApiException.badRequest("Cannot cancel this request"))
                .when(requestService).cancelRequest(eq(100L), eq(1L), any());

        mockMvc.perform(post("/api/requests/100/cancel")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/requests/:id/verify-otp ────────────────────────────────────

    @Test @DisplayName("POST /api/requests/100/verify-otp → 200 for USER")
    void verifyOtp() throws Exception {
        setUserPrincipal();
        given(requestService.verifyOtp(eq(100L), eq(1L), any(VerifyOtpRequest.class)))
                .willReturn(sampleDto);

        mockMvc.perform(post("/api/requests/100/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"otp\":\"123456\"}"))
                .andExpect(status().isOk());
    }

    @Test @DisplayName("POST /api/requests/100/verify-otp → 422 for wrong OTP length")
    void verifyOtpWrongLength() throws Exception {
        setUserPrincipal();
        mockMvc.perform(post("/api/requests/100/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"otp\":\"123\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setUserPrincipal() {
        UserPrincipal p = UserPrincipal.builder()
                .userId(1L).email("alice@test.com").role(UserRole.USER).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    private void setOwnerPrincipal() {
        UserPrincipal p = UserPrincipal.builder()
                .userId(2L).email("owner@test.com").role(UserRole.GARAGE_OWNER).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(p, null,
                        List.of(new SimpleGrantedAuthority("ROLE_GARAGE_OWNER"))));
    }
}
