import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Page, Product, CustomField } from '@/types';
import { productService } from '@/services/productService';
import { customFieldService } from '@/services/customFieldService';
import { toast } from 'sonner';

interface ProductFormPageProps {
    onNavigate: (page: Page) => void;
    editProduct?: Product;
}

export default function ProductFormPage({ onNavigate, editProduct }: ProductFormPageProps) {
    const isEditMode = !!editProduct;

    // Required fields
    const [productName, setProductName] = useState(editProduct?.name || '');
    const [quantity, setQuantity] = useState(editProduct?.quantity?.toString() || '');

    // Default optional fields
    const [serialNumber, setSerialNumber] = useState(editProduct?.serialNumber || '');
    const [lotNumber, setLotNumber] = useState(editProduct?.lotNumber || '');
    const [expiryDate, setExpiryDate] = useState(editProduct?.expiryDate || '');
    const [ubbCode, setUbbCode] = useState(editProduct?.ubbCode || '');
    const [productCode, setProductCode] = useState(editProduct?.productCode || '');

    // Custom fields
    const [availableFields, setAvailableFields] = useState<CustomField[]>([]);
    const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(new Set());
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

    useEffect(() => {
        // Load custom fields
        const userFields = customFieldService.getUserCustomFields();
        setAvailableFields(userFields);

        // If editing, load existing custom field values
        if (editProduct) {
            const selectedIds = new Set<string>();
            const values: Record<string, any> = {};

            Object.entries(editProduct.customFields).forEach(([fieldId, value]) => {
                selectedIds.add(fieldId);
                values[fieldId] = value;
            });

            setSelectedFieldIds(selectedIds);
            setCustomFieldValues(values);
        }
    }, [editProduct]);

    const handleFieldToggle = (fieldId: string) => {
        const newSelected = new Set(selectedFieldIds);
        if (newSelected.has(fieldId)) {
            newSelected.delete(fieldId);
            // Remove value when unchecked
            const newValues = { ...customFieldValues };
            delete newValues[fieldId];
            setCustomFieldValues(newValues);
        } else {
            newSelected.add(fieldId);
        }
        setSelectedFieldIds(newSelected);
    };

    const handleCustomFieldChange = (fieldId: string, value: any) => {
        setCustomFieldValues({
            ...customFieldValues,
            [fieldId]: value,
        });
    };

    const getInputType = (dataType: string) => {
        switch (dataType) {
            case 'number': return 'number';
            case 'date': return 'date';
            case 'mixed': return 'text'; // Mixed allows both text and numbers
            case 'none': return 'text'; // No type restriction, use text
            default: return 'text';
        }
    };

    const handleSave = () => {
        // Validation
        if (!productName.trim()) {
            toast.error('Ürün adı zorunludur');
            return;
        }

        // Quantity is now optional, so only validate if provided
        if (quantity && parseFloat(quantity) <= 0) {
            toast.error('Geçerli bir miktar giriniz');
            return;
        }

        try {
            const productData = {
                name: productName.trim(),
                quantity: quantity ? parseFloat(quantity) : undefined, // Quantity is optional
                serialNumber: serialNumber.trim() || undefined,
                lotNumber: lotNumber.trim() || undefined,
                expiryDate: expiryDate || undefined,
                ubbCode: ubbCode.trim() || undefined,
                productCode: productCode.trim() || undefined,
                customFields: customFieldValues,
            };

            if (isEditMode) {
                productService.updateProduct(editProduct.id, productData);
                toast.success('Ürün başarıyla güncellendi');
            } else {
                productService.createProduct(productData);
                toast.success('Ürün başarıyla eklendi');
            }

            onNavigate('product-list');
        } catch (error: any) {
            toast.error(error.message || 'Ürün kaydedilirken hata oluştu');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('product-list')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-semibold text-slate-800">
                        {isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün'}
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Required Field - Only Product Name */}
                <Card className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-4">Temel Bilgiler</h3>
                    <div>
                        <Label htmlFor="product-name">Ürün Adı *</Label>
                        <Input
                            id="product-name"
                            placeholder="Ürün adını giriniz"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Default Optional Fields */}
                <Card className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-4">Varsayılan Bilgiler (Opsiyonel)</h3>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="quantity">Miktar</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="0"
                                min="0"
                                step="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="serial-number">Seri No</Label>
                            <Input
                                id="serial-number"
                                placeholder="Seri numarasını giriniz"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="lot-number">Lot No</Label>
                            <Input
                                id="lot-number"
                                placeholder="Lot numarasını giriniz"
                                value={lotNumber}
                                onChange={(e) => setLotNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="expiry-date">SKT (Son Kullanma Tarihi)</Label>
                            <Input
                                id="expiry-date"
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="ubb-code">UBB</Label>
                            <Input
                                id="ubb-code"
                                placeholder="UBB kodunu giriniz"
                                value={ubbCode}
                                onChange={(e) => setUbbCode(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="product-code">Ürün Kodu</Label>
                            <Input
                                id="product-code"
                                placeholder="Ürün kodunu giriniz"
                                value={productCode}
                                onChange={(e) => setProductCode(e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Custom Fields */}
                {availableFields.length > 0 && (
                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Ek Bilgiler</h3>
                        <div className="space-y-4">
                            {availableFields.map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`field-${field.id}`}
                                            checked={selectedFieldIds.has(field.id)}
                                            onCheckedChange={() => handleFieldToggle(field.id)}
                                        />
                                        <Label
                                            htmlFor={`field-${field.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {field.name}
                                        </Label>
                                    </div>
                                    {selectedFieldIds.has(field.id) && (
                                        <Input
                                            type={getInputType(field.dataType)}
                                            placeholder={`${field.name} giriniz`}
                                            value={customFieldValues[field.id] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                            className="ml-6"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pb-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onNavigate('product-list')}
                    >
                        İptal
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                    </Button>
                </div>
            </div>
        </div>
    );
}
