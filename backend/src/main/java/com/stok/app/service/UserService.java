package com.stok.app.service;

import com.stok.app.dto.request.LoginRequest;
import com.stok.app.dto.request.CreateUserRequest;
import com.stok.app.dto.response.UserResponse;
import com.stok.app.entity.User;
import com.stok.app.entity.UserRole;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User Service - Business logic for user management
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @jakarta.annotation.PostConstruct
    public void init() {
        // Ensure ibrahim has correct password and ADMIN role
        userRepository.findByUsername("ibrahim").ifPresentOrElse(user -> {
            user.setPasswordHash(passwordEncoder.encode("123"));
            user.setRole(UserRole.ADMIN);
            user.setActive(true);
            userRepository.save(user);
            log.info("Password for user 'ibrahim' reset to '123' with ADMIN role");
        }, () -> {
            createUserByAdmin(new CreateUserRequest() {
                {
                    setUsername("ibrahim");
                    setPassword("123");
                    setFullName("İbrahim");
                    setRole(UserRole.ADMIN);
                }
            });
        });

        // Add requested users if they don't exist
        createIfNotExist("Admin", "123", "Sistem Admini", UserRole.ADMIN);
        createIfNotExist("Yönetici", "123", "Sistem Yöneticisi", UserRole.YONETICI);
        createIfNotExist("Kullanıcı", "123", "Standart Kullanıcı", UserRole.KULLANICI);
    }

    private void createIfNotExist(String username, String password, String fullName, UserRole role) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setFullName(fullName);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole(role);
            user.setActive(true);
            userRepository.save(user);
            log.info("Initialized user: {} with role {}", username, role);
        }
    }

    public UserResponse login(LoginRequest request) {
        log.debug("User login attempt: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid password");
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in: {}", user.getUsername());
        return mapToResponse(user);
    }

    public UserResponse getCurrentUser(UUID userId) {
        log.debug("Getting current user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    public UserResponse createUser(String username, String fullName, String email, String password) {
        log.debug("Creating user: {}", username);

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));

        User saved = userRepository.save(user);

        auditLogService.log("USER_REGISTERED", "User", saved.getId().toString(),
                "User registered: " + saved.getUsername());

        log.info("User created: {}", saved.getUsername());
        return mapToResponse(saved);
    }

    /**
     * Get all users - Admin/Yönetici only
     */
    public List<UserResponse> getAllUsers() {
        log.debug("Getting all users");
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create user by admin
     */
    public UserResponse createUserByAdmin(CreateUserRequest request) {
        log.debug("Admin creating user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRegion(request.getRegion());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);

        User saved = userRepository.save(user);

        auditLogService.log("USER_CREATED_BY_ADMIN", "User", saved.getId().toString(),
                "Admin created user: " + saved.getUsername() + " with role: " + saved.getRole());

        log.info("User created by admin: {} with role {}", saved.getUsername(), saved.getRole());
        return mapToResponse(saved);
    }

    /**
     * Update user role - Admin only
     */
    public UserResponse updateUserRole(UUID userId, UserRole newRole) {
        log.debug("Updating user role: {} to {}", userId, newRole);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setRole(newRole);
        User updated = userRepository.save(user);

        auditLogService.log("USER_ROLE_UPDATED", "User", updated.getId().toString(),
                "Updated role to: " + newRole + " for user: " + updated.getUsername());

        log.info("User role updated: {} to {}", updated.getUsername(), newRole);
        return mapToResponse(updated);
    }

    /**
     * Delete user - Admin only
     */
    public void deleteUser(UUID userId) {
        log.debug("Deleting user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        userRepository.delete(user);

        auditLogService.log("USER_DELETED", "User", userId.toString(),
                "Deleted user account: " + user.getUsername());

        log.info("User deleted: {}", user.getUsername());
    }

    /**
     * Change password - Any authenticated user
     */
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        log.debug("Changing password for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditLogService.log("PASSWORD_CHANGED", "User", userId.toString(),
                "Password changed for user: " + user.getUsername());

        log.info("Password changed for user: {}", user.getUsername());
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .region(user.getRegion())
                .role(user.getRole())
                .active(user.getActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
