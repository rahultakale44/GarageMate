package com.garagemate.api.domain.garage;

import com.garagemate.api.exception.ApiException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("GarageVerificationService")
class GarageVerificationServiceTest {

    @Mock private GarageRepository garageRepository;
    @InjectMocks private GarageVerificationService svc;

    private Garage pendingGarage;
    private Garage approvedGarage;

    @BeforeEach
    void setUp() {
        pendingGarage  = build(1L, VerificationStatus.PENDING);
        approvedGarage = build(2L, VerificationStatus.APPROVED);
    }

    // ── approve ───────────────────────────────────────────────────────────────

    @Test @DisplayName("approve PENDING garage transitions to APPROVED")
    void approvePending() {
        given(garageRepository.findById(1L)).willReturn(Optional.of(pendingGarage));
        given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        Garage result = svc.approve(1L, "admin-1");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(result.getVerificationHistory()).hasSize(1);
        assertThat(result.getVerificationHistory().get(0).getChangedBy()).isEqualTo("admin-1");
    }

    @Test @DisplayName("cannot approve an already REJECTED garage")
    void cannotApproveRejected() {
        Garage rejected = build(3L, VerificationStatus.REJECTED);
        given(garageRepository.findById(3L)).willReturn(Optional.of(rejected));

        assertThatThrownBy(() -> svc.approve(3L, "admin-1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Cannot transition from REJECTED to APPROVED");
    }

    // ── reject ────────────────────────────────────────────────────────────────

    @Test @DisplayName("reject PENDING garage transitions to REJECTED")
    void rejectPending() {
        given(garageRepository.findById(1L)).willReturn(Optional.of(pendingGarage));
        given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        Garage result = svc.reject(1L, "Missing documents", "admin-1");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(result.getVerificationNotes()).isEqualTo("Missing documents");
    }

    @Test @DisplayName("reject requires a non-blank reason")
    void rejectRequiresReason() {
        assertThatThrownBy(() -> svc.reject(1L, null, "admin-1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("reason is required");
    }

    // ── requestChanges ────────────────────────────────────────────────────────

    @Test @DisplayName("requestChanges from PENDING transitions to CHANGES_REQUESTED")
    void requestChanges() {
        given(garageRepository.findById(1L)).willReturn(Optional.of(pendingGarage));
        given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        Garage result = svc.requestChanges(1L, "Please add phone number", "admin-1");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.CHANGES_REQUESTED);
    }

    @Test @DisplayName("cannot requestChanges from APPROVED")
    void cannotRequestChangesFromApproved() {
        given(garageRepository.findById(2L)).willReturn(Optional.of(approvedGarage));

        assertThatThrownBy(() -> svc.requestChanges(2L, "notes", "admin-1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Cannot transition from APPROVED");
    }

    // ── suspend ───────────────────────────────────────────────────────────────

    @Test @DisplayName("suspend APPROVED garage sets SUSPENDED and isAvailable=false")
    void suspend() {
        given(garageRepository.findById(2L)).willReturn(Optional.of(approvedGarage));
        given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        Garage result = svc.suspend(2L, "Policy violation", "admin-1");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.SUSPENDED);
        assertThat(result.isAvailable()).isFalse();
    }

    @Test @DisplayName("cannot suspend a PENDING garage")
    void cannotSuspendPending() {
        given(garageRepository.findById(1L)).willReturn(Optional.of(pendingGarage));

        assertThatThrownBy(() -> svc.suspend(1L, "reason", "admin-1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Cannot transition from PENDING");
    }

    // ── reactivate ────────────────────────────────────────────────────────────

    @Test @DisplayName("reactivate SUSPENDED garage → APPROVED + isAvailable=true")
    void reactivate() {
        Garage suspended = build(4L, VerificationStatus.SUSPENDED);
        given(garageRepository.findById(4L)).willReturn(Optional.of(suspended));
        given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        Garage result = svc.reactivate(4L, "Resolved", "admin-1");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(result.isAvailable()).isTrue();
    }

    @Test @DisplayName("history entry added on each transition")
    void historyRecorded() {
        given(garageRepository.findById(1L)).willReturn(Optional.of(pendingGarage));
        given(garageRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        svc.approve(1L, "admin-1");

        assertThat(pendingGarage.getVerificationHistory()).hasSize(1);
        GarageVerificationHistory h = pendingGarage.getVerificationHistory().get(0);
        assertThat(h.getStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(h.getChangedBy()).isEqualTo("admin-1");
        assertThat(h.getChangedAt()).isNotNull();
        verify(garageRepository).save(pendingGarage);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Garage build(Long id, VerificationStatus status) {
        Garage g = new Garage();
        g.setId(id);
        g.setVerificationStatus(status);
        g.setVerificationHistory(new ArrayList<>());
        g.setAvailable(status == VerificationStatus.APPROVED);
        g.setRating(BigDecimal.ZERO);
        g.setReviewCount(0);
        g.setVisitingCharge(new BigDecimal("99.00"));
        g.setServices(new ArrayList<>());
        g.setSupportedVehicleTypes(new ArrayList<>());
        g.setImages(new ArrayList<>());
        g.setServicePricing(new ArrayList<>());
        return g;
    }
}
