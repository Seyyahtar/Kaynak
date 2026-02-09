import React, { useState, useMemo } from 'react';
import { X, Plus, Upload } from 'lucide-react';
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
import { CustomField, FieldDataType } from '@/types';
import { toast } from 'sonner';

interface ColumnMapping {
    excelColumn: string;
    targetField: string | 'NEW' | null;
    newFieldName?: string;
    newFieldType?: FieldDataType;
}

interface ExcelImportModalProps {
    columns: ExcelColumn[];
    rows: any[][];
    existingFields: CustomField[];
    onClose: () => void;
    onImport: (mappings: ColumnMapping[]) => Promise<void>;
}

export default function ExcelImportModal({
    columns,
    rows,
    existingFields,
    onClose,
    onImport
}: ExcelImportModalProps) {
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
            if (col.name.toLowerCase().includes('miktar') || col.name.toLowerCase().includes('adet')) {
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
            await onImport(mappings);
            toast.success('İçe aktarma başarılı');
            onClose();
        } catch (error) {
            toast.error('İçe aktarma başarısız');
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Upload className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Excel İçe Aktarma</h2>
                            <p className="text-sm text-slate-600">{rows.length} satır algılandı</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 mb-4">
                            Her Excel sütununu uygun ürün başlığı ile eşleştirin. Yeni başlık oluşturabilirsiniz.
                        </p>

                        {mappings.map((mapping, index) => {
                            const column = columns[index];
                            return (
                                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Excel Column */}
                                        <div>
                                            <h3 className="font-medium text-slate-800 mb-1">
                                                {column.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mb-2">
                                                {getDataTypeLabel(column.dataType)}
                                            </p>
                                            <div className="text-xs text-slate-600 space-y-1">
                                                <p className="font-medium">Örnek veriler:</p>
                                                {column.samples.slice(0, 2).map((sample, i) => (
                                                    <p key={i} className="truncate bg-white px-2 py-1 rounded">
                                                        {String(sample || '(boş)')}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Target Field */}
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">
                                                Hedef Başlık
                                            </Label>
                                            <Select
                                                value={mapping.targetField || ''}
                                                onValueChange={(value: string) => handleMappingChange(index, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Başlık seçin..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="name">Ürün Adı *</SelectItem>
                                                    <SelectItem value="quantity">Miktar</SelectItem>
                                                    {existingFields.map(field => (
                                                        <SelectItem key={field.id} value={field.id}>
                                                            {field.name}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="NEW">
                                                        <span className="flex items-center gap-1">
                                                            <Plus className="w-3 h-3" />
                                                            Yeni Başlık Oluştur
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {/* New Field Inputs */}
                                            {mapping.targetField === 'NEW' && (
                                                <div className="mt-3 space-y-2">
                                                    <Input
                                                        placeholder="Yeni başlık adı"
                                                        value={mapping.newFieldName}
                                                        onChange={(e) => handleNewFieldNameChange(index, e.target.value)}
                                                        className="text-sm"
                                                    />
                                                    <Select
                                                        value={mapping.newFieldType}
                                                        onValueChange={(value: string) =>
                                                            handleNewFieldTypeChange(index, value as FieldDataType)
                                                        }
                                                    >
                                                        <SelectTrigger className="text-sm">
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
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        * Ürün Adı zorunludur
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isImporting}>
                            İptal
                        </Button>
                        <Button onClick={handleImport} disabled={isImporting}>
                            {isImporting ? 'İçe Aktarılıyor...' : `${rows.length} Ürün İçe Aktar`}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
