package com.stok.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserActiveRequest {
    @NotNull(message = "Active status is required")
    private Boolean active;
}
