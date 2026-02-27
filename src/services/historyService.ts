import { api } from '../utils/api';
import { HistoryRecord } from '../types';

// Helper function to map backend history record to frontend HistoryRecord
// Assuming HistoryRecord type expects 'date' and backend provides 'recordDate'
const mapFromBackend = (h: any): HistoryRecord => ({
    ...h,
    date: h.recordDate, // Map backend 'recordDate' to frontend 'date'
});

export const historyService = {
    /**
     * Get history records with optional filters
     */
    async getAll(filters?: {
        userId?: string;
        startDate?: string;
        endDate?: string;
        type?: string;
        search?: string;
        userIds?: string[];
    }): Promise<HistoryRecord[]> {
        let queryString = '';
        if (filters) {
            const params = new URLSearchParams();
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.type && filters.type !== 'all') params.append('type', filters.type);
            if (filters.search) params.append('search', filters.search);
            if (filters.userIds && filters.userIds.length > 0) {
                // Spring accepts comma-separated list or multiple parameters
                params.append('userIds', filters.userIds.join(','));
            }
            queryString = `?${params.toString()}`;
        }

        const items: any[] = await api.get(`/history${queryString}`);
        return items.map(mapFromBackend);
    },



    delete: (id: string, userId?: string) => api.delete(`/history/${id}${userId ? `?userId=${userId}` : ''}`),

    deleteAll: (userId?: string) => api.delete(`/history/all${userId ? `?userId=${userId}` : ''}`),
};
