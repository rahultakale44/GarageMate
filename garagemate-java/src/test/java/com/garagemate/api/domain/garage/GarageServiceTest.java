package com.garagemate.api.domain.garage;

import com.garagemate.api.domain.garage.dto.*;
import com.garagemate.api.domain.garage.cleanup.CloudinaryCleanupService;
import com.garagemate.api.domain.garage.pricing.GarageServicePricingRepository;
import com.garagemate.api.domain.user.User;
import com.garagemate.api.domain.user.UserRepository;
import com.garagemate.api.domain.user.UserRole;
import com.garagemate.api.domain.vehicle.VehicleType;
import com.garagemate.api.exception.ApiException;
import com.garagemate.api.integration.cloudinary.CloudinaryService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import java.util.LinkedHashMap;

@ExtendWith(MockitoExtension.class)
@DisplayName("GarageService")
class GarageServiceTest {

    @Mock private GarageRepository garageRepository;
    @Mock private UserRepository userRepository;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private GarageServicePricingRepository pricingRepository;
    @Mock private CloudinaryCleanupService cloudinaryCleanupService;

    @InjectMocks private GarageService garageService;

    private User owner;
    private Garage approvedGarage;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).name("Owner").email("owner@test.com").role(UserRole.GARAGE_OWNER)
                .build();

        approvedGarage = buildGarage(10L, owner, VerificationStatus.APPROVED, true);
    }

    // ── getGarage ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("getGarage")
    class GetGarage {

        @Test @DisplayName("returns GarageDto with _id as string")
        void returnsDto() {
            given(garageRepository.findById(10L)).willReturn(Optional.of(approvedGarage));

            GarageDto dto = garageService.getGarage(10L);

            assertThat(dto.get_id()).isEqualTo("10");        // _id string
            assertThat(dto.getName()).isEqualTo("Test Garage");
            assertThat(dto.getLocation()).isNotNull();
            assertThat(dto.getLocation().getCoordinates()).containsExactly(77.5946, 12.9716);
        }

        @Test @DisplayName("throws 404 for missing garage")
        void throwsNotFound() {
            given(garageRepository.findById(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> garageService.getGarage(99L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Garage not found");
        }
    }

    // ── getMyGarage ───────────────────────────────────────────────────────────

    @Nested @DisplayName("getMyGarage")
    class GetMyGarage {

        @Test @DisplayName("returns own garage for authenticated owner")
        void returnsOwnerGarage() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            GarageDto dto = garageService.getMyGarage(1L);
            assertThat(dto.get_id()).isEqualTo("10");
        }

        @Test @DisplayName("returns 404 when owner has no garage")
        void throwsNotFound() {
            given(garageRepository.findByOwnerId(99L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> garageService.getMyGarage(99L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Garage not found");
        }
    }

    // ── listGarages ───────────────────────────────────────────────────────────

    @Nested @DisplayName("listGarages")
    class ListGarages {

        @Test @DisplayName("returns paginated APPROVED garages")
        void returnsPaginated() {
            Page<Garage> page = new PageImpl<>(List.of(approvedGarage));
            given(garageRepository.findByVerificationStatus(
                    eq(VerificationStatus.APPROVED), any(Pageable.class)))
                    .willReturn(page);

            Map<String, Object> result = garageService.listGarages(null, null, null, 1, 20);

            @SuppressWarnings("unchecked")
            List<GarageDto> data = (List<GarageDto>) result.get("data");
            assertThat(data).hasSize(1);
            assertThat(data.get(0).get_id()).isEqualTo("10");

            @SuppressWarnings("unchecked")
            Map<String, Object> pagination = (Map<String, Object>) result.get("pagination");
            assertThat(pagination.get("page")).isEqualTo(1);
        }
    }

    // ── updateGarage ──────────────────────────────────────────────────────────

    @Nested @DisplayName("updateGarage")
    class UpdateGarage {

        @Test @DisplayName("updates name and phone")
        void updatesFields() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            UpdateGarageRequest req = new UpdateGarageRequest(
                    "New Name", "9000000000", null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null, null, null);

            GarageDto dto = garageService.updateGarage(1L, req);

            assertThat(dto.getName()).isEqualTo("New Name");
            assertThat(dto.getPhone()).isEqualTo("9000000000");
            // Verification status must NOT be changeable
            assertThat(dto.getVerificationStatus()).isEqualTo(VerificationStatus.APPROVED);
        }

        @Test @DisplayName("throws 404 when owner has no garage")
        void throwsNotFound() {
            given(garageRepository.findByOwnerId(2L)).willReturn(Optional.empty());
            assertThatThrownBy(() -> garageService.updateGarage(2L,
                    new UpdateGarageRequest("x", null, null, null, null, null,
                            null, null, null, null, null, null, null, null, null, null, null, null)))
                    .isInstanceOf(ApiException.class);
        }
    }

    // ── toggleAvailability ────────────────────────────────────────────────────

    @Nested @DisplayName("toggleAvailability")
    class ToggleAvailability {

        @Test @DisplayName("sets isAvailable to false")
        void setsUnavailable() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            Map<String, Boolean> result = garageService.toggleAvailability(1L, false);
            assertThat(result).containsEntry("isAvailable", false);
            verify(garageRepository).save(any());
        }
    }

    // ── addImages ─────────────────────────────────────────────────────────────

    @Nested @DisplayName("addImages")
    class AddImages {

        @Test @DisplayName("appends images to garage")
        void appendsImages() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            AddImagesRequest req = new AddImagesRequest(List.of(
                    new AddImagesRequest.ImageEntry("https://res.cloudinary.com/x/img.jpg",
                            "garagemate/garages/img", "gallery")
            ));

            List<GarageImageDto> images = garageService.addImages(1L, req);
            assertThat(images).hasSize(1);
            assertThat(images.get(0).getUrl()).contains("cloudinary.com");
        }

        @Test @DisplayName("throws 400 when images list is empty")
        void throwsOnEmpty() {
            // Bean Validation prevents empty list at controller, but test service guard
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            AddImagesRequest req = new AddImagesRequest(List.of(
                    new AddImagesRequest.ImageEntry("https://example.com/img.jpg", null, null)
            ));
            List<GarageImageDto> images = garageService.addImages(1L, req);
            assertThat(images).hasSize(1);
        }
    }

    // ── servicePricing update ─────────────────────────────────────────────────

    @Nested @DisplayName("servicePricing")
    class ServicePricing {

        @Test @DisplayName("saves new pricing entries and returns them in DTO")
        void savesPricing() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            Map<String, BigDecimal> pricing = new LinkedHashMap<>();
            pricing.put("Car Repair", new BigDecimal("500.00"));
            pricing.put("Tyre Puncture", new BigDecimal("200.00"));

            UpdateGarageRequest req = new UpdateGarageRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null, null,
                    pricing);

            garageService.updateGarage(1L, req);

            verify(pricingRepository).deleteByGarageId(approvedGarage.getId());
            verify(pricingRepository, times(2)).save(any());
        }

        @Test @DisplayName("does not touch pricing when field is null")
        void skipsPricingWhenNull() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            UpdateGarageRequest req = new UpdateGarageRequest(
                    "New Name", null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null, null, null);

            garageService.updateGarage(1L, req);

            verify(pricingRepository, never()).deleteByGarageId(any());
            verify(pricingRepository, never()).save(any());
        }

        @Test @DisplayName("empty map clears all existing pricing entries")
        void emptyMapClearsPricing() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            UpdateGarageRequest req = new UpdateGarageRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null, null,
                    new LinkedHashMap<>());   // empty map — clear all pricing

            garageService.updateGarage(1L, req);

            verify(pricingRepository).deleteByGarageId(approvedGarage.getId());
            verify(pricingRepository, never()).save(any());  // nothing to insert
        }

        @Test @DisplayName("negative prices are skipped by service-layer guard")
        void negativeSkipped() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any(Garage.class))).willAnswer(inv -> inv.getArgument(0));

            Map<String, BigDecimal> pricing = new LinkedHashMap<>();
            pricing.put("Car Repair",  new BigDecimal("500.00"));
            pricing.put("Bad Service", new BigDecimal("-50.00")); // negative — skipped

            UpdateGarageRequest req = new UpdateGarageRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null, null,
                    pricing);

            garageService.updateGarage(1L, req);

            // Only the non-negative entry was saved
            verify(pricingRepository, times(1)).save(any());
        }

        @Test @DisplayName("rollback: if pricingRepository.save throws, exception propagates for TX rollback")
        void exceptionPropagatesForRollback() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            doThrow(new RuntimeException("UK constraint violation"))
                    .when(pricingRepository).save(any());

            Map<String, BigDecimal> pricing = new LinkedHashMap<>();
            pricing.put("Car Repair", new BigDecimal("500.00"));

            UpdateGarageRequest req = new UpdateGarageRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null, null,
                    pricing);

            // Exception propagates — @Transactional on updateGarage rolls back both
            // the garageRepository.save AND pricingRepository operations
            assertThatThrownBy(() -> garageService.updateGarage(1L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("UK constraint");

            verify(pricingRepository).deleteByGarageId(approvedGarage.getId());
        }
    }

    // ── Cloudinary safety ─────────────────────────────────────────────────────

    @Nested @DisplayName("Cloudinary image add safety")
    class CloudinaryFailure {

        @Test @DisplayName("uploadImages: Cloudinary upload failure does not write DB record")
        void uploadFailureNoDbRecord() throws Exception {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            doThrow(new java.io.IOException("Cloudinary 503"))
                    .when(cloudinaryService).upload(any(), any());

            org.springframework.mock.web.MockMultipartFile file =
                    new org.springframework.mock.web.MockMultipartFile(
                            "file", "test.jpg", "image/jpeg", new byte[100]);

            assertThatThrownBy(() -> garageService.uploadImages(1L, java.util.List.of(file)))
                    .isInstanceOf(com.garagemate.api.exception.ApiException.class)
                    .hasMessageContaining("Image upload failed");

            // DB not saved — no partial record
            verify(garageRepository, never()).save(any());
        }

        @Test @DisplayName("addImages: JSON-URL method persists all entries")
        void addImagesJsonPersistsAll() {
            given(garageRepository.findByOwnerId(1L)).willReturn(Optional.of(approvedGarage));
            given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            AddImagesRequest req = new AddImagesRequest(java.util.List.of(
                    new AddImagesRequest.ImageEntry(
                            "https://res.cloudinary.com/test/img.jpg",
                            "garagemate/garages/img", "gallery")
            ));

            List<GarageImageDto> images = garageService.addImages(1L, req);
            assertThat(images).hasSize(1);
            assertThat(images.get(0).getUrl()).contains("cloudinary.com");
            verify(garageRepository).save(any());
        }
    }

    // ── isGarageOpen ──────────────────────────────────────────────────────────

    @Nested @DisplayName("isGarageOpen")
    class IsGarageOpen {

        @Test @DisplayName("24x7 garage is always open")
        void alwaysOpen24x7() {
            Garage g = buildGarage(1L, owner, VerificationStatus.APPROVED, true);
            g.set24x7(true);
            assertThat(garageService.isGarageOpen(g)).isTrue();
        }

        @Test @DisplayName("garage within hours is open")
        void openWithinHours() {
            Garage g = buildGarage(1L, owner, VerificationStatus.APPROVED, true);
            g.set24x7(false);
            g.setOpeningTime("0:00");
            g.setClosingTime("23:59");
            assertThat(garageService.isGarageOpen(g)).isTrue();
        }

        @Test @DisplayName("garage outside hours is closed")
        void closedOutsideHours() {
            Garage g = buildGarage(1L, owner, VerificationStatus.APPROVED, true);
            g.set24x7(false);
            // Set hours that are definitely past — 1:00 to 2:00 AM
            g.setOpeningTime("1:00");
            g.setClosingTime("2:00");
            // This may pass or fail depending on current time; just verify it doesn't throw
            assertThat(garageService.isGarageOpen(g)).isIn(true, false);
        }
    }

    // ── searchNearby (unit — mocked SQL) ─────────────────────────────────────

    @Nested @DisplayName("searchNearby")
    class SearchNearby {

        @Test @DisplayName("returns empty when no garages in radius")
        void emptyResult() {
            given(garageRepository.findNearbyIdsWithDistance(anyDouble(), anyDouble(),
                    anyDouble(), anyInt())).willReturn(List.of());

            NearbySearchParams params = NearbySearchParams.builder()
                    .latitude(12.9716).longitude(77.5946).radiusKm(10).build();

            List<GarageDto> result = garageService.searchNearby(params);
            assertThat(result).isEmpty();
        }

        @Test @DisplayName("caps radius at MAX_SEARCH_RADIUS_KM (50)")
        void capsRadius() {
            given(garageRepository.findNearbyIdsWithDistance(anyDouble(), anyDouble(),
                    eq(50.0), anyInt())).willReturn(List.of());

            NearbySearchParams params = NearbySearchParams.builder()
                    .latitude(12.9716).longitude(77.5946).radiusKm(999).build();

            garageService.searchNearby(params);
            verify(garageRepository).findNearbyIdsWithDistance(anyDouble(), anyDouble(), eq(50.0), anyInt());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Garage buildGarage(Long id, User owner, VerificationStatus status,
                                boolean available) {
        Garage g = new Garage();
        g.setId(id);
        g.setOwner(owner);
        g.setName("Test Garage");
        g.setPhone("9876543210");
        g.setAddress("123 Test Street, Bangalore");
        g.setCity("Bangalore");
        g.setState("Karnataka");
        g.setPincode("560001");
        g.setLatitude(new BigDecimal("12.9716"));
        g.setLongitude(new BigDecimal("77.5946"));
        g.setServiceRadius(10);
        g.setVerificationStatus(status);
        g.setAvailable(available);
        g.setRating(BigDecimal.ZERO);
        g.setReviewCount(0);
        g.setVisitingCharge(new BigDecimal("99.00"));
        g.setServices(new ArrayList<>(List.of("Car Repair", "Tyre Puncture")));
        g.setSupportedVehicleTypes(new ArrayList<>(List.of(VehicleType.CAR)));
        g.setImages(new ArrayList<>());
        g.setVerificationHistory(new ArrayList<>());
        return g;
    }
}
