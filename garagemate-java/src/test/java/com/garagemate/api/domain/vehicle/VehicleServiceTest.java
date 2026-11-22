package com.garagemate.api.domain.vehicle;

import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.dto.CreateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.UpdateVehicleRequest;
import com.garagemate.api.domain.vehicle.dto.VehicleDto;
import com.garagemate.api.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("VehicleService")
class VehicleServiceTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private VehicleService vehicleService;

    private User owner;
    private Vehicle sampleVehicle;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .role(UserRole.USER)
                .build();

        sampleVehicle = Vehicle.builder()
                .id(10L)
                .user(owner)
                .vehicleType(VehicleType.CAR)
                .brand("Toyota")
                .vehicleModel("Corolla")
                .registrationNumber("MH12AB1234")
                .fuelType("Petrol")
                .manufacturingYear(2020)
                .build();
    }

    // ── listVehicles ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listVehicles")
    class ListVehicles {

        @Test
        @DisplayName("returns vehicles for the authenticated user")
        void returnsUserVehicles() {
            given(vehicleRepository.findByUserIdOrderByCreatedAtDesc(1L))
                    .willReturn(List.of(sampleVehicle));

            List<VehicleDto> result = vehicleService.listVehicles(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo("10");
            assertThat(result.get(0).getUserId()).isEqualTo("1");
            assertThat(result.get(0).getBrand()).isEqualTo("Toyota");
        }

        @Test
        @DisplayName("returns empty list when user has no vehicles")
        void returnsEmpty() {
            given(vehicleRepository.findByUserIdOrderByCreatedAtDesc(1L))
                    .willReturn(List.of());

            List<VehicleDto> result = vehicleService.listVehicles(1L);
            assertThat(result).isEmpty();
        }
    }

    // ── getVehicle ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getVehicle")
    class GetVehicle {

        @Test
        @DisplayName("returns vehicle when owner requests it")
        void returnsOwnedVehicle() {
            given(vehicleRepository.findByIdAndUserId(10L, 1L))
                    .willReturn(Optional.of(sampleVehicle));

            VehicleDto dto = vehicleService.getVehicle(10L, 1L);
            assertThat(dto.getId()).isEqualTo("10");
            assertThat(dto.getBrand()).isEqualTo("Toyota");
        }

        @Test
        @DisplayName("returns 404 when vehicle belongs to another user (ownership isolation)")
        void deniesOtherUser() {
            // userId=2 tries to access vehicleId=10 that belongs to userId=1
            given(vehicleRepository.findByIdAndUserId(10L, 2L))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.getVehicle(10L, 2L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Vehicle not found");
        }
    }

    // ── createVehicle ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createVehicle")
    class CreateVehicle {

        @Test
        @DisplayName("persists vehicle with uppercase registration number")
        void createsWithUppercaseReg() {
            given(userRepository.findById(1L)).willReturn(Optional.of(owner));
            given(vehicleRepository.save(any(Vehicle.class)))
                    .willAnswer(inv -> {
                        Vehicle v = inv.getArgument(0);
                        // Simulate DB-assigned ID
                        Vehicle saved = Vehicle.builder()
                                .id(10L)
                                .user(v.getUser())
                                .vehicleType(v.getVehicleType())
                                .brand(v.getBrand())
                                .vehicleModel(v.getVehicleModel())
                                .registrationNumber(v.getRegistrationNumber())
                                .fuelType(v.getFuelType())
                                .manufacturingYear(v.getManufacturingYear())
                                .image(v.getImage())
                                .notes(v.getNotes())
                                .build();
                        return saved;
                    });

            CreateVehicleRequest req = new CreateVehicleRequest(
                    VehicleType.CAR, "Toyota", "Corolla",
                    "mh12ab1234",   // lowercase — should be uppercased
                    "Petrol", 2020, null, null
            );

            VehicleDto dto = vehicleService.createVehicle(1L, req);

            assertThat(dto.getId()).isEqualTo("10");
            assertThat(dto.getRegistrationNumber()).isEqualTo("MH12AB1234");
            assertThat(dto.getUserId()).isEqualTo("1");
        }

        @Test
        @DisplayName("throws 404 when creating vehicle for unknown user")
        void throwsForUnknownUser() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.createVehicle(99L,
                    new CreateVehicleRequest(VehicleType.CAR, "Toyota", "Corolla",
                            "MH12AB1234", "Petrol", 2020, null, null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // ── updateVehicle ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateVehicle")
    class UpdateVehicle {

        @Test
        @DisplayName("updates only provided fields (partial update)")
        void partialUpdate() {
            given(vehicleRepository.findByIdAndUserId(10L, 1L))
                    .willReturn(Optional.of(sampleVehicle));
            given(vehicleRepository.save(any(Vehicle.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            UpdateVehicleRequest req = new UpdateVehicleRequest(
                    null, "Honda", null, null, null, null, null, null);

            VehicleDto dto = vehicleService.updateVehicle(10L, 1L, req);

            assertThat(dto.getBrand()).isEqualTo("Honda");
            assertThat(dto.getVehicleModel()).isEqualTo("Corolla"); // unchanged
        }

        @Test
        @DisplayName("returns 404 when updating another user's vehicle")
        void deniesOtherUser() {
            given(vehicleRepository.findByIdAndUserId(10L, 2L))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.updateVehicle(10L, 2L,
                    new UpdateVehicleRequest(null, "Honda", null, null, null, null, null, null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Vehicle not found");
        }
    }

    // ── deleteVehicle ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteVehicle")
    class DeleteVehicle {

        @Test
        @DisplayName("deletes owned vehicle")
        void deletesOwnedVehicle() {
            given(vehicleRepository.findByIdAndUserId(10L, 1L))
                    .willReturn(Optional.of(sampleVehicle));

            vehicleService.deleteVehicle(10L, 1L);

            verify(vehicleRepository).delete(sampleVehicle);
        }

        @Test
        @DisplayName("returns 404 when deleting another user's vehicle")
        void deniesOtherUser() {
            given(vehicleRepository.findByIdAndUserId(10L, 2L))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> vehicleService.deleteVehicle(10L, 2L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Vehicle not found");
        }
    }
}
