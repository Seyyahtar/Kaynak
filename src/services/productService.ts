import { Product } from '../types';

const STORAGE_KEY = 'products';

class ProductService {
    // Get all products
    getProducts(): Product[] {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Error parsing products:', error);
            return [];
        }
    }

    // Get product by ID
    getProductById(id: string): Product | undefined {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    }

    // Create a new product
    createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
        // Check if product name already exists
        if (this.isProductNameExists(productData.name)) {
            throw new Error('Bu ürün adı zaten kullanılıyor');
        }

        const products = this.getProducts();
        const now = new Date().toISOString();

        const newProduct: Product = {
            ...productData,
            id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now,
        };

        products.push(newProduct);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

        return newProduct;
    }

    // Update an existing product
    updateProduct(id: string, productData: Partial<Product>): Product {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error('Ürün bulunamadı');
        }

        // Check product name uniqueness (excluding current product)
        if (productData.name && this.isProductNameExists(productData.name, id)) {
            throw new Error('Bu ürün adı zaten kullanılıyor');
        }

        const updatedProduct: Product = {
            ...products[index],
            ...productData,
            id, // Keep original ID
            createdAt: products[index].createdAt, // Keep original creation date
            updatedAt: new Date().toISOString(),
        };

        products[index] = updatedProduct;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

        return updatedProduct;
    }

    // Delete a product
    deleteProduct(id: string): void {
        const products = this.getProducts();
        const filteredProducts = products.filter(p => p.id !== id);

        if (filteredProducts.length === products.length) {
            throw new Error('Ürün bulunamadı');
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProducts));
    }

    // Check if a product name already exists
    isProductNameExists(name: string, excludeId?: string): boolean {
        const products = this.getProducts();
        const normalizedName = name.trim().toLowerCase();

        return products.some(product =>
            product.name.toLowerCase() === normalizedName && product.id !== excludeId
        );
    }

    // Get all unique custom field IDs used across all products
    getUsedCustomFieldIds(): string[] {
        const products = this.getProducts();
        const fieldIds = new Set<string>();

        products.forEach(product => {
            Object.keys(product.customFields).forEach(fieldId => {
                fieldIds.add(fieldId);
            });
        });

        return Array.from(fieldIds);
    }
}

export const productService = new ProductService();
