package com.garagemate.api.domain.request;

import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.garage.GarageRepository;
import com.garagemate.api.domain.garage.VerificationStatus;
import com.garagemate.api.domain.mechanic.Mechanic;
import com.garagemate.api.domain.mechanic.MechanicRepository;
import com.garagemate.api.domain.mechanic.MechanicStatus;
import com.garagemate.api.domain.request.dto.*;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.Vehicle;
import com.garagemate.api.domain.vehicle.VehicleRepository;
import com.garagemate.api.domain.vehicle.VehicleType;
import com.garagemate.api.exception.ApiException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RequestService")
class RequestServiceTest {

    @Mock private AssistanceRequestRepository requestRepository;
    @Mock private VehicleRepository           vehicleRepository;
    @Mock private GarageRepository            garageRepository;
    @Mock private MechanicRepository          mechanicRepository;
    @Mock private UserRepository              userRepository;

    @InjectMocks private RequestService svc;

    private User user;
    private User garageUser;
    private Vehicle vehicle;
    private Garage garage;
    private Mechanic mechanic;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Alice")
                .email("alice@test.com").role(UserRole.USER).build();
        garageUser = User.builder().id(2L).name("Owner")
                .email("owner@test.com").role(UserRole.GARAGE_OWNER).build();

        vehicle = new Vehicle();
        vehicle.setId(10L);
        vehicle.setUser(user);
        vehicle.setVehicleType(VehicleType.CAR);
        vehicle.setBrand("Toyota");
        vehicle.setVehicleModel("Corolla");
        vehicle.setRegistrationNumber("MH12AB1234");
        vehicle.setFuelType("Petrol");
        vehicle.setManufacturingYear(2020);

        garage = new Garage();
        garage.setId(20L);
        garage.setOwner(garageUser);
        garage.setName("Test Garage");
        garage.setPhone("9876543210");
        garage.setAddress("123 Street, Bangalore");
        garage.setLatitude(new BigDecimal("12.9716"));
        garage.setLongitude(new BigDecimal("77.5946"));
        garage.setServiceRadius(10);
        garage.setVerificationStatus(VerificationStatus.APPROVED);
        garage.setRating(BigDecimal.ZERO);
        garage.setReviewCount(0);
        garage.setVisitingCharge(new BigDecimal("99.00"));
        garage.setServices(new ArrayList<>());
        garage.setSupportedVehicleTypes(new ArrayList<>());
        garage.setImages(new ArrayList<>());
        garage.setServicePricing(new ArrayList<>());
        garage.setVerificationHistory(new ArrayList<>());

        mechanic = new Mechanic();
        mechanic.setId(30L);
        mechanic.setGarage(garage);
        mechanic.setName("Bob");
        mechanic.setPhone("9876543210");
        mechanic.setStatus(MechanicStatus.AVAILABLE);
        mechanic.setExperience(3);
        mechanic.setSkills(new ArrayList<>());
        mechanic.setVehicleExpertise(new ArrayList<>());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AssistanceRequest buildRequest(Long id, RequestStatus status) {
        AssistanceRequest r = new AssistanceRequest();
        r.setId(id);
        r.setUser(user);
        r.setVehicle(vehicle);
        r.setGarage(status.name().startsWith("GARAGE") || status == RequestStatus.MECHANIC_ASSIGNED
                || status == RequestStatus.SERVICE_IN_PROGRESS ? garage : null);
        r.setIssueCategory(IssueCategory.TYRE_PUNCTURE);
        r.setIssueDescription("Flat tyre on highway");
        r.setLatitude(new BigDecimal("12.9716"));
        r.setLongitude(new BigDecimal("77.5946"));
        r.setAddress("Test Location");
        r.setStatus(status);
        r.setUrgency(Urgency.MEDIUM);
        r.setBookingFee(new BigDecimal("99.00"));
        r.setIssueImages(new ArrayList<>());
        r.setStatusHistory(new ArrayList<>());
        return r;
    }

    // ── createRequest ─────────────────────────────────────────────────────────

    @Nested @DisplayName("createRequest")
    class CreateRequest {

