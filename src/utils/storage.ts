// LocalStorage yönetimi

import { StockItem, CaseRecord, HistoryRecord, User, ChecklistRecord } from '../types';

const STOCK_KEY = 'medical_inventory_stock';
const CASES_KEY = 'medical_inventory_cases';
const HISTORY_KEY = 'medical_inventory_history';
const USER_KEY = 'medical_inventory_user';
const CHECKLIST_KEY = 'medical_inventory_checklists';

export const storage = {
  // Stok işlemleri
  getStock: (): StockItem[] => {
    const data = localStorage.getItem(STOCK_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveStock: (stock: StockItem[]) => {
    localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
  },
  
  addStock: (item: StockItem) => {
    const stock = storage.getStock();
    stock.push(item);
    storage.saveStock(stock);
  },
  
  // Stokta aynı malzeme ve seri/lot numarasının olup olmadığını kontrol et
  checkDuplicate: (materialName: string, serialLotNumber: string): boolean => {
    const stock = storage.getStock();
    return stock.some(
      item => item.materialName.toLowerCase() === materialName.toLowerCase() && 
              item.serialLotNumber.toLowerCase() === serialLotNumber.toLowerCase()
    );
  },
  
  removeStock: (items: { materialName: string; serialLotNumber: string; quantity: number }[]) => {
    const stock = storage.getStock();
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
    storage.saveStock(stock);
  },
  
  // Vaka işlemleri
  getCases: (): CaseRecord[] => {
    const data = localStorage.getItem(CASES_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveCase: (caseRecord: CaseRecord) => {
    const cases = storage.getCases();
    cases.push(caseRecord);
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  },
  
  // Geçmiş işlemleri
  getHistory: (): HistoryRecord[] => {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  addHistory: (record: HistoryRecord) => {
    const history = storage.getHistory();
    history.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
  
  // Stok itemini ID'ye göre sil
  deleteStockItem: (id: string) => {
    const stock = storage.getStock();
    const filtered = stock.filter(item => item.id !== id);
    storage.saveStock(filtered);
  },
  
  // Stok itemini güncelle
  updateStockItem: (id: string, updatedItem: StockItem) => {
    const stock = storage.getStock();
    const index = stock.findIndex(item => item.id === id);
    if (index !== -1) {
      stock[index] = updatedItem;
      storage.saveStock(stock);
    }
  },
  
  // Geçmiş kaydını sil
  removeHistory: (id: string) => {
    const history = storage.getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  },
  
  // Kontrol listesi işlemleri
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
