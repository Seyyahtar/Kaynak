import { api } from '../utils/api';
import { HistoryRecord } from '../types';

export const historyService = {
    getAll: () => api.get<HistoryRecord[]>('/history'),

    create: (record: Partial<HistoryRecord>) => api.post<HistoryRecord>('/history', record),

    delete: (id: string) => api.delete(`/history/${id}`),

    clearAll: () => api.delete('/history'),
};
