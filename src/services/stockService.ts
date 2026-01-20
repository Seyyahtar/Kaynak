import { api } from '../utils/api';
import { StockItem } from '../types';

export const stockService = {
    getAll: () => api.get<StockItem[]>('/stocks'),

    getById: (id: string) => api.get<StockItem>(`/stocks/${id}`),

    create: (item: Partial<StockItem>) => api.post<StockItem>('/stocks', item),

    update: (id: string, item: Partial<StockItem>) => api.put<StockItem>(`/stocks/${id}`, item),

    delete: (id: string) => api.delete(`/stocks/${id}`),

    bulkUpdate: (items: any[]) => api.post('/stocks/bulk', items),
};
