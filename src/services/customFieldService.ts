import { CustomField, FieldDataType } from '../types';

const STORAGE_KEY = 'custom_fields';

// Default fields that cannot be deleted
const DEFAULT_FIELDS: CustomField[] = [
    { id: 'quantity', name: 'Miktar', dataType: 'number', isDefault: true, isActive: true },
    { id: 'serial_number', name: 'Seri No', dataType: 'text', isDefault: true, isActive: true },
    { id: 'lot_number', name: 'Lot No', dataType: 'text', isDefault: true, isActive: true },
    { id: 'expiry_date', name: 'SKT', dataType: 'date', isDefault: true, isActive: true },
    { id: 'ubb_code', name: 'UBB', dataType: 'text', isDefault: true, isActive: true },
    { id: 'product_code', name: 'Ürün Kodu', dataType: 'text', isDefault: true, isActive: true },
];

class CustomFieldService {
    // Get all custom fields (default + user-created)
    getCustomFields(): CustomField[] {
        const customFields = this.getUserCustomFields();
        const allFields = [...DEFAULT_FIELDS, ...customFields];
        return allFields.map(f => ({
            ...f,
            isActive: this.isFieldActive(f.id)
        }));
    }

    // Get only user-created custom fields
    getUserCustomFields(): CustomField[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Error parsing custom fields:', error);
            return [];
        }
    }

    // Get default fields
    getDefaultFields(): CustomField[] {
        return DEFAULT_FIELDS;
    }

    // Add a new custom field
    addCustomField(name: string, dataType: FieldDataType): CustomField {
        // Check if field name already exists
        if (this.isFieldNameExists(name)) {
            throw new Error('Bu başlık adı zaten kullanılıyor');
        }

        const customFields = this.getUserCustomFields();
        const newField: CustomField = {
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            dataType,
            isDefault: false,
            isActive: true,
        };

        customFields.push(newField);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customFields));

        return newField;
    }

    // Delete a custom field
    // Note: Products with this field should be cleaned up by the UI layer
    deleteCustomField(fieldId: string): void {
        const customFields = this.getUserCustomFields();
        const field = customFields.find(f => f.id === fieldId);

        if (!field) {
            throw new Error('Başlık bulunamadı');
        }

        if (field.isDefault) {
            throw new Error('Varsayılan başlıklar silinemez');
        }

        // Remove from custom fields list
        const updatedFields = customFields.filter(f => f.id !== fieldId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFields));
    }

    // Toggle field active status
    toggleFieldStatus(fieldId: string): void {
        // Handle default fields in memory issues? 
        // Default fields are constants, we can't persist changes to them easily unless we store "overrides" or change approach.
        // For now, let's look at getUserCustomFields. 
        // If we want to toggle DEFAULT fields, we need to store their status in localStorage too.
        // Since DEFAULT_FIELDS is a const, we should probably refactor how we merge them.

        // Let's implement a simple "overrides" or just store everything in LS with seeding.
        // Or simpler: We will just modify how getCustomFields works or add a separate storage for status.

        // Ideally, we persist ALL fields (even defaults) to LS on first load, then read from LS. 
        // But to keep it simple with current architecture:
        // We will store "inactiveFieldIds" in localStorage.

        const inactiveIds = JSON.parse(localStorage.getItem('inactive_fields') || '[]');
        const index = inactiveIds.indexOf(fieldId);

        if (index === -1) {
            inactiveIds.push(fieldId);
        } else {
            inactiveIds.splice(index, 1);
        }

        localStorage.setItem('inactive_fields', JSON.stringify(inactiveIds));
    }

    // Load active status
    isFieldActive(fieldId: string): boolean {
        const inactiveIds = JSON.parse(localStorage.getItem('inactive_fields') || '[]');
        return !inactiveIds.includes(fieldId);
    }

    // Check if a field name already exists
    isFieldNameExists(name: string, excludeId?: string): boolean {
        const normalizedName = name.trim().toLowerCase();
        const allFields = this.getCustomFields();

        return allFields.some(field =>
            field.name.toLowerCase() === normalizedName && field.id !== excludeId
        );
    }

    // Get field by ID
    getFieldById(fieldId: string): CustomField | undefined {
        return this.getCustomFields().find(f => f.id === fieldId);
    }
}

export const customFieldService = new CustomFieldService();
