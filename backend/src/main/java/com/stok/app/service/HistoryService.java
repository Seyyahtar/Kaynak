package com.stok.app.service;

import com.stok.app.entity.HistoryRecord;
import com.stok.app.entity.User;
import com.stok.app.dto.response.HistoryRecordResponse;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.HistoryRecordRepository;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * History Service - Business logic for history records
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class HistoryService {

    private final HistoryRecordRepository historyRecordRepository;
    private final UserRepository userRepository;

    public List<HistoryRecordResponse> getAllHistory(UUID userId) {
        log.debug("Getting all history for user: {}", userId);
        return historyRecordRepository.findByUserIdOrderByRecordDateDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void addHistory(UUID userId, String type, String description, Map<String, Object> details) {
        log.debug("Adding history record for user: {}, type: {}", userId, type);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        HistoryRecord record = new HistoryRecord();
        record.setUser(user);
        record.setRecordDate(LocalDateTime.now());
        record.setType(type);
        record.setDescription(description);
        record.setDetailsJson(details);

        historyRecordRepository.save(record);
        log.info("History record added: {}", type);
    }

    public void deleteHistory(UUID id, UUID userId) {
        log.debug("Deleting history record: {}", id);

        HistoryRecord record = historyRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("History record not found"));

        if (!record.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to history record");
        }

        historyRecordRepository.delete(record);
        log.info("History record deleted: {}", id);
    }

    private HistoryRecordResponse mapToResponse(HistoryRecord record) {
        return HistoryRecordResponse.builder()
                .id(record.getId())
                .recordDate(record.getRecordDate())
                .type(record.getType())
                .description(record.getDescription())
                .details(record.getDetailsJson())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
