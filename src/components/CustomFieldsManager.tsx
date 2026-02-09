import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { customFieldService } from '../services/customFieldService';
import { productService } from '../services/productService';
import { CustomField, FieldDataType } from '../types';
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
} from './ui/alert-dialog';

interface CustomFieldsManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CustomFieldsManager({ isOpen, onClose }: CustomFieldsManagerProps) {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldDataType, setNewFieldDataType] = useState<FieldDataType>('text');
    const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadFields();
        }
    }, [isOpen]);

    const loadFields = () => {
        const allFields = customFieldService.getCustomFields();
        setFields(allFields);
    };

    const handleAddField = () => {
        if (!newFieldName.trim()) {
            toast.error('Başlık adı boş olamaz');
            return;
        }

        try {
            customFieldService.addCustomField(newFieldName, newFieldDataType);
            toast.success('Başlık başarıyla eklendi');
            setNewFieldName('');
            setNewFieldDataType('text');
            loadFields();
        } catch (error: any) {
            toast.error(error.message || 'Başlık eklenirken hata oluştu');
        }
    };

    const handleDeleteField = (fieldId: string) => {
        setDeleteFieldId(fieldId);
    };

    const confirmDelete = () => {
        if (!deleteFieldId) return;

        try {
            // Delete the custom field
            customFieldService.deleteCustomField(deleteFieldId);

            // Clean up products: remove this field from all products
            const products = productService.getProducts();
            products.forEach((product: any) => {
                if (product.customFields && product.customFields[deleteFieldId]) {
                    delete product.customFields[deleteFieldId];
                    productService.updateProduct(product.id, product);
                }
            });

            toast.success('Başlık silindi ve tüm ürünlerden kaldırıldı');
            loadFields();
        } catch (error: any) {
            toast.error(error.message || 'Başlık silinirken hata oluştu');
        } finally {
            setDeleteFieldId(null);
        }
    };

    const getDataTypeLabel = (dataType: FieldDataType) => {
        switch (dataType) {
            case 'text': return 'Metin';
            case 'number': return 'Sayı';
            case 'date': return 'Tarih';
            case 'mixed': return 'Metin+Sayı';
            case 'none': return 'Veri Tipi Yok';
            default: return dataType;
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl z-50 max-h-[85vh] overflow-hidden flex flex-col mx-4">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-slate-800">Başlık Yönetimi</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add New Field Section */}
                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Yeni Başlık Ekle</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="field-name">Başlık Adı</Label>
                                <Input
                                    id="field-name"
                                    placeholder="Örn: Barkod Numarası"
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="field-type">Veri Tipi (Opsiyonel)</Label>
                                <Select value={newFieldDataType} onValueChange={(value: string) => setNewFieldDataType(value as FieldDataType)}>
                                    <SelectTrigger id="field-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Metin</SelectItem>
                                        <SelectItem value="number">Sayı</SelectItem>
                                        <SelectItem value="date">Tarih</SelectItem>
                                        <SelectItem value="mixed">Metin+Sayı</SelectItem>
                                        <SelectItem value="none">Veri Tipi Yok</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddField} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Başlık Ekle
                            </Button>
                        </div>
                    </Card>

                    {/* Fields List */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4">Mevcut Başlıklar</h3>
                        <div className="space-y-2">
                            {fields.map((field) => (
                                <Card key={field.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800">{field.name}</span>
                                                {field.isDefault && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                        Varsayılan
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-slate-600">
                                                {getDataTypeLabel(field.dataType)}
                                            </span>
                                        </div>
                                        {!field.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteField(field.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t">
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Kapat
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteFieldId} onOpenChange={() => setDeleteFieldId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Başlığı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu başlığı silmek istediğinizden emin misiniz? Bu işlem tüm ürünlerden bu başlık ve içerdiği verileri kaldıracaktır.
                            Bu işlem geri alınamaz.
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
        </>
    );
}
