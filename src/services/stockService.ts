import { api } from '../utils/api';
import { StockItem } from '../types';

// Map frontend field names to backend field names
const mapToBackend = (item: Partial<StockItem>) => ({
    materialName: item.materialName,
    serialLotNumber: item.serialLotNumber,
    ubbCode: item.ubbCode,
    expiryDate: item.expiryDate || null,
    quantity: item.quantity,
    dateAdded: item.dateAdded || null,
    fromField: item.from || '',
    toField: item.to || '',
    materialCode: item.materialCode || '',
});

export const stockService = {
    getAll: (userId?: string) => api.get<StockItem[]>(`/stocks${userId ? `?userId=${userId}` : ''}`),

    getById: (id: string, userId?: string) => api.get<StockItem>(`/stocks/${id}${userId ? `?userId=${userId}` : ''}`),

    create: (item: Partial<StockItem>, userId?: string) => api.post<StockItem>(`/stocks${userId ? `?userId=${userId}` : ''}`, mapToBackend(item)),

    update: (id: string, item: Partial<StockItem>, userId?: string) => api.put<StockItem>(`/stocks/${id}${userId ? `?userId=${userId}` : ''}`, mapToBackend(item)),

    delete: (id: string, userId?: string) => api.delete(`/stocks/${id}${userId ? `?userId=${userId}` : ''}`),

    deleteAll: (userId?: string) => api.delete(`/stocks/all${userId ? `?userId=${userId}` : ''}`),

    bulkCreate: (items: Partial<StockItem>[], userId?: string) => api.post<StockItem[]>(`/stocks/bulk${userId ? `?userId=${userId}` : ''}`, items.map(mapToBackend)),

    bulkUpdate: (items: any[], userId?: string) => api.post(`/stocks/bulk-update${userId ? `?userId=${userId}` : ''}`, items),

    initiateTransfer: (receiverId: string, items: { stockItemId: string; quantity: number }[], userId?: string) => api.post(`/stocks/transfer${userId ? `?userId=${userId}` : ''}`, { receiverId, items }),

    checkDuplicate: (materialName: string, serialLotNumber: string, userId?: string) =>
        api.get<boolean>(`/stocks/check-duplicate?materialName=${encodeURIComponent(materialName)}&serialLotNumber=${encodeURIComponent(serialLotNumber)}${userId ? `&userId=${userId}` : ''}`),
};
