import { api } from '../utils/api';
import { Product } from '../types';

// Map backend ProductItemResponse to frontend Product type
const mapFromBackend = (item: any): Product => ({
    id: item.id,
    name: item.name,
    productCode: item.productCode || '',
    quantity: item.quantity,
    serialNumber: item.serialNumber || '',
    lotNumber: item.lotNumber || '',
    expiryDate: item.expiryDate || '',
    ubbCode: item.ubbCode || '',
    customFields: item.customFields || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
});

// Map frontend Product to backend request body
const mapToBackend = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Partial<Product>) => ({
    name: (data as any).name,
    productCode: (data as any).productCode || null,
    quantity: (data as any).quantity ?? null,
    serialNumber: (data as any).serialNumber || null,
    lotNumber: (data as any).lotNumber || null,
    expiryDate: (data as any).expiryDate || null,
    ubbCode: (data as any).ubbCode || null,
    customFields: (data as any).customFields || {},
});

class ProductService {

    async getProducts(): Promise<Product[]> {
        const items: any[] = await api.get('/products');
        return items.map(mapFromBackend);
    }

    async getProductById(id: string): Promise<Product | undefined> {
        try {
            const item: any = await api.get(`/products/${id}`);
            return mapFromBackend(item);
        } catch {
            return undefined;
        }
    }

    async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
        const item: any = await api.post('/products', mapToBackend(productData));
        return mapFromBackend(item);
    }

    async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
        const item: any = await api.put(`/products/${id}`, mapToBackend(productData));
        return mapFromBackend(item);
    }

    async deleteProduct(id: string): Promise<void> {
        await api.delete(`/products/${id}`);
    }

    async deleteAllProducts(): Promise<void> {
        await api.delete('/products/all');
    }

    async bulkCreateProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Product[]> {
        const items: any[] = await api.post('/products/bulk', products.map(mapToBackend));
        return items.map(mapFromBackend);
    }

    async getProductByProductCode(productCode: string): Promise<Product | undefined> {
        const all = await this.getProducts();
        return all.find(p => p.productCode === productCode.trim());
    }

    async isProductNameExists(name: string, excludeId?: string): Promise<boolean> {
        const all = await this.getProducts();
        const normalized = name.trim().toLowerCase();
        return all.some(p => p.name.toLowerCase() === normalized && p.id !== excludeId);
    }

    async isProductCodeExists(code: string, excludeId?: string): Promise<boolean> {
        if (!code) return false;
        const all = await this.getProducts();
        const normalized = code.trim();
        return all.some(p => p.productCode === normalized && p.id !== excludeId);
    }

    async getUsedCustomFieldIds(): Promise<string[]> {
        const products = await this.getProducts();
        const fieldIds = new Set<string>();
        products.forEach(p => Object.keys(p.customFields).forEach(id => fieldIds.add(id)));
        return Array.from(fieldIds);
    }
}

export const productService = new ProductService();
