import { api } from '../utils/api';
import { CaseRecord } from '../types';
import { APP_CONFIG } from '../config';

const parseFilenameFromDisposition = (disposition: string | null): string | null => {
    if (!disposition) return null;
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }
    const simpleMatch = disposition.match(/filename="?([^"]+)"?/i);
    return simpleMatch?.[1] || null;
};

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

    exportImplantList: async (startDate: string, endDate: string, userId?: string) => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            startDate,
            endDate,
        });

        if (userId) {
            params.append('userId', userId);
        }

        const response = await fetch(`${APP_CONFIG.API_BASE_URL}/cases/implant-list/export?${params.toString()}`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            let message = `API Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData?.message) {
                    message = errorData.message;
                }
            } catch {
                // Non-JSON error body, keep fallback message
            }
            throw new Error(message);
        }

        const blob = await response.blob();
        const filename = parseFilenameFromDisposition(response.headers.get('content-disposition'))
            || `BIO-TR_implant_list_${startDate}_${endDate}.xlsx`;

        return { blob, filename };
    },

    deleteAll: () => api.delete('/cases/all'),

    delete: (id: string) => api.delete(`/cases/${id}`),
};
