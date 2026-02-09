import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ExcelColumn } from '@/utils/excelParser';
import { CustomField, FieldDataType, Page } from '@/types';
import { toast } from 'sonner';
import { customFieldService } from '@/services/customFieldService';
import { productService } from '@/services/productService';

interface ColumnMapping {
    excelColumn: string;
    targetField: string | 'NEW' | null;
    newFieldName?: string;
    newFieldType?: FieldDataType;
}

interface ExcelImportPageProps {
    onNavigate: (page: Page, data?: any) => void;
    importData: {
        columns: ExcelColumn[];
        rows: any[][];
    };
}

export default function ExcelImportPage({ onNavigate, importData }: ExcelImportPageProps) {
    const { columns, rows } = importData;
    const [existingFields] = useState<CustomField[]>(customFieldService.getCustomFields());

    const [mappings, setMappings] = useState<ColumnMapping[]>(
        columns.map(col => ({
            excelColumn: col.name,
            targetField: null,
            newFieldName: col.name,
            newFieldType: col.dataType
        }))
    );
    const [isImporting, setIsImporting] = useState(false);

    // Auto-match columns with existing fields
    useMemo(() => {
        const autoMappings = columns.map(col => {
            // Try to find exact match
            const exactMatch = existingFields.find(
                f => f.name.toLowerCase() === col.name.toLowerCase()
            );

            if (exactMatch) {
                return {
                    excelColumn: col.name,
                    targetField: exactMatch.id,
                    newFieldName: col.name,
                    newFieldType: col.dataType
                };
            }

            // Check if it's "Ürün Adı" or similar
            if (col.name.toLowerCase().includes('ürün') && col.name.toLowerCase().includes('ad')) {
                return {
                    excelColumn: col.name,
                    targetField: 'name',
                    newFieldName: col.name,
                    newFieldType: col.dataType
                };
            }

            // Check if it's quantity
            if (col.name.toLowerCase().includes('miktar') || col.name.toLowerCase().includes('adet') || col.name.toLowerCase().includes('stok')) {
                return {
                    excelColumn: col.name,
                    targetField: 'quantity',
                    newFieldName: col.name,
                    newFieldType: col.dataType
                };
            }

            return {
                excelColumn: col.name,
                targetField: null,
                newFieldName: col.name,
                newFieldType: col.dataType
            };
        });

        setMappings(autoMappings);
    }, [columns, existingFields]);

    const handleMappingChange = (index: number, targetField: string) => {
        const newMappings = [...mappings];
        newMappings[index].targetField = targetField;
        setMappings(newMappings);
    };

    const handleNewFieldNameChange = (index: number, name: string) => {
        const newMappings = [...mappings];
        newMappings[index].newFieldName = name;
        setMappings(newMappings);
    };

    const handleNewFieldTypeChange = (index: number, type: FieldDataType) => {
        const newMappings = [...mappings];
        newMappings[index].newFieldType = type;
        setMappings(newMappings);
    };

    const handleImport = async () => {
        // Validate mappings
        const hasProductName = mappings.some(m => m.targetField === 'name');
        if (!hasProductName) {
            toast.error('Ürün Adı sütunu eşleştirilmelidir');
            return;
        }

        // Check for duplicate new field names
        const newFields = mappings.filter(m => m.targetField === 'NEW');
        const newFieldNames = newFields.map(m => m.newFieldName);
        const duplicates = newFieldNames.filter((name, index) =>
            newFieldNames.indexOf(name) !== index
        );

        if (duplicates.length > 0) {
            toast.error(`Yinelenen başlık adları: ${duplicates.join(', ')}`);
            return;
        }

        setIsImporting(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            // Create new fields if needed
            const newFieldsMap: Record<string, string> = {};
            for (const mapping of mappings) {
                if (mapping.targetField === 'NEW' && mapping.newFieldName) {
                    try {
                        const newField = customFieldService.addCustomField(
                            mapping.newFieldName,
                            mapping.newFieldType || 'text'
                        );
                        newFieldsMap[mapping.excelColumn] = newField.id;
                    } catch (error) {
                        console.error('Field creation error:', error);
                    }
                }
            }

            // Import products
            for (const row of rows) {
                try {
                    const productData: any = {
                        name: '',
                        customFields: {}
                    };

                    mappings.forEach((mapping, index) => {
                        const value = row[index];
                        if (!value) return;

                        if (mapping.targetField === 'name') {
                            productData.name = String(value);
                        } else if (mapping.targetField === 'quantity') {
                            productData.quantity = Number(value) || 0;
                        } else if (mapping.targetField === 'NEW') {
                            // Use the newly created field ID
                            const fieldId = newFieldsMap[mapping.excelColumn];
                            if (fieldId) {
                                productData.customFields[fieldId] = value;
                            }
                        } else if (mapping.targetField) {
                            // Existing field
                            productData.customFields[mapping.targetField] = value;
                        }
                    });

                    if (productData.name) {
                        productService.createProduct(productData);
                        successCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Row import error:', error);
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} ürün başarıyla içe aktarıldı`);
                onNavigate('product-list'); // Go back to product list
            }

            if (errorCount > 0) {
                toast.warning(`${errorCount} satır aktarılamadı`);
            }

        } catch (error: any) {
            toast.error('İçe aktarma başarısız: ' + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const getDataTypeLabel = (type: FieldDataType) => {
        const labels: Record<FieldDataType, string> = {
            text: 'Metin',
            number: 'Sayı',
            date: 'Tarih',
            mixed: 'Metin+Sayı',
            none: 'Veri Tipi Yok'
        };
        return labels[type];
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('stock-management')}
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Excel İçe Aktarma</h1>
                        <p className="text-slate-600">{rows.length} satır algılandı</p>
                    </div>
                </div>

                <Card className="p-6">
                    <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm">
                        Her Excel sütununu uygun ürün başlığı ile eşleştirin. Eğer uygun başlık yoksa "Yeni Başlık Oluştur" seçeneğini kullanabilirsiniz.
                    </div>

                    <div className="space-y-4">
                        {mappings.map((mapping, index) => {
                            const column = columns[index];
                            const isMapped = !!mapping.targetField;

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border-2 transition-colors ${isMapped ? 'bg-white border-green-100' : 'bg-slate-50 border-slate-100'
                                        }`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        {/* Excel Column Info */}
                                        <div className="md:col-span-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="font-semibold text-slate-800 break-all">
                                                    {column.name}
                                                </div>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                                    {getDataTypeLabel(column.dataType)}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                {column.samples.slice(0, 3).map((sample, i) => (
                                                    <div key={i} className="text-sm text-slate-500 truncate bg-slate-50 px-2 py-1 rounded">
                                                        {sample ? String(sample) : <span className="italic text-slate-400">Boş</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Arrow Separator */}
                                        <div className="hidden md:flex md:col-span-1 justify-center pt-8">
                                            <div className={`p-1 rounded-full ${isMapped ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                                {isMapped ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                                            </div>
                                        </div>

                                        {/* Target Mapping */}
                                        <div className="md:col-span-7 space-y-3">
                                            <div>
                                                <Label className="text-sm font-medium mb-1.5 block text-slate-700">
                                                    Hedef Başlık
                                                </Label>
                                                <Select
                                                    value={mapping.targetField || ''}
                                                    onValueChange={(value: string) => handleMappingChange(index, value)}
                                                >
                                                    <SelectTrigger className={mapping.targetField ? 'border-green-200 bg-green-50/50' : ''}>
                                                        <SelectValue placeholder="Eşleştirme Seçin..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="name">Ürün Adı (Zorunlu)</SelectItem>
                                                        <SelectItem value="quantity">Miktar</SelectItem>
                                                        {existingFields.map(field => (
                                                            <SelectItem key={field.id} value={field.id}>
                                                                {field.name}
                                                            </SelectItem>
                                                        ))}
                                                        <div className="border-t my-1" />
                                                        <SelectItem value="NEW" className="text-blue-600 font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Plus className="w-4 h-4" />
                                                                Yeni Başlık Oluştur
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* New Field Configuration */}
                                            {mapping.targetField === 'NEW' && (
                                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-3 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <Label className="text-xs font-medium text-slate-600 mb-1 block">
                                                            Yeni Başlık Adı
                                                        </Label>
                                                        <Input
                                                            value={mapping.newFieldName}
                                                            onChange={(e) => handleNewFieldNameChange(index, e.target.value)}
                                                            className="bg-white"
                                                            placeholder="Örn: Seri No"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs font-medium text-slate-600 mb-1 block">
                                                            Veri Tipi
                                                        </Label>
                                                        <Select
                                                            value={mapping.newFieldType}
                                                            onValueChange={(value: string) =>
                                                                handleNewFieldTypeChange(index, value as FieldDataType)
                                                            }
                                                        >
                                                            <SelectTrigger className="bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text">Metin</SelectItem>
                                                                <SelectItem value="number">Sayı</SelectItem>
                                                                <SelectItem value="date">Tarih</SelectItem>
                                                                <SelectItem value="mixed">Metin + Sayı</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] -mx-6 -mb-6 rounded-b-lg z-10">
                        <Button
                            variant="outline"
                            onClick={() => onNavigate('stock-management')}
                            disabled={isImporting}
                            className="h-12 px-6"
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={isImporting}
                            className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isImporting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Aktarılıyor...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {rows.length} Ürünü İçe Aktar
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
