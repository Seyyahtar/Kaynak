import { CustomField, FieldDataType } from '../types';

const STORAGE_KEY = 'custom_fields';

// Default fields that cannot be deleted
const DEFAULT_FIELDS: CustomField[] = [
    { id: 'serial_number', name: 'Seri No', dataType: 'text', isDefault: true },
    { id: 'lot_number', name: 'Lot No', dataType: 'text', isDefault: true },
    { id: 'expiry_date', name: 'SKT', dataType: 'date', isDefault: true },
    { id: 'ubb_code', name: 'UBB', dataType: 'text', isDefault: true },
    { id: 'product_code', name: 'Ürün Kodu', dataType: 'text', isDefault: true },
];

class CustomFieldService {
    // Get all custom fields (default + user-created)
    getCustomFields(): CustomField[] {
        const customFields = this.getUserCustomFields();
        return [...DEFAULT_FIELDS, ...customFields];
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
