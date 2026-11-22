package com.garagemate.api.domain.message;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Messages for a request, ordered by time — paginated */
    List<Message> findByRequestIdOrderByCreatedAtAsc(Long requestId, Pageable pageable);

    /** Count unread messages for a specific receiver in a request */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.request.id = :requestId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadForUser(Long requestId, Long userId);

    /** Mark all messages in a request as read by a given user */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.request.id = :requestId AND m.sender.id != :readerId")
    int markAllReadForRequest(Long requestId, Long readerId);
}
