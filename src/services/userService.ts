import { api } from '../utils/api';
import { User, UserRole } from '../types';

const API_BASE_URL = '/api';

export const userService = {
    /**
     * Authenticate user
     */
    async login(credentials: any): Promise<any> {
        try {
            return await api.post('/auth/login', credentials);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Get all users
     */
    async getAllUsers(): Promise<User[]> {
        try {
            return await api.get<User[]>('/users');
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    /**
     * Create a new user (Admin/Yönetici only)
     */
    async createUser(userData: {
        username: string;
        password: string;
        fullName: string;
        email?: string;
        phone?: string;
        region?: string;
        role: UserRole;
    }): Promise<User> {
        try {
            return await api.post<User>('/users', userData);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    /**
     * Update user role (Admin only)
     */
    async updateUserRole(userId: string, role: UserRole): Promise<User> {
        try {
            return await api.put<User>(`/users/${userId}/role`, { role });
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    },

    /**
     * Delete user (Admin only)
     */
    async deleteUser(userId: string): Promise<void> {
        try {
            await api.delete<void>(`/users/${userId}`);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    /**
     * Change password
     */
    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        try {
            await api.put<void>(`/users/${userId}/password`, { oldPassword, newPassword });
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    },

    /**
     * Update user details (Admin only)
     */
    async updateUserDetails(userId: string, data: { username: string; fullName: string; email?: string; phone?: string; region?: string }): Promise<User> {
        try {
            return await api.put<User>(`/users/${userId}/details`, data);
        } catch (error) {
            console.error('Error updating user details:', error);
            throw error;
        }
    },

    /**
     * Update user active status (Admin only)
     */
    async updateUserActiveStatus(userId: string, active: boolean): Promise<User> {
        try {
            return await api.put<User>(`/users/${userId}/active`, { active });
        } catch (error) {
            console.error('Error updating user active status:', error);
            throw error;
        }
    },

    /**
     * Reset user password (Admin only)
     */
    async resetUserPassword(userId: string, newPassword: string): Promise<void> {
        try {
            await api.put<void>(`/users/${userId}/reset-password`, { newPassword });
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    },
};
