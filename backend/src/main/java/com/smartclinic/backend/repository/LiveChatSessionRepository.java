package com.smartclinic.backend.repository;

import com.smartclinic.backend.entity.LiveChatSession;
import com.smartclinic.backend.entity.LiveChatStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LiveChatSessionRepository extends JpaRepository<LiveChatSession, Long> {

    List<LiveChatSession> findByStatusInOrderByLastMessageAtDesc(Collection<LiveChatStatus> statuses);

    List<LiveChatSession> findAllByOrderByLastMessageAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from LiveChatSession session where session.id = :id")
    Optional<LiveChatSession> findByIdForUpdate(@Param("id") Long id);
}
