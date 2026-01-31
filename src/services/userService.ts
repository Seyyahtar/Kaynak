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
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user');
            }

            return data.data;
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
            const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user role');
            }

            return data.data;
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
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user');
            }
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
            const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    },
};
