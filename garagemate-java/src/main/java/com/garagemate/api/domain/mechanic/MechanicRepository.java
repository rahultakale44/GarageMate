package com.garagemate.api.domain.mechanic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MechanicRepository extends JpaRepository<Mechanic, Long> {
    List<Mechanic> findByGarageIdOrderByCreatedAtDesc(Long garageId);
    Optional<Mechanic> findByIdAndGarageId(Long id, Long garageId);
    boolean existsByIdAndGarageId(Long id, Long garageId);
    List<Mechanic> findByGarageIdAndStatus(Long garageId, MechanicStatus status);
}
