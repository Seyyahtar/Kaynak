package com.stok.app.dto.response;

import com.stok.app.entity.NotificationActionStatus;
import com.stok.app.entity.NotificationStatus;
import com.stok.app.entity.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private UUID senderId;
    private String senderName;
    private UUID receiverId;
    private NotificationType type;
    private String title;
    private String content;
    private NotificationStatus status;
    private NotificationActionStatus actionStatus;
    private LocalDateTime createdAt;
}
