import { api } from '../utils/api';
import { CaseRecord } from '../types';

export const caseService = {
    getAll: async () => {
        const cases = await api.get<any[]>('/cases');
        return cases.map(c => ({
            ...c,
            date: c.caseDate, // Map backend 'caseDate' to frontend 'date'
        }));
    },

    getById: async (id: string) => {
        const c = await api.get<any>(`/cases/${id}`);
        return {
            ...c,
            date: c.caseDate,
        };
    },

    create: (caseData: any) => {
        const payload = {
            ...caseData,
            caseDate: caseData.date, // Map frontend 'date' to backend 'caseDate'
        };
        return api.post<CaseRecord>('/cases', payload);
    },

    deleteAll: () => api.delete('/cases/all'),

    delete: (id: string) => api.delete(`/cases/${id}`),
};
