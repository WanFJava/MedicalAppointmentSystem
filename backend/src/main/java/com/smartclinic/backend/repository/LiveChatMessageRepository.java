package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.LiveChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiveChatMessageRepository extends JpaRepository<LiveChatMessage, Long> {
    boolean existsBySessionId(Long sessionId);

    List<LiveChatMessage> findBySessionIdOrderByCreatedAtAscIdAsc(Long sessionId);
}
