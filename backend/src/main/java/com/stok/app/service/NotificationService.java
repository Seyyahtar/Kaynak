package com.stok.app.service;

import com.stok.app.dto.response.NotificationResponse;
import com.stok.app.entity.Notification;
import com.stok.app.entity.NotificationStatus;
import com.stok.app.entity.NotificationType;
import com.stok.app.entity.NotificationActionStatus;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.NotificationRepository;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotification(UUID senderId, UUID receiverId, NotificationType type, String title, String content,
            NotificationActionStatus actionStatus) {
        log.info("Creating notification type: {} from {} to {}", type, senderId, receiverId);

        Notification notification = Notification.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .type(type)
                .title(title)
                .content(content)
                .status(NotificationStatus.PENDING)
                .actionStatus(actionStatus)
                .build();

        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getUserNotifications(UUID userId) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    public Notification getNotification(UUID notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }

    public void updateActionStatus(UUID notificationId, NotificationActionStatus status) {
        Notification notification = getNotification(notificationId);
        notification.setActionStatus(status);
        notification.setStatus(NotificationStatus.PROCESSED);
        notificationRepository.save(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        String senderName = "Sistem";
        if (notification.getSenderId() != null) {
            senderName = userRepository.findById(notification.getSenderId())
                    .map(user -> user.getFullName())
                    .orElse("Bilinmeyen Kullanıcı");
        }

        return NotificationResponse.builder()
                .id(notification.getId())
                .senderId(notification.getSenderId())
                .senderName(senderName)
                .receiverId(notification.getReceiverId())
                .type(notification.getType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .status(notification.getStatus())
                .actionStatus(notification.getActionStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
