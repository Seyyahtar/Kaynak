package com.stok.app.dto.request;

import com.stok.app.entity.NotificationActionStatus;
import jakarta.validation.constraints.NotNull;

public class TransferActionRequest {
    @NotNull(message = "Action is required")
    private NotificationActionStatus action; // APPROVED or REJECTED

    // Getters and Setters
    public NotificationActionStatus getAction() {
        return action;
    }

    public void setAction(NotificationActionStatus action) {
        this.action = action;
    }
}
