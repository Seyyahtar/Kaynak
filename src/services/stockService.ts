import { api } from '../utils/api';
import { StockItem } from '../types';

export const stockService = {
    getAll: (userId?: string) => api.get<StockItem[]>(`/stocks${userId ? `?userId=${userId}` : ''}`),

    getById: (id: string, userId?: string) => api.get<StockItem>(`/stocks/${id}${userId ? `?userId=${userId}` : ''}`),

    create: (item: Partial<StockItem>, userId?: string) => api.post<StockItem>(`/stocks${userId ? `?userId=${userId}` : ''}`, item),

    update: (id: string, item: Partial<StockItem>, userId?: string) => api.put<StockItem>(`/stocks/${id}${userId ? `?userId=${userId}` : ''}`, item),

    delete: (id: string, userId?: string) => api.delete(`/stocks/${id}${userId ? `?userId=${userId}` : ''}`),

    deleteAll: (userId?: string) => api.delete(`/stocks/all${userId ? `?userId=${userId}` : ''}`),

    bulkCreate: (items: Partial<StockItem>[], userId?: string) => api.post<StockItem[]>(`/stocks/bulk${userId ? `?userId=${userId}` : ''}`, items),

    bulkUpdate: (items: any[], userId?: string) => api.post(`/stocks/bulk-update${userId ? `?userId=${userId}` : ''}`, items),

    initiateTransfer: (receiverId: string, items: { stockItemId: string; quantity: number }[], userId?: string) => api.post(`/stocks/transfer${userId ? `?userId=${userId}` : ''}`, { receiverId, items }),

    checkDuplicate: (materialName: string, serialLotNumber: string, userId?: string) =>
        api.get<boolean>(`/stocks/check-duplicate?materialName=${encodeURIComponent(materialName)}&serialLotNumber=${encodeURIComponent(serialLotNumber)}${userId ? `&userId=${userId}` : ''}`),
};
