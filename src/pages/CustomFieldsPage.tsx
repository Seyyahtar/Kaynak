import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { customFieldService } from '@/services/customFieldService';
import { productService } from '@/services/productService';
import { CustomField, FieldDataType, Page } from '@/types';
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
import { Trash2 } from 'lucide-react';

interface CustomFieldsPageProps {
    onNavigate: (page: Page) => void;
}

export default function CustomFieldsPage({ onNavigate }: CustomFieldsPageProps) {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldDataType, setNewFieldDataType] = useState<FieldDataType>('text');
    const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        const allFields = await customFieldService.getCustomFields();
        setFields(allFields);
    };

    const handleAddField = async () => {
        if (!newFieldName.trim()) {
            toast.error('Başlık adı boş olamaz');
            return;
        }

        try {
            await customFieldService.addCustomField(newFieldName, newFieldDataType);
            toast.success('Başlık başarıyla eklendi');
            setNewFieldName('');
            setNewFieldDataType('text');
            await loadFields();
        } catch (error: any) {
            toast.error(error.message || 'Başlık eklenirken hata oluştu');
        }
    };

    const handleToggleField = async (fieldId: string) => {
        await customFieldService.toggleFieldStatus(fieldId);
        await loadFields();
    };

    const handleToggleClassification = async (fieldId: string) => {
        await customFieldService.toggleFieldClassification(fieldId);
        await loadFields();
    };

    const handleDeleteField = (fieldId: string) => {
        setDeleteFieldId(fieldId);
    };

    const confirmDelete = async () => {
        if (!deleteFieldId) return;

        try {
            await customFieldService.deleteCustomField(deleteFieldId);
            toast.success('Başlık silindi');
            await loadFields();
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
                    <h1 className="text-xl font-semibold text-slate-800">Başlık Yönetimi</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
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
                                        <div className="flex items-center gap-4">
                                            {/* Active/Passive Toggle */}
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${field.isActive ? 'bg-green-500 border-green-600' : 'bg-white border-slate-300'
                                                        }`}
                                                    onClick={() => handleToggleField(field.id)}
                                                >
                                                    {field.isActive && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">Aktif</span>
                                            </div>

                                            {/* Classification Toggle */}
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${field.isClassified ? 'bg-blue-500 border-blue-600' : 'bg-white border-slate-300'
                                                        }`}
                                                    onClick={() => handleToggleClassification(field.id)}
                                                >
                                                    {field.isClassified && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]" title={`Örn: ${field.name.substring(0, 1).toUpperCase()}`}>
                                                    Sınıflandır ({field.name.substring(0, 1).toUpperCase()})
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <span className={`font-medium ${field.isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                                    {field.name}
                                                </span>
                                                {field.isDefault && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                        Varsayılan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-600 ml-8">
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
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
