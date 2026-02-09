import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Page, Product, CustomField } from '@/types';
import { productService } from '@/services/productService';
import { customFieldService } from '@/services/customFieldService';
import CustomFieldsManager from '@/components/CustomFieldsManager';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductListPageProps {
    onNavigate: (page: Page, data?: any) => void;
}

export default function ProductListPage({ onNavigate }: ProductListPageProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [fields, setFields] = useState<CustomField[]>([]);
    const [showFieldsManager, setShowFieldsManager] = useState(false);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setProducts(productService.getProducts());
        setFields(customFieldService.getCustomFields());
    };

    const handleDeleteProduct = (productId: string) => {
        setDeleteProductId(productId);
    };

    const confirmDelete = () => {
        if (!deleteProductId) return;

        try {
            productService.deleteProduct(deleteProductId);
            toast.success('Ürün başarıyla silindi');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Ürün silinirken hata oluştu');
        } finally {
            setDeleteProductId(null);
        }
    };

    const handleEditProduct = (product: Product) => {
        onNavigate('product-form', { product });
    };

    const handleNewProduct = () => {
        onNavigate('product-form');
    };

    const getFieldValue = (product: Product, field: CustomField) => {
        // Check default fields first
        switch (field.id) {
            case 'serial_number': return product.serialNumber || '-';
            case 'lot_number': return product.lotNumber || '-';
            case 'expiry_date': return product.expiryDate || '-';
            case 'ubb_code': return product.ubbCode || '-';
            case 'product_code': return product.productCode || '-';
            default:
                // Check custom fields
                return product.customFields[field.id] || '-';
        }
    };

    // Get all fields that are actually being used in products
    const getUsedFields = () => {
        const usedFieldIds = new Set<string>();

        // Always show default fields
        customFieldService.getDefaultFields().forEach(f => usedFieldIds.add(f.id));

        // Add custom fields that have values
        products.forEach(product => {
            Object.keys(product.customFields).forEach(fieldId => {
                if (product.customFields[fieldId]) {
                    usedFieldIds.add(fieldId);
                }
            });
        });

        return fields.filter(f => usedFieldIds.has(f.id));
    };

    const usedFields = getUsedFields();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('admin-panel')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold text-slate-800">Ürün Listesi</h1>
                    <div className="w-10" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowFieldsManager(true)}
                        variant="outline"
                        className="flex-1"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Başlık Yönetimi
                    </Button>
                    <Button
                        onClick={handleNewProduct}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Ürün
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {products.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                            Henüz ürün eklenmemiş
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Yeni ürün eklemek için yukarıdaki "Yeni Ürün" butonuna tıklayın
                        </p>
                        <Button onClick={handleNewProduct}>
                            <Plus className="w-4 h-4 mr-2" />
                            İlk Ürünü Ekle
                        </Button>
                    </Card>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-lg border border-slate-200">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Sıra No
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Ürün Adı
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                        Miktar
                                    </th>
                                    {usedFields.map((field) => (
                                        <th key={field.id} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                            {field.name}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, index) => (
                                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {product.quantity !== undefined ? product.quantity : '-'}
                                        </td>
                                        {usedFields.map((field) => (
                                            <td key={field.id} className="px-4 py-3 text-sm text-slate-600">
                                                {getFieldValue(product, field)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditProduct(product)}
                                                    className="h-8 w-8"
                                                >
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="h-8 w-8"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Custom Fields Manager Modal */}
            <CustomFieldsManager
                isOpen={showFieldsManager}
                onClose={() => {
                    setShowFieldsManager(false);
                    loadData();
                }}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
