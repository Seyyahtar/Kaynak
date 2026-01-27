package com.stok.app.service;

import com.stok.app.dto.request.StockItemRequest;
import com.stok.app.entity.StockItem;
import com.stok.app.entity.User;
import com.stok.app.repository.StockItemRepository;
import com.stok.app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StockServiceTest {

    @Mock
    private StockItemRepository stockItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HistoryService historyService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private StockService stockService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("testuser");
    }

    @Test
    void addStockItem_Success() {
        // Arrange
        StockItemRequest request = new StockItemRequest();
        request.setMaterialName("Test Material");
        request.setSerialLotNumber("SN123");
        request.setQuantity(10);
        request.setDateAdded(LocalDate.now());

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(stockItemRepository.findByMaterialNameAndSerialLotNumberAndUserId(any(), any(), any()))
                .thenReturn(Optional.empty());

        when(stockItemRepository.save(any(StockItem.class))).thenAnswer(invocation -> {
            StockItem item = invocation.getArgument(0);
            item.setId(UUID.randomUUID());
            return item;
        });

        // Act
        var response = stockService.addStockItem(request, userId);

        // Assert
        assertNotNull(response);
        assertEquals("Test Material", response.getMaterialName());
        verify(auditLogService).log(eq("CREATE_STOCK"), eq("StockItem"), any(), any());
        verify(historyService).addHistory(eq(userId), eq("stock-add"), any(), any());
    }

    @Test
    void addStockItem_Duplicate_ThrowsException() {
        // Arrange
        StockItemRequest request = new StockItemRequest();
        request.setMaterialName("Test Material");
        request.setSerialLotNumber("SN123");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(stockItemRepository.findByMaterialNameAndSerialLotNumberAndUserId(any(), any(), any()))
                .thenReturn(Optional.of(new StockItem()));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> stockService.addStockItem(request, userId));
    }
}