        @Test @DisplayName("creates DRAFT request with DEFAULT_BOOKING_FEE set server-side")
        void createsDraftWithServerFee() {
            given(vehicleRepository.findByIdAndUserId(10L, 1L)).willReturn(Optional.of(vehicle));
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(requestRepository.save(any())).willAnswer(inv -> {
                AssistanceRequest r = inv.getArgument(0);
                r.setId(100L);
                return r;
            });

            CreateRequestRequest req = new CreateRequestRequest(
                    "10", IssueCategory.TYRE_PUNCTURE, "Flat tyre on highway",
                    null, new BigDecimal("12.9716"), new BigDecimal("77.5946"),
                    "Test Location", null, null, null, null, null, Urgency.MEDIUM
            );

            RequestDto dto = svc.createRequest(1L, req);

            assertThat(dto.get_id()).isEqualTo("100");
            assertThat(dto.getStatus()).isEqualTo(RequestStatus.DRAFT);
            assertThat(dto.getBookingFee()).isEqualByComparingTo("99.00");
            assertThat(dto.getStatusHistory()).hasSize(1);
            assertThat(dto.getStatusHistory().get(0).getStatus()).isEqualTo(RequestStatus.DRAFT);
        }

        @Test @DisplayName("urgency defaults to MEDIUM when not provided")
        void urgencyDefaultsMedium() {
            given(vehicleRepository.findByIdAndUserId(10L, 1L)).willReturn(Optional.of(vehicle));
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(requestRepository.save(any())).willAnswer(inv -> {
                AssistanceRequest r = inv.getArgument(0); r.setId(101L); return r; });

            CreateRequestRequest req = new CreateRequestRequest(
                    "10", IssueCategory.DEAD_BATTERY, "Battery dead",
                    null, new BigDecimal("12.9716"), new BigDecimal("77.5946"),
                    "Test Location", null, null, null, null, null, null // null urgency
            );

            RequestDto dto = svc.createRequest(1L, req);
            assertThat(dto.getUrgency()).isEqualTo(Urgency.MEDIUM);
        }

