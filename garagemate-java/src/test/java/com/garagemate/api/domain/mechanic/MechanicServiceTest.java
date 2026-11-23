package com.garagemate.api.domain.mechanic;

import com.garagemate.api.domain.garage.Garage;
import com.garagemate.api.domain.garage.GarageRepository;
import com.garagemate.api.domain.mechanic.dto.*;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.VehicleType;
import com.garagemate.api.exception.ApiException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("MechanicService")
class MechanicServiceTest {

    @Mock private MechanicRepository mechanicRepository;
    @Mock private GarageRepository   garageRepository;

    @InjectMocks private MechanicService mechanicService;

    private User    owner;
    private Garage  garage;
    private Mechanic sampleMechanic;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).name("Owner").email("owner@test.com").role(UserRole.GARAGE_OWNER)
                .build();

        garage = new Garage();
        garage.setId(10L);
        garage.setOwner(owner);
        garage.setName("Test Garage");

        sampleMechanic = buildMechanic(100L, garage);
    }

    // ── listMechanics ─────────────────────────────────────────────────────────

    @Nested @DisplayName("listMechanics")
    class ListMechanics {

        @Test @DisplayName("returns mechanics for the owner's garage")
        void returnsMechanics() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByGarageIdOrderByCreatedAtDesc(10L))
                    .willReturn(List.of(sampleMechanic));

            List<MechanicDto> result = mechanicService.listMechanics(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).get_id()).isEqualTo("100"); // BIGINT → String
            assertThat(result.get(0).getGarageId()).isEqualTo("10");
        }

        @Test @DisplayName("returns 404 when owner has no garage")
        void throwsWhenNoGarage() {
            given(garageRepository.findByOwnerId(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> mechanicService.listMechanics(99L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Garage not found");
        }

        @Test @DisplayName("returns empty list when garage has no mechanics")
        void returnsEmpty() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByGarageIdOrderByCreatedAtDesc(10L))
                    .willReturn(List.of());
            assertThat(mechanicService.listMechanics(1L)).isEmpty();
        }
    }

    // ── getMechanic ───────────────────────────────────────────────────────────

    @Nested @DisplayName("getMechanic")
    class GetMechanic {

        @Test @DisplayName("returns mechanic DTO with string IDs")
        void returnsDto() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.of(sampleMechanic));

            MechanicDto dto = mechanicService.getMechanic(100L, 1L);
            assertThat(dto.get_id()).isEqualTo("100");
            assertThat(dto.getName()).isEqualTo("Ali");
        }

        @Test @DisplayName("returns 404 when mechanic belongs to another garage (ownership isolation)")
        void deniesOtherOwner() {
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.empty()); // other owner — not found

            assertThatThrownBy(() -> mechanicService.getMechanic(100L, 2L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Mechanic not found");
        }
    }

    // ── createMechanic ────────────────────────────────────────────────────────

    @Nested @DisplayName("createMechanic")
    class CreateMechanic {

        @Test @DisplayName("creates mechanic with AVAILABLE status and correct garageId")
        void createsWithDefaults() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.save(any(Mechanic.class)))
                    .willAnswer(inv -> {
                        Mechanic m = inv.getArgument(0);
                        m.setId(200L);
                        return m;
                    });

            CreateMechanicRequest req = new CreateMechanicRequest(
                    "Bob", "9876543210", null,
                    List.of("Engine Repair", "Tyre Change"), null, 3
            );

            MechanicDto dto = mechanicService.createMechanic(1L, req);

            assertThat(dto.get_id()).isEqualTo("200");
            assertThat(dto.getGarageId()).isEqualTo("10");
            assertThat(dto.getStatus()).isEqualTo(MechanicStatus.AVAILABLE);
            assertThat(dto.getSkills()).containsExactly("Engine Repair", "Tyre Change");
            assertThat(dto.getVehicleExpertise()).isEmpty(); // defaults to []
        }

        @Test @DisplayName("skills defaults to empty list when null")
        void skillsDefaultsToEmpty() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.save(any())).willAnswer(inv -> {
                Mechanic m = inv.getArgument(0);
                m.setId(201L);
                return m;
            });

            CreateMechanicRequest req = new CreateMechanicRequest(
                    "Bob", "9876543210", null, null, null, null
            );

            MechanicDto dto = mechanicService.createMechanic(1L, req);
            assertThat(dto.getSkills()).isEmpty();
            assertThat(dto.getExperience()).isEqualTo(0);
        }

        @Test @DisplayName("throws 404 when owner has no garage")
        void throwsWhenNoGarage() {
            given(garageRepository.findByOwnerId(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> mechanicService.createMechanic(99L,
                    new CreateMechanicRequest("Bob", "9876543210", null, null, null, null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Garage not found");
        }
    }

    // ── updateMechanic ────────────────────────────────────────────────────────

    @Nested @DisplayName("updateMechanic")
    class UpdateMechanic {

        @Test @DisplayName("updates only provided fields (partial update)")
        void partialUpdate() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.of(sampleMechanic));
            given(mechanicRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            UpdateMechanicRequest req = new UpdateMechanicRequest(
                    "New Name", null, null, null, null, null, null);

            MechanicDto dto = mechanicService.updateMechanic(100L, 1L, req);
            assertThat(dto.getName()).isEqualTo("New Name");
            assertThat(dto.getPhone()).isEqualTo("9876543210"); // unchanged
        }

        @Test @DisplayName("owner can set mechanic status to OFFLINE")
        void ownerCanSetStatus() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.of(sampleMechanic));
            given(mechanicRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            UpdateMechanicRequest req = new UpdateMechanicRequest(
                    null, null, null, null, null, null, MechanicStatus.OFFLINE);

            MechanicDto dto = mechanicService.updateMechanic(100L, 1L, req);
            assertThat(dto.getStatus()).isEqualTo(MechanicStatus.OFFLINE);
        }

        @Test @DisplayName("returns 404 for mechanic in another garage (ownership isolation)")
        void ownershipIsolation() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> mechanicService.updateMechanic(100L, 1L,
                    new UpdateMechanicRequest("x", null, null, null, null, null, null)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Mechanic not found");
        }

        @Test @DisplayName("skills list replaced when provided")
        void skillsReplaced() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.of(sampleMechanic));
            given(mechanicRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            UpdateMechanicRequest req = new UpdateMechanicRequest(
                    null, null, null, List.of("AC Repair"), null, null, null);

            MechanicDto dto = mechanicService.updateMechanic(100L, 1L, req);
            assertThat(dto.getSkills()).containsExactly("AC Repair");
        }
    }

    // ── deleteMechanic ────────────────────────────────────────────────────────

    @Nested @DisplayName("deleteMechanic")
    class DeleteMechanic {

        @Test @DisplayName("deletes owned mechanic")
        void deletesOwned() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.of(sampleMechanic));

            mechanicService.deleteMechanic(100L, 1L);
            verify(mechanicRepository).delete(sampleMechanic);
        }

        @Test @DisplayName("returns 404 for mechanic in another garage")
        void ownershipIsolation() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.empty());

            assertThatThrownBy(() -> mechanicService.deleteMechanic(100L, 1L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Mechanic not found");
        }
    }

    // ── updateLocation ────────────────────────────────────────────────────────

    @Nested @DisplayName("updateLocation")
    class UpdateLocation {

        @Test @DisplayName("persists lat/lng and returns GeoJSON location")
        void persistsLocation() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(garage));
            given(mechanicRepository.findByIdAndGarageId(100L, 10L))
                    .willReturn(Optional.of(sampleMechanic));
            given(mechanicRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            UpdateLocationRequest req = new UpdateLocationRequest(
                    new BigDecimal("12.9716"), new BigDecimal("77.5946"));

            MechanicDto.LocationDto location = mechanicService.updateLocation(100L, 1L, req);

            assertThat(location.getCoordinates()[0]).isEqualTo(77.5946); // longitude first
            assertThat(location.getCoordinates()[1]).isEqualTo(12.9716); // latitude second
            verify(mechanicRepository).save(any());
        }

        @Test @DisplayName("returns 404 when garage owner doesn't match")
        void garageNotFound() {
            given(garageRepository.findByOwnerId(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> mechanicService.updateLocation(100L, 99L,
                    new UpdateLocationRequest(
                            new BigDecimal("12.9716"), new BigDecimal("77.5946"))))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Garage not found");
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Mechanic buildMechanic(Long id, Garage garage) {
        Mechanic m = new Mechanic();
        m.setId(id);
        m.setGarage(garage);
        m.setName("Ali");
        m.setPhone("9876543210");
        m.setStatus(MechanicStatus.AVAILABLE);
        m.setExperience(5);
        m.setSkills(new ArrayList<>(List.of("Engine Repair")));
        m.setVehicleExpertise(new ArrayList<>(List.of(VehicleType.CAR)));
        return m;
    }
}
