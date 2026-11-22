package com.garagemate.api.domain.quotation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByRequestId(Long requestId);
    Optional<Quotation> findByRequestIdAndGarageId(Long requestId, Long garageId);
    List<Quotation> findByGarageIdAndStatus(Long garageId, QuotationStatus status);
}
