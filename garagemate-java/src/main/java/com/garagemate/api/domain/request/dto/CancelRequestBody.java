package com.garagemate.api.domain.request.dto;

/**
 * POST /api/requests/:id/cancel
 * Body: { reason? }
 * Reason is optional — just a string stored in statusHistory notes.
 */
public record CancelRequestBody(String reason) {}
