package com.garagemate.api.domain.message;

import com.garagemate.api.domain.request.AssistanceRequest;
import com.garagemate.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * In-request chat messages between user and garage.
 * Used for WebSocket/STOMP real-time messaging.
 */
@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_message_request_id", columnList = "request_id"),
        @Index(name = "idx_message_sender_id", columnList = "sender_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private AssistanceRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 2000)
    private String content;

    /** true when the receiver has read the message */
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
