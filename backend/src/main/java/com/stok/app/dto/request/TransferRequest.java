package com.stok.app.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

public class TransferRequest {
    @NotNull(message = "Receiver ID is required")
    private UUID receiverId;

    @NotEmpty(message = "At least one item is required")
    private List<@Valid TransferItemRequest> items;

    // Getters and Setters
    public UUID getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(UUID receiverId) {
        this.receiverId = receiverId;
    }

    public List<TransferItemRequest> getItems() {
        return items;
    }

    public void setItems(List<TransferItemRequest> items) {
        this.items = items;
    }
}
