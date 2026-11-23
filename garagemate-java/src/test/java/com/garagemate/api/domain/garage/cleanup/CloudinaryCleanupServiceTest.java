package com.garagemate.api.domain.garage.cleanup;

import com.garagemate.api.integration.cloudinary.CloudinaryService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CloudinaryCleanupService")
class CloudinaryCleanupServiceTest {

    @Mock private CloudinaryService cloudinaryService;
    @Mock private PendingCloudinaryDeletionRepository cleanupRepository;

    @InjectMocks private CloudinaryCleanupService svc;

    private static final String PUBLIC_ID = "garagemate/garages/test123";
    private static final Long   GARAGE_ID = 10L;

    // ── registerPendingDeletion ───────────────────────────────────────────────

    @Test
    @DisplayName("registerPendingDeletion saves a new PENDING row when not already registered")
    void registersNewPendingRow() {
        given(cleanupRepository.existsByPublicId(PUBLIC_ID)).willReturn(false);
        given(cleanupRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        svc.registerPendingDeletion(PUBLIC_ID, GARAGE_ID);

        verify(cleanupRepository).save(argThat(r ->
                r.getPublicId().equals(PUBLIC_ID) &&
                r.getGarageId().equals(GARAGE_ID) &&
                r.getStatus() == PendingCloudinaryDeletion.DeletionStatus.PENDING
        ));
    }

    @Test
    @DisplayName("registerPendingDeletion is idempotent — skips if already registered")
    void idempotentRegistration() {
        given(cleanupRepository.existsByPublicId(PUBLIC_ID)).willReturn(true);

        svc.registerPendingDeletion(PUBLIC_ID, GARAGE_ID);

        verify(cleanupRepository, never()).save(any());
    }

    // ── attemptDeletion — success ─────────────────────────────────────────────

    @Test
    @DisplayName("attemptDeletion: Cloudinary success marks row DONE")
    void successMarksDone() {
        PendingCloudinaryDeletion record = pendingRecord();
        given(cleanupRepository.findByPublicId(PUBLIC_ID)).willReturn(Optional.of(record));
        given(cleanupRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        doNothing().when(cloudinaryService).delete(PUBLIC_ID);

        svc.attemptDeletion(PUBLIC_ID);

        assertThat(record.getStatus()).isEqualTo(PendingCloudinaryDeletion.DeletionStatus.DONE);
        assertThat(record.getLastError()).isNull();
        verify(cleanupRepository).save(record);
    }

    // ── attemptDeletion — Cloudinary failure ──────────────────────────────────

    @Test
    @DisplayName("attemptDeletion: Cloudinary failure leaves row PENDING with error logged")
    void failureLeavesPending() {
        PendingCloudinaryDeletion record = pendingRecord();
        given(cleanupRepository.findByPublicId(PUBLIC_ID)).willReturn(Optional.of(record));
        given(cleanupRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("Cloudinary 503")).when(cloudinaryService).delete(PUBLIC_ID);

        // Must NOT throw — the outbox pattern swallows the error
        assertThatCode(() -> svc.attemptDeletion(PUBLIC_ID)).doesNotThrowAnyException();

        assertThat(record.getStatus()).isEqualTo(PendingCloudinaryDeletion.DeletionStatus.PENDING);
        assertThat(record.getAttempts()).isEqualTo(1);
        assertThat(record.getLastError()).contains("Cloudinary 503");
        // Public ID is still on the record — not lost
        assertThat(record.getPublicId()).isEqualTo(PUBLIC_ID);
        verify(cleanupRepository).save(record);
    }

    // ── attemptDeletion — repeated after success ──────────────────────────────

    @Test
    @DisplayName("attemptDeletion: already-DONE row is skipped (idempotent)")
    void alreadyDoneIsSkipped() {
        PendingCloudinaryDeletion record = pendingRecord();
        record.markDone();
        given(cleanupRepository.findByPublicId(PUBLIC_ID)).willReturn(Optional.of(record));

        svc.attemptDeletion(PUBLIC_ID);

        verify(cloudinaryService, never()).delete(any());
        verify(cleanupRepository, never()).save(any());
    }

    // ── attemptDeletion — missing outbox row ──────────────────────────────────

    @Test
    @DisplayName("attemptDeletion: missing outbox row logs warning and does not throw")
    void missingOutboxRow() {
        given(cleanupRepository.findByPublicId(PUBLIC_ID)).willReturn(Optional.empty());

        assertThatCode(() -> svc.attemptDeletion(PUBLIC_ID)).doesNotThrowAnyException();

        verify(cloudinaryService, never()).delete(any());
    }

    // ── retryPending ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("retryPending: delegates to retrySingle per record ID")
    void retriesAllPending() {
        PendingCloudinaryDeletion r1 = pendingRecord("pub-1", 1L);
        r1 = PendingCloudinaryDeletion.builder().id(1L).publicId("pub-1").garageId(1L).build();
        PendingCloudinaryDeletion r2 = PendingCloudinaryDeletion.builder().id(2L).publicId("pub-2").garageId(2L).build();

        given(cleanupRepository.findByStatus(PendingCloudinaryDeletion.DeletionStatus.PENDING))
                .willReturn(List.of(r1, r2));
        // retrySingle calls findById
        given(cleanupRepository.findById(1L)).willReturn(Optional.of(r1));
        given(cleanupRepository.findById(2L)).willReturn(Optional.of(r2));
        given(cleanupRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        doNothing().when(cloudinaryService).delete(any());

        svc.retryPending();

        verify(cloudinaryService).delete("pub-1");
        verify(cloudinaryService).delete("pub-2");
        assertThat(r1.getStatus()).isEqualTo(PendingCloudinaryDeletion.DeletionStatus.DONE);
        assertThat(r2.getStatus()).isEqualTo(PendingCloudinaryDeletion.DeletionStatus.DONE);
    }

    @Test
    @DisplayName("retryPending: partial failure — succeeds DONE, failures stay PENDING")
    void partialRetryFailure() {
        PendingCloudinaryDeletion r1 = PendingCloudinaryDeletion.builder().id(1L).publicId("pub-ok").garageId(1L).build();
        PendingCloudinaryDeletion r2 = PendingCloudinaryDeletion.builder().id(2L).publicId("pub-fail").garageId(2L).build();

        given(cleanupRepository.findByStatus(PendingCloudinaryDeletion.DeletionStatus.PENDING))
                .willReturn(List.of(r1, r2));
        given(cleanupRepository.findById(1L)).willReturn(Optional.of(r1));
        given(cleanupRepository.findById(2L)).willReturn(Optional.of(r2));
        given(cleanupRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        doNothing().when(cloudinaryService).delete("pub-ok");
        doThrow(new RuntimeException("network error")).when(cloudinaryService).delete("pub-fail");

        assertThatCode(() -> svc.retryPending()).doesNotThrowAnyException();

        assertThat(r1.getStatus()).isEqualTo(PendingCloudinaryDeletion.DeletionStatus.DONE);
        assertThat(r2.getStatus()).isEqualTo(PendingCloudinaryDeletion.DeletionStatus.PENDING);
        assertThat(r2.getAttempts()).isEqualTo(1);
        assertThat(r2.getPublicId()).isEqualTo("pub-fail");
    }

    @Test
    @DisplayName("retryPending: no-op when no pending rows")
    void noPendingRows() {
        given(cleanupRepository.findByStatus(any())).willReturn(List.of());

        svc.retryPending();

        verify(cloudinaryService, never()).delete(any());
    }

    // ── retrySingle ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("retrySingle: skips record already marked DONE (concurrent safety)")
    void retrySingleSkipsDone() {
        PendingCloudinaryDeletion done = pendingRecord();
        done.markDone();
        done = PendingCloudinaryDeletion.builder().id(5L).publicId(PUBLIC_ID).garageId(GARAGE_ID).build();
        done.markDone();
        given(cleanupRepository.findById(5L)).willReturn(Optional.of(done));

        svc.retrySingle(5L);

        verify(cloudinaryService, never()).delete(any());
        verify(cleanupRepository, never()).save(any());
    }

    @Test
    @DisplayName("retrySingle: skips missing record safely")
    void retrySingleMissingRecord() {
        given(cleanupRepository.findById(99L)).willReturn(Optional.empty());

        assertThatCode(() -> svc.retrySingle(99L)).doesNotThrowAnyException();
        verify(cloudinaryService, never()).delete(any());
    }

    // ── purgeDoneRecords ──────────────────────────────────────────────────────

    @Test
    @DisplayName("purgeDoneRecords: deletes DONE records older than cutoff")
    void purgesDoneRecords() {
        PendingCloudinaryDeletion old = pendingRecord("old-pub", 1L);
        old.markDone();
        given(cleanupRepository.findByStatusAndCreatedAtBefore(
                eq(PendingCloudinaryDeletion.DeletionStatus.DONE), any()))
                .willReturn(List.of(old));

        int count = svc.purgeDoneRecords(30);

        assertThat(count).isEqualTo(1);
        verify(cleanupRepository).deleteAll(List.of(old));
    }

    @Test
    @DisplayName("purgeDoneRecords: no-op when nothing to purge")
    void purgeNoOp() {
        given(cleanupRepository.findByStatusAndCreatedAtBefore(any(), any()))
                .willReturn(List.of());

        int count = svc.purgeDoneRecords(30);

        assertThat(count).isEqualTo(0);
        verify(cleanupRepository, never()).deleteAll(any(java.util.Collection.class));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PendingCloudinaryDeletion pendingRecord() {
        return pendingRecord(PUBLIC_ID, GARAGE_ID);
    }

    private PendingCloudinaryDeletion pendingRecord(String publicId, Long garageId) {
        return PendingCloudinaryDeletion.builder()
                .publicId(publicId)
                .garageId(garageId)
                .build();
    }
}
