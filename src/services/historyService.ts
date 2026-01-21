import { api } from '../utils/api';
import { HistoryRecord } from '../types';

export const historyService = {
    getAll: async () => {
        const history = await api.get<any[]>('/history');
        return history.map(h => ({
            ...h,
            date: h.recordDate, // Map backend 'recordDate' to frontend 'date'
        }));
    },

    create: (record: Partial<HistoryRecord>) => api.post<HistoryRecord>('/history', record),

    delete: (id: string) => api.delete(`/history/${id}`),

    deleteAll: () => api.delete('/history/all'),
};
