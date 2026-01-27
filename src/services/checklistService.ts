import { api } from '../utils/api';
import { ChecklistRecord } from '../types';

export const checklistService = {
    getAll: (userId: string) =>
        api.get<ChecklistRecord[]>(`/checklists?userId=${userId}`),

    getActive: (userId: string) =>
        api.get<ChecklistRecord>(`/checklists/active?userId=${userId}`),

    create: (userId: string, data: Partial<ChecklistRecord>) =>
        api.post<ChecklistRecord>(`/checklists?userId=${userId}`, data),

    update: (id: string, userId: string, data: Partial<ChecklistRecord>) =>
        api.put<ChecklistRecord>(`/checklists/${id}?userId=${userId}`, data),

    complete: (id: string, userId: string) =>
        api.post<ChecklistRecord>(`/checklists/${id}/complete?userId=${userId}`, {}),
};