        @Test @DisplayName("throws 404 when vehicle doesn't belong to user")
        void vehicleOwnershipEnforced() {
            given(vehicleRepository.findByIdAndUserId(10L, 1L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> svc.createRequest(1L,
                    new CreateRequestRequest("10", IssueCategory.TYRE_PUNCTURE, "desc 1234",
                            null, new BigDecimal("12.9716"), new BigDecimal("77.5946"),
                            "Test Location", null, null, null, null, null, null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Vehicle not found");
        }

        @Test @DisplayName("throws 400 when selected garage is not APPROVED")
        void unapprovedGarageRejected() {
            garage.setVerificationStatus(VerificationStatus.PENDING);
            given(vehicleRepository.findByIdAndUserId(10L, 1L)).willReturn(Optional.of(vehicle));
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(garageRepository.findById(20L)).willReturn(Optional.of(garage));

            assertThatThrownBy(() -> svc.createRequest(1L,
                    new CreateRequestRequest("10", IssueCategory.TYRE_PUNCTURE, "desc 1234",
                            null, new BigDecimal("12.9716"), new BigDecimal("77.5946"),
                            "Test Location", null, null, null, null, "20", null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("not approved");
        }
    }

    // ── acceptRequest ─────────────────────────────────────────────────────────

    @Nested @DisplayName("acceptRequest")
    class AcceptRequest {

        @Test @DisplayName("GARAGE_SELECTED → GARAGE_ACCEPTED sets garageId")
        void acceptsGarageSelected() {
            AssistanceRequest request = buildRequest(100L, RequestStatus.GARAGE_SELECTED);
            request.setGarage(null); // no garage yet — to be set on accept

            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findById(100L)).willReturn(Optional.of(request));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            RequestDto dto = svc.acceptRequest(100L, 2L);

            assertThat(dto.getStatus()).isEqualTo(RequestStatus.GARAGE_ACCEPTED);
            assertThat(request.getGarage()).isEqualTo(garage);
        }

        @Test @DisplayName("throws 400 for invalid transition (e.g. DRAFT → GARAGE_ACCEPTED)")
        void invalidTransitionRejected() {
            AssistanceRequest request = buildRequest(100L, RequestStatus.DRAFT);
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findById(100L)).willReturn(Optional.of(request));

            assertThatThrownBy(() -> svc.acceptRequest(100L, 2L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("not available");
        }
    }

    // ── assignMechanic ────────────────────────────────────────────────────────

    @Nested @DisplayName("assignMechanic")
    class AssignMechanic {

        @Test @DisplayName("atomic: request → MECHANIC_ASSIGNED and mechanic → ASSIGNED + currentRequestId")
        void atomicAssignment() {
            AssistanceRequest request = buildRequest(100L, RequestStatus.GARAGE_ACCEPTED);

            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findByIdAndGarageId(100L, 20L)).willReturn(Optional.of(request));
            given(mechanicRepository.findByIdAndGarageId(30L, 20L)).willReturn(Optional.of(mechanic));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
            given(mechanicRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            RequestDto dto = svc.assignMechanic(100L, 2L,
                    new AssignMechanicRequest("30"));

            // Request updated
            assertThat(dto.getStatus()).isEqualTo(RequestStatus.MECHANIC_ASSIGNED);
            assertThat(request.getMechanic()).isEqualTo(mechanic);

            // Mechanic updated — same transaction
            assertThat(mechanic.getStatus()).isEqualTo(MechanicStatus.ASSIGNED);
            assertThat(mechanic.getCurrentRequestId()).isEqualTo(100L);

            verify(requestRepository).save(request);
            verify(mechanicRepository).save(mechanic);
        }

        @Test @DisplayName("throws 400 when mechanic is not AVAILABLE")
        void unavailableMechanicRejected() {
            mechanic.setStatus(MechanicStatus.ASSIGNED);  // already busy
            AssistanceRequest request = buildRequest(100L, RequestStatus.GARAGE_ACCEPTED);

            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findByIdAndGarageId(100L, 20L)).willReturn(Optional.of(request));
            given(mechanicRepository.findByIdAndGarageId(30L, 20L)).willReturn(Optional.of(mechanic));

            assertThatThrownBy(() -> svc.assignMechanic(100L, 2L,
                    new AssignMechanicRequest("30")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("not available");

            // Neither record should be saved
            verify(requestRepository, never()).save(any());
            verify(mechanicRepository, never()).save(any());
        }

        @Test @DisplayName("throws 404 for mechanic from another garage (ownership)")
        void crossGarageMechanicRejected() {
            AssistanceRequest request = buildRequest(100L, RequestStatus.GARAGE_ACCEPTED);
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findByIdAndGarageId(100L, 20L)).willReturn(Optional.of(request));
            given(mechanicRepository.findByIdAndGarageId(30L, 20L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> svc.assignMechanic(100L, 2L,
                    new AssignMechanicRequest("30")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Mechanic not found");
        }
    }

    // ── Status transitions ────────────────────────────────────────────────────

    @Nested @DisplayName("isValidTransition")
    class StatusTransitions {

        @Test @DisplayName("DRAFT → PAYMENT_PENDING is valid")
        void draftToPaymentPending() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
            // For updateStatus, garage must own the request
            r.setGarage(garage);

            RequestDto dto = svc.updateStatus(100L, 2L, "GARAGE_OWNER",
                    new UpdateStatusRequest("PAYMENT_PENDING", null));
            assertThat(dto.getStatus()).isEqualTo(RequestStatus.PAYMENT_PENDING);
        }

        @Test @DisplayName("CLOSED → GARAGE_ACCEPTED is invalid")
        void closedCannotTransition() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.CLOSED);
            r.setGarage(garage);
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));

            assertThatThrownBy(() -> svc.updateStatus(100L, 2L, "GARAGE_OWNER",
                    new UpdateStatusRequest("GARAGE_ACCEPTED", null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Invalid status transition");
        }

        @Test @DisplayName("Invalid status string throws 400")
        void invalidStatusString() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            r.setGarage(garage);
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));

            assertThatThrownBy(() -> svc.updateStatus(100L, 2L, "GARAGE_OWNER",
                    new UpdateStatusRequest("NOT_A_STATUS", null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Invalid status");
        }
    }

    // ── cancelRequest ─────────────────────────────────────────────────────────

    @Nested @DisplayName("cancelRequest")
    class CancelRequest {

        @Test @DisplayName("user can cancel their own DRAFT request")
        void cancelsDraftRequest() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            given(requestRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.of(r));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            svc.cancelRequest(100L, 1L, new CancelRequestBody("Changed mind"));

            assertThat(r.getStatus()).isEqualTo(RequestStatus.CANCELLED);
            assertThat(r.getStatusHistory().get(0).getNotes()).isEqualTo("Changed mind");
        }

        @Test @DisplayName("CLOSED request cannot be cancelled")
        void closedCannotCancel() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.CLOSED);
            given(requestRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.of(r));

            assertThatThrownBy(() -> svc.cancelRequest(100L, 1L, null))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Cannot cancel");
        }

        @Test @DisplayName("throws 404 for another user's request (ownership)")
        void ownershipEnforced() {
            given(requestRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> svc.cancelRequest(100L, 1L, null))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Request not found");
        }
    }

    // ── getRequest ownership ──────────────────────────────────────────────────

    @Nested @DisplayName("getRequest ownership")
    class GetRequestOwnership {

        @Test @DisplayName("user can access their own request")
        void ownerCanAccess() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));

            RequestDto dto = svc.getRequest(100L, 1L, "USER");
            assertThat(dto.get_id()).isEqualTo("100");
        }

        @Test @DisplayName("garage owner can access request assigned to their garage")
        void garageOwnerCanAccess() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.GARAGE_ACCEPTED);
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));

