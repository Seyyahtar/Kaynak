// LocalStorage yönetimi

import { StockItem, CaseRecord, HistoryRecord, User, ChecklistRecord } from '../types';
import { stockService } from '../services/stockService';
import { caseService } from '../services/caseService';
import { historyService } from '../services/historyService';

const STOCK_KEY = 'medical_inventory_stock';
const CASES_KEY = 'medical_inventory_cases';
const HISTORY_KEY = 'medical_inventory_history';
const USER_KEY = 'medical_inventory_user';
const CHECKLIST_KEY = 'medical_inventory_checklists';

export const storage = {
  // Stok işlemleri
  getStock: async (): Promise<StockItem[]> => {
    try {
      const stock = await stockService.getAll();
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
      return stock;
    } catch (error) {
      console.warn('Backend connection failed, using local storage', error);
      const data = localStorage.getItem(STOCK_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  saveStock: async (stock: StockItem[]) => {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
    // Bulk sync could be implemented here if backend supports it
  },

  addStock: async (item: StockItem) => {
    try {
      const savedItem = await stockService.create(item);
      const stock = await storage.getStock();
      return savedItem;
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      stock.push(item);
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
      throw error;
    }
  },

  checkDuplicate: async (materialName: string, serialLotNumber: string): Promise<boolean> => {
    const stock = await storage.getStock();
    return stock.some(
      item => item.materialName.toLowerCase() === materialName.toLowerCase() &&
        item.serialLotNumber.toLowerCase() === serialLotNumber.toLowerCase()
    );
  },

  removeStock: async (items: { materialName: string; serialLotNumber: string; quantity: number }[]) => {
    // This is handled by backend during Case creation, but for manual removal:
    const stock = await storage.getStock();
    items.forEach(item => {
      const index = stock.findIndex(
        s => s.materialName === item.materialName && s.serialLotNumber === item.serialLotNumber
      );
      if (index !== -1) {
        stock[index].quantity -= item.quantity;
        if (stock[index].quantity <= 0) {
          stock.splice(index, 1);
        }
      }
    });
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
  },

  // Vaka işlemleri
  getCases: async (): Promise<CaseRecord[]> => {
    try {
      const cases = await caseService.getAll();
      localStorage.setItem(CASES_KEY, JSON.stringify(cases));
      return cases;
    } catch (error) {
      const data = localStorage.getItem(CASES_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  saveCase: async (caseRecord: CaseRecord) => {
    try {
      const savedCase = await caseService.create({
        ...caseRecord,
        userId: '00000000-0000-0000-0000-000000000002' // Default test user
      });
      await storage.getCases(); // refresh local
      return savedCase;
    } catch (error) {
      const cases = JSON.parse(localStorage.getItem(CASES_KEY) || '[]');
      cases.push(caseRecord);
      localStorage.setItem(CASES_KEY, JSON.stringify(cases));
      throw error;
    }
  },

  // Geçmiş işlemleri
  getHistory: async (): Promise<HistoryRecord[]> => {
    try {
      const history = await historyService.getAll();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return history;
    } catch (error) {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  addHistory: async (record: HistoryRecord) => {
    try {
      await historyService.create({
        ...record,
        userId: '00000000-0000-0000-0000-000000000002'
      });
      await storage.getHistory();
    } catch (error) {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.unshift(record);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  },

  // Kullanıcı işlemleri
  getUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser: () => {
    localStorage.removeItem(USER_KEY);
  },

  deleteStockItem: async (id: string) => {
    try {
      await stockService.delete(id);
      await storage.getStock();
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      const filtered = stock.filter((item: any) => item.id !== id);
      localStorage.setItem(STOCK_KEY, JSON.stringify(filtered));
      throw error;
    }
  },

  updateStockItem: async (id: string, updatedItem: StockItem) => {
    try {
      await stockService.update(id, updatedItem);
      await storage.getStock();
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      const index = stock.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        stock[index] = updatedItem;
        localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
      }
      throw error;
    }
  },

  removeHistory: async (id: string) => {
    try {
      await historyService.delete(id);
      await storage.getHistory();
    } catch (error) {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const filtered = history.filter((item: any) => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    }
  },

  // Kontrol listesi işlemleri (Henüz backend'de yoksa local kalsın)
  getChecklists: (): ChecklistRecord[] => {
    const data = localStorage.getItem(CHECKLIST_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveChecklist: (checklist: ChecklistRecord) => {
    const checklists = storage.getChecklists();
    checklists.push(checklist);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklists));
  },

  updateChecklist: (checklist: ChecklistRecord) => {
    const checklists = storage.getChecklists();
    const index = checklists.findIndex(c => c.id === checklist.id);
    if (index !== -1) {
      checklists[index] = checklist;
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklists));
    }
  },

  getActiveChecklist: (): ChecklistRecord | null => {
    const checklists = storage.getChecklists();
    const active = checklists.find(c => !c.isCompleted);
    return active || null;
  },
};
