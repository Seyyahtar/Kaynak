package com.stok.app.repository;

import com.stok.app.entity.Notification;
import com.stok.app.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByReceiverIdOrderByCreatedAtDesc(UUID receiverId);

    List<Notification> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, NotificationStatus status);
}
