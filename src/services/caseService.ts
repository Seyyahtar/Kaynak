import { api } from '../utils/api';
import { CaseRecord } from '../types';

export const caseService = {
    getAll: () => api.get<CaseRecord[]>('/cases'),

    getById: (id: string) => api.get<CaseRecord>(`/cases/${id}`),

    create: (caseData: any) => api.post<CaseRecord>('/cases', caseData),

    delete: (id: string) => api.delete(`/cases/${id}`),
};
