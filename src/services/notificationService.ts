import { api } from '../utils/api';
import { User } from '../types';

export enum NotificationType {
    TRANSFER_REQUEST = 'TRANSFER_REQUEST',
    TRANSFER_RESULT = 'TRANSFER_RESULT',
    INFO = 'INFO'
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    READ = 'READ',
    PROCESSED = 'PROCESSED'
}

export enum NotificationActionStatus {
    WAITING = 'WAITING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface AppNotification {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    type: NotificationType;
    title: string;
    content: string;
    status: NotificationStatus;
    actionStatus: NotificationActionStatus;
    createdAt: string;
}

export const notificationService = {
    getUserNotifications: (userId: string) => api.get<AppNotification[]>(`/notifications/${userId}`),

    getUnreadNotifications: (userId: string) => api.get<AppNotification[]>(`/notifications/${userId}/unread`),

    markAsRead: (id: string) => api.put<void>(`/notifications/${id}/read`, {}),

    processAction: (id: string, action: NotificationActionStatus) => api.post<void>(`/notifications/${id}/action`, { action }),
};
