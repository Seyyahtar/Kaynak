import { api } from '../utils/api';
import { CustomField, FieldDataType } from '../types';

// Default fields that always exist (locally defined, not sent to backend as they are system defaults)
const DEFAULT_FIELDS: CustomField[] = [
    { id: 'quantity', name: 'Miktar', dataType: 'number', isDefault: true, isActive: true },
    { id: 'serial_number', name: 'Seri No', dataType: 'text', isDefault: true, isActive: true },
    { id: 'lot_number', name: 'Lot No', dataType: 'text', isDefault: true, isActive: true },
    { id: 'expiry_date', name: 'SKT', dataType: 'date', isDefault: true, isActive: true },
    { id: 'ubb_code', name: 'UBB', dataType: 'text', isDefault: true, isActive: true },
    { id: 'product_code', name: 'Ürün Kodu', dataType: 'text', isDefault: true, isActive: true },
];

// Map backend response to frontend CustomField type
const mapFromBackend = (item: any): CustomField => ({
    id: item.id,
    name: item.name,
    dataType: (item.dataType || 'text') as FieldDataType,
    isDefault: false,
    isActive: item.isActive ?? true,
    isClassified: item.isClassified ?? false,
});

// Helper functions to manage default field states in localStorage
const getStoredList = (key: string): string[] => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
};

const toggleInStoredList = (key: string, id: string): boolean => {
    const list = getStoredList(key);
    const index = list.indexOf(id);
    if (index >= 0) {
        list.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(list));
        return false; // Result represents if it's currently IN the list
    } else {
        list.push(id);
        localStorage.setItem(key, JSON.stringify(list));
        return true;
    }
};

class CustomFieldService {

    /**
     * Returns default fields merged with user-created fields from backend.
     */
    async getCustomFields(): Promise<CustomField[]> {
        const inactiveFields = getStoredList('inactive_fields');
        const classifiedFields = getStoredList('classified_fields');

        const defaultFieldsWithState = DEFAULT_FIELDS.map(f => ({
            ...f,
            isActive: !inactiveFields.includes(f.id),
            isClassified: classifiedFields.includes(f.id)
        }));

        try {
            const backendFields: any[] = await api.get('/product-fields');
            const userFields = backendFields.map(mapFromBackend);
            return [...defaultFieldsWithState, ...userFields];
        } catch (error) {
            console.warn('Backend bağlanamadı, varsayılan alanlar kullanılıyor', error);
            return [...defaultFieldsWithState];
        }
    }

    async getUserCustomFields(): Promise<CustomField[]> {
        try {
            const backendFields: any[] = await api.get('/product-fields');
            return backendFields.map(mapFromBackend);
        } catch (error) {
            console.warn('Backend bağlanamadı', error);
            return [];
        }
    }

    getDefaultFields(): CustomField[] {
        return DEFAULT_FIELDS;
    }

    async addCustomField(name: string, dataType: FieldDataType): Promise<CustomField> {
        const item: any = await api.post('/product-fields', { name: name.trim(), dataType });
        return mapFromBackend(item);
    }

    async deleteCustomField(fieldId: string): Promise<void> {
        await api.delete(`/product-fields/${fieldId}`);
    }

    async toggleFieldStatus(fieldId: string): Promise<CustomField> {
        if (DEFAULT_FIELDS.some(f => f.id === fieldId)) {
            toggleInStoredList('inactive_fields', fieldId);
            const allFields = await this.getCustomFields();
            return allFields.find(f => f.id === fieldId) || DEFAULT_FIELDS.find(f => f.id === fieldId)!;
        }

        const item: any = await api.put(`/product-fields/${fieldId}/toggle-active`);
        return mapFromBackend(item);
    }

    async toggleFieldClassification(fieldId: string): Promise<CustomField> {
        if (DEFAULT_FIELDS.some(f => f.id === fieldId)) {
            toggleInStoredList('classified_fields', fieldId);
            const allFields = await this.getCustomFields();
            return allFields.find(f => f.id === fieldId) || DEFAULT_FIELDS.find(f => f.id === fieldId)!;
        }

        const item: any = await api.put(`/product-fields/${fieldId}/toggle-classified`);
        return mapFromBackend(item);
    }

    async isFieldActive(fieldId: string): Promise<boolean> {
        if (DEFAULT_FIELDS.some(f => f.id === fieldId)) {
            const inactiveFields = getStoredList('inactive_fields');
            return !inactiveFields.includes(fieldId);
        }
        const fields = await this.getUserCustomFields();
        const found = fields.find(f => f.id === fieldId);
        return found ? (found.isActive ?? true) : true;
    }

    async isFieldClassified(fieldId: string): Promise<boolean> {
        if (DEFAULT_FIELDS.some(f => f.id === fieldId)) {
            const classifiedFields = getStoredList('classified_fields');
            return classifiedFields.includes(fieldId);
        }
        const fields = await this.getUserCustomFields();
        const found = fields.find(f => f.id === fieldId);
        return found ? (found.isClassified ?? false) : false;
    }

    async isFieldNameExists(name: string, excludeId?: string): Promise<boolean> {
        const allFields = await this.getCustomFields();
        const normalized = name.trim().toLowerCase();
        return allFields.some(f => f.name.toLowerCase() === normalized && f.id !== excludeId);
    }

    async getFieldById(fieldId: string): Promise<CustomField | undefined> {
        const allFields = await this.getCustomFields();
        return allFields.find(f => f.id === fieldId);
    }
}

export const customFieldService = new CustomFieldService();
