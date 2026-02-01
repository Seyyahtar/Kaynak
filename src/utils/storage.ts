// LocalStorage yönetimi

import { StockItem, CaseRecord, HistoryRecord, User, ChecklistRecord } from '../types';
import { stockService } from '../services/stockService';
import { caseService } from '../services/caseService';
import { historyService } from '../services/historyService';
import { checklistService } from '../services/checklistService';
import { syncService } from '../services/syncService';

const STOCK_KEY = 'medical_inventory_stock';
const CASES_KEY = 'medical_inventory_cases';
const HISTORY_KEY = 'medical_inventory_history';
const USER_KEY = 'medical_inventory_user';
const CHECKLIST_KEY = 'medical_inventory_checklists';

export const storage = {
  // Stok işlemleri
  getStock: async (): Promise<StockItem[]> => {
    try {
      const user = storage.getUser();
      const userId = user?.id; // Standard UUID from backend
      const stock = await stockService.getAll(userId);
      // We could key by userId in localstorage for offline support, but for now simple sync
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
      const user = storage.getUser();
      const savedItem = await stockService.create(item, user?.id);
      await storage.getStock();
      return savedItem;
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      stock.push(item);
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
      syncService.addToQueue('ADD_STOCK', item);
      return item;
    }
  },

  bulkAddStock: async (items: StockItem[]) => {
    try {
      const user = storage.getUser();
      const savedItems = await stockService.bulkCreate(items, user?.id);
      await storage.getStock();
      return savedItems;
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      stock.push(...items);
      localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
      throw error;
    }
  },

  checkDuplicate: async (materialName: string, serialLotNumber: string): Promise<boolean> => {
    try {
      const user = storage.getUser();
      if (user?.id) {
        return await stockService.checkDuplicate(materialName, serialLotNumber, user.id);
      }
      // Fallback to local check if no user (offline?)
      const stock = await storage.getStock();
      return stock.some(
        item => item.materialName.toLowerCase() === materialName.toLowerCase() &&
          item.serialLotNumber.toLowerCase() === serialLotNumber.toLowerCase()
      );
    } catch (e) {
      const stock = await storage.getStock();
      return stock.some(
        item => item.materialName.toLowerCase() === materialName.toLowerCase() &&
          item.serialLotNumber.toLowerCase() === serialLotNumber.toLowerCase()
      );
    }
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
      syncService.addToQueue('ADD_CASE', caseRecord);
      return caseRecord;
    }
  },

  // Geçmiş işlemleri
  getHistory: async (): Promise<HistoryRecord[]> => {
    try {
      const user = storage.getUser();
      const history = await historyService.getAll(user?.id);
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
      syncService.addToQueue('ADD_HISTORY', record);
    }
  },

  // Kullanıcı işlemleri
  getUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveUser: (user: User | { username: string; loginDate: string }) => {
    // Backwards compatibility: convert old format to new format if needed
    if (!('role' in user)) {
      const newUser: User = {
        id: '00000000-0000-0000-0000-000000000002', // temp ID for old users
        username: user.username,
        fullName: user.username,
        role: 'KULLANICI',
        active: true,
        createdAt: user.loginDate || new Date().toISOString(),
        loginDate: user.loginDate,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  clearUser: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('token');
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  deleteStockItem: async (id: string) => {
    try {
      const user = storage.getUser();
      await stockService.delete(id, user?.id);
      await storage.getStock();
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      const filtered = stock.filter((item: any) => item.id !== id);
      localStorage.setItem(STOCK_KEY, JSON.stringify(filtered));
      syncService.addToQueue('DELETE_STOCK', { id });
    }
  },

  updateStockItem: async (id: string, updatedItem: StockItem) => {
    try {
      const user = storage.getUser();
      await stockService.update(id, updatedItem, user?.id);
      await storage.getStock();
    } catch (error) {
      const stock = JSON.parse(localStorage.getItem(STOCK_KEY) || '[]');
      const index = stock.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        stock[index] = updatedItem;
        localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
        syncService.addToQueue('UPDATE_STOCK', updatedItem);
      }
    }
  },

  removeHistory: async (id: string) => {
    try {
      const user = storage.getUser();
      await historyService.delete(id, user?.id);
      await storage.getHistory();
    } catch (error) {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const filtered = history.filter((item: any) => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    }
  },

  // Kontrol listesi işlemleri - Migrated to backend
  getChecklists: async (): Promise<ChecklistRecord[]> => {
    try {
      const checklists = await checklistService.getAll('00000000-0000-0000-0000-000000000002');
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklists));
      return checklists;
    } catch (error) {
      const data = localStorage.getItem(CHECKLIST_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  saveChecklist: async (checklist: ChecklistRecord) => {
    try {
      const saved = await checklistService.create('00000000-0000-0000-0000-000000000002', checklist);
      await storage.getChecklists();
      return saved;
    } catch (error) {
      const checklists = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '[]');
      checklists.push(checklist);
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklists));
      throw error;
    }
  },

  updateChecklist: async (checklist: ChecklistRecord) => {
    try {
      const updated = await checklistService.update(checklist.id, '00000000-0000-0000-0000-000000000002', checklist);
      await storage.getChecklists();
      return updated;
    } catch (error) {
      const checklists = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '[]');
      const index = checklists.findIndex((c: any) => c.id === checklist.id);
      if (index !== -1) {
        checklists[index] = checklist;
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklists));
      }
      throw error;
    }
  },

  completeChecklist: async (id: string) => {
    try {
      const completed = await checklistService.complete(id, '00000000-0000-0000-0000-000000000002');
      await storage.getChecklists();
      return completed;
    } catch (error) {
      const checklists = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '[]');
      const index = checklists.findIndex((c: any) => c.id === id);
      if (index !== -1) {
        checklists[index].isCompleted = true;
        checklists[index].completedDate = new Date().toISOString().split('T')[0];
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklists));
      }
      throw error;
    }
  },

  getActiveChecklist: async (): Promise<ChecklistRecord | null> => {
    try {
      const active = await checklistService.getActive('00000000-0000-0000-0000-000000000002');
      return active;
    } catch (error) {
      const checklists = await storage.getChecklists();
      const active = checklists.find(c => !c.isCompleted);
      return active || null;
    }
  },
};
