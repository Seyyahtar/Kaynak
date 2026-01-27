// Veri tipleri

export interface StockItem {
  id: string;
  materialName: string;
  serialLotNumber: string;
  ubbCode: string;
  expiryDate: string; // SKT
  quantity: number;
  dateAdded: string;
  from?: string; // Kimden
  to?: string; // Kime
  materialCode?: string; // Malzeme Kodu (Excel'den gelen)
}

export interface CaseRecord {
  id: string;
  date: string;
  hospitalName: string;
  doctorName: string;
  patientName: string;
  notes?: string;
  materials: {
    materialName: string;
    serialLotNumber: string;
    ubbCode: string;
    quantity: number;
  }[];
}

export interface ChecklistPatient {
  id: string;
  name: string; // ADI SOYADI
  note?: string; // NOT
  phone?: string; // TELEFON
  city?: string; // ŞEHİR
  hospital?: string; // HASTANE ADI
  date?: string; // TARİH
  time?: string; // SAAT
  checked: boolean;
}

export interface ChecklistRecord {
  id: string;
  title: string;
  createdDate: string;
  completedDate?: string;
  patients: ChecklistPatient[];
  isCompleted: boolean;
}

export interface HistoryRecord {
  id: string;
  date: string;
  type: 'stock-add' | 'stock-remove' | 'case' | 'stock-delete' | 'checklist';
  description: string;
  details: any;
  userId?: string;
}

export type UserRole = 'ADMIN' | 'YONETICI' | 'DEPO' | 'KULLANICI';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  region?: string;
  role: UserRole;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  loginDate?: string; // For backwards compatibility
}

export type Page = 'home' | 'stock' | 'case-entry' | 'history' | 'settings' | 'stock-management' | 'checklist' | 'admin-panel' | 'add-user' | 'manage-users' | 'stock-selection';

export interface TransferItemRequest {
  stockItemId: string;
  quantity: number;
}

export interface TransferRequest {
  receiverId: string;
  items: TransferItemRequest[];
}
