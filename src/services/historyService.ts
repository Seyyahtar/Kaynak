import { api } from '../utils/api';
import { HistoryRecord } from '../types';

export const historyService = {
    getAll: async (userId?: string) => {
        const url = userId ? `/history?userId=${userId}` : '/history';
        const history = await api.get<any[]>(url);
        return history.map(h => ({
            ...h,
            date: h.recordDate, // Map backend 'recordDate' to frontend 'date'
        }));
    },

    create: (record: Partial<HistoryRecord>) => api.post<HistoryRecord>('/history', record),

    delete: (id: string, userId?: string) => api.delete(`/history/${id}${userId ? `?userId=${userId}` : ''}`),

    deleteAll: (userId?: string) => api.delete(`/history/all${userId ? `?userId=${userId}` : ''}`),
};