            RequestDto dto = svc.getRequest(100L, 2L, "GARAGE_OWNER");
            assertThat(dto.get_id()).isEqualTo("100");
        }

        @Test @DisplayName("admin can access any request")
        void adminCanAccess() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));

            RequestDto dto = svc.getRequest(100L, 99L, "ADMIN");
            assertThat(dto.get_id()).isEqualTo("100");
        }

        @Test @DisplayName("unrelated user gets 403")
        void unrelatedUserDenied() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            // userId=1 owns it; we request as userId=5
            given(requestRepository.findById(100L)).willReturn(Optional.of(r));
            // No garage stub needed — DRAFT request has no garage, so findByOwnerId is not called

            assertThatThrownBy(() -> svc.getRequest(100L, 5L, "USER"))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Access denied");
        }
    }

    // ── ETA update ────────────────────────────────────────────────────────────

    @Nested @DisplayName("updateEta")
    class UpdateEta {

        @Test @DisplayName("sets estimatedArrivalMinutes and etaSetAt")
        void setsEta() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.GARAGE_ACCEPTED);
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findByIdAndGarageId(100L, 20L)).willReturn(Optional.of(r));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            var result = svc.updateEta(100L, 2L, new UpdateEtaRequest(30));

            assertThat(result.get("estimatedArrivalMinutes")).isEqualTo(30);
            assertThat(r.getEstimatedArrivalMinutes()).isEqualTo(30);
            assertThat(r.getEtaSetAt()).isNotNull();
        }

        @Test @DisplayName("throws 400 when request is not in an ETA-eligible status")
        void wrongStatusRejected() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.DRAFT);
            r.setGarage(garage);
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findByIdAndGarageId(100L, 20L)).willReturn(Optional.of(r));

            assertThatThrownBy(() -> svc.updateEta(100L, 2L, new UpdateEtaRequest(15)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("ETA can only be set");
        }
    }

    // ── OTP ───────────────────────────────────────────────────────────────────

    @Nested @DisplayName("OTP")
    class Otp {

        @Test @DisplayName("generateOtp returns 6-digit OTP and sets expiry")
        void generatesOtp() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.SERVICE_IN_PROGRESS);
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(requestRepository.findByIdAndGarageId(100L, 20L)).willReturn(Optional.of(r));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            var result = svc.generateOtp(100L, 2L);

            assertThat(result.get("otp")).hasSize(6);
            assertThat(r.getOtpExpiresAt()).isAfter(LocalDateTime.now());
        }

        @Test @DisplayName("verifyOtp transitions to SERVICE_COMPLETED and clears OTP")
        void verifiesOtp() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.SERVICE_IN_PROGRESS);
            r.setCompletionOtp("123456");
            r.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
            given(requestRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.of(r));
            given(requestRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            RequestDto dto = svc.verifyOtp(100L, 1L, new VerifyOtpRequest("123456"));

            assertThat(dto.getStatus()).isEqualTo(RequestStatus.SERVICE_COMPLETED);
            assertThat(r.getCompletionOtp()).isNull();
            assertThat(r.getOtpExpiresAt()).isNull();
        }

        @Test @DisplayName("verifyOtp throws 400 for wrong OTP")
        void wrongOtpRejected() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.SERVICE_IN_PROGRESS);
            r.setCompletionOtp("123456");
            r.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
            given(requestRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.of(r));

            assertThatThrownBy(() -> svc.verifyOtp(100L, 1L, new VerifyOtpRequest("999999")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Invalid OTP");
        }

        @Test @DisplayName("verifyOtp throws 400 for expired OTP")
        void expiredOtpRejected() {
            AssistanceRequest r = buildRequest(100L, RequestStatus.SERVICE_IN_PROGRESS);
            r.setCompletionOtp("123456");
            r.setOtpExpiresAt(LocalDateTime.now().minusMinutes(1)); // already expired
            given(requestRepository.findByIdAndUserId(100L, 1L)).willReturn(Optional.of(r));

            assertThatThrownBy(() -> svc.verifyOtp(100L, 1L, new VerifyOtpRequest("123456")))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("OTP expired");
        }
    }
}
