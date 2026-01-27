package com.stok.app.entity;

/**
 * User Role Enum
 * Defines the different roles in the system
 */
public enum UserRole {
    /**
     * Admin - Full access to everything, can manage users and all data
     */
    ADMIN,

    /**
     * Yönetici - Can add users and view all data, but cannot delete users or change
     * roles
     */
    YONETICI,

    /**
     * Depo - Stock management and case entry, can only see own data
     */
    DEPO,

    /**
     * Kullanıcı - Basic user with limited access, can only see own data
     */
    KULLANICI
}
