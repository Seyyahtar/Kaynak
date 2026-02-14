import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Upload, X, Check, Ban } from 'lucide-react';
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
import { ExcelColumn, extractCombinedCellData } from '@/utils/excelParser';
import { CustomField, FieldDataType, Page } from '@/types';
import { toast } from 'sonner';
import { customFieldService } from '@/services/customFieldService';
import { productService } from '@/services/productService';

interface SubMapping {
    seri?: string | 'NEW' | 'IGNORE' | null;
    lot?: string | 'NEW' | 'IGNORE' | null;
    skt?: string | 'NEW' | 'IGNORE' | null;
    ubb?: string | 'NEW' | 'IGNORE' | null;
}

interface ColumnMapping {
    excelColumn: string;
    targetField: string | 'NEW' | 'IGNORE' | null;
    newFieldName?: string;
    newFieldType?: FieldDataType;
    subMappings?: SubMapping;
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
        columns.map(col => {
            // Check if column has combined data to initialize sub-mappings
            let subMappings: SubMapping | undefined;

            if (col.hasCombinedData && col.extractedSamples && col.extractedSamples.length > 0) {
                // Check what kind of data is present in samples
                const hasSeri = col.extractedSamples.some(s => s.seri);
                const hasLot = col.extractedSamples.some(s => s.lot);
                const hasSkt = col.extractedSamples.some(s => s.skt);
                const hasUbb = col.extractedSamples.some(s => s.ubb);

                if (hasSeri || hasLot || hasSkt || hasUbb) {
                    subMappings = {
                        seri: hasSeri ? 'serial_number' : undefined,
                        lot: hasLot ? 'lot_number' : undefined,
                        skt: hasSkt ? 'expiry_date' : undefined,
                        ubb: hasUbb ? 'ubb_code' : undefined
                    };
                }
            }

            return {
                excelColumn: col.name,
                targetField: null,
                newFieldName: col.name,
                newFieldType: col.dataType,
                subMappings
            };
        })
    );
    const [isImporting, setIsImporting] = useState(false);

    // Calculate all currently selected fields to prevent duplicates
    const selectedTargetFields = useMemo(() => {
        const selected = new Set<string>();
        mappings.forEach(m => {
            if (m.targetField && m.targetField !== 'NEW' && m.targetField !== 'IGNORE') {
                selected.add(m.targetField);
            }
            if (m.subMappings) {
                if (m.subMappings.seri && m.subMappings.seri !== 'NEW' && m.subMappings.seri !== 'IGNORE') selected.add(m.subMappings.seri);
                if (m.subMappings.lot && m.subMappings.lot !== 'NEW' && m.subMappings.lot !== 'IGNORE') selected.add(m.subMappings.lot);
                if (m.subMappings.skt && m.subMappings.skt !== 'NEW' && m.subMappings.skt !== 'IGNORE') selected.add(m.subMappings.skt);
                if (m.subMappings.ubb && m.subMappings.ubb !== 'NEW' && m.subMappings.ubb !== 'IGNORE') selected.add(m.subMappings.ubb);
            }
        });
        return selected;
    }, [mappings]);

    // Auto-match columns with existing fields
    useMemo(() => {
        const autoMappings = columns.map(col => {
            // Check if column has combined data to initialize sub-mappings
            let subMappings: SubMapping | undefined;

            if (col.hasCombinedData && col.extractedSamples && col.extractedSamples.length > 0) {
                const hasSeri = col.extractedSamples.some(s => s.seri);
                const hasLot = col.extractedSamples.some(s => s.lot);
                const hasSkt = col.extractedSamples.some(s => s.skt);
                const hasUbb = col.extractedSamples.some(s => s.ubb);

                if (hasSeri || hasLot || hasSkt || hasUbb) {
                    subMappings = {
                        seri: hasSeri ? 'serial_number' : undefined,
                        lot: hasLot ? 'lot_number' : undefined,
                        skt: hasSkt ? 'expiry_date' : undefined,
                        ubb: hasUbb ? 'ubb_code' : undefined
                    };
                }
            }

            // Try to find exact match
            const exactMatch = existingFields.find(
                f => f.name.toLowerCase() === col.name.toLowerCase()
            );

            if (exactMatch) {
                return {
                    excelColumn: col.name,
                    targetField: exactMatch.id,
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check if it's "Ürün Adı" or similar
            if (col.name.toLowerCase().includes('ürün') && col.name.toLowerCase().includes('ad')) {
                return {
                    excelColumn: col.name,
                    targetField: 'name',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check if it's quantity
            if (col.name.toLowerCase().includes('miktar') || col.name.toLowerCase().includes('adet') || col.name.toLowerCase().includes('stok')) {
                return {
                    excelColumn: col.name,
                    targetField: 'quantity',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check for Serial Number (only if not combined)
            if (col.name.toLowerCase().includes('seri') && !col.name.toLowerCase().includes('lot')) {
                return {
                    excelColumn: col.name,
                    targetField: 'serial_number',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check for Lot Number (only if not combined)
            if (col.name.toLowerCase().includes('lot')) {
                return {
                    excelColumn: col.name,
                    targetField: 'lot_number',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check for Expiry Date / SKT (only if not combined)
            if (col.name.toLowerCase().includes('skt') || col.name.toLowerCase().includes('son kullan') || col.name.toLowerCase().includes('expiry')) {
                return {
                    excelColumn: col.name,
                    targetField: 'expiry_date',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check for UBB Code (only if not combined)
            if (col.name.toLowerCase().includes('ubb')) {
                return {
                    excelColumn: col.name,
                    targetField: 'ubb_code',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            // Check for Product Code
            if (col.name.toLowerCase().includes('ürün') && col.name.toLowerCase().includes('kod') || col.name.toLowerCase().includes('kod') && col.name.toLowerCase().includes('malzeme')) {
                return {
                    excelColumn: col.name,
                    targetField: 'product_code',
                    newFieldName: col.name,
                    newFieldType: col.dataType,
                    subMappings
                };
            }

            return {
                excelColumn: col.name,
                targetField: null,
                newFieldName: col.name,
                newFieldType: col.dataType,
                subMappings
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

    const handleSubMappingChange = (index: number, subField: keyof SubMapping, targetField: string) => {
        const newMappings = [...mappings];
        if (newMappings[index].subMappings) {
            newMappings[index].subMappings![subField] = targetField;
            setMappings(newMappings);
        }
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
            // Create new fields first
            const newFieldsMap: Record<string, string> = {}; // ColumnName -> FieldId

            for (const mapping of newFields) {
                if (mapping.newFieldName) {
                    const newField = await customFieldService.addCustomField({
                        name: mapping.newFieldName,
                        dataType: mapping.newFieldType || 'text',
                        isActive: true
                    });
                    newFieldsMap[mapping.excelColumn] = newField.id;
                }
            }

            let successCount = 0;
            let errorCount = 0;

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

                        const column = columns[index];

                        // Skip IGNOREd columns
                        if (mapping.targetField === 'IGNORE') return;

                        // 1. Process Main Mapping
                        if (mapping.targetField) {
                            if (mapping.targetField === 'name') {
                                productData.name = String(value);
                            } else if (mapping.targetField === 'quantity') {
                                productData.quantity = Number(value) || 0;
                            } else if (mapping.targetField === 'serial_number') {
                                productData.serialNumber = String(value);
                            } else if (mapping.targetField === 'lot_number') {
                                productData.lotNumber = String(value);
                            } else if (mapping.targetField === 'expiry_date') {
                                productData.expiryDate = String(value);
                            } else if (mapping.targetField === 'ubb_code') {
                                productData.ubbCode = String(value);
                            } else if (mapping.targetField === 'product_code') {
                                productData.productCode = String(value);
                            } else if (mapping.targetField === 'NEW') {
                                // Use the newly created field ID
                                const fieldId = newFieldsMap[mapping.excelColumn];
                                if (fieldId) {
                                    productData.customFields[fieldId] = value;
                                }
                            } else {
                                // Existing custom field
                                productData.customFields[mapping.targetField] = value;
                            }
                        }

                        // 2. Process Sub-Mappings (Combined Data)
                        if (column.hasCombinedData && mapping.subMappings) {
                            const extractedData = extractCombinedCellData(value);

                            if (extractedData) {
                                // Process SERI
                                if (extractedData.seri && mapping.subMappings.seri && mapping.subMappings.seri !== 'IGNORE') {
                                    const target = mapping.subMappings.seri;
                                    if (target === 'serial_number') productData.serialNumber = extractedData.seri;
                                    else if (target === 'lot_number') productData.lotNumber = extractedData.seri;
                                    else if (target === 'expiry_date') productData.expiryDate = extractedData.seri;
                                    else if (target === 'ubb_code') productData.ubbCode = extractedData.seri;
                                    else if (target === 'product_code') productData.productCode = extractedData.seri;
                                    else if (target !== 'NEW') productData.customFields[target] = extractedData.seri;
                                }

                                // Process LOT
                                if (extractedData.lot && mapping.subMappings.lot && mapping.subMappings.lot !== 'IGNORE') {
                                    const target = mapping.subMappings.lot;
                                    if (target === 'serial_number') productData.serialNumber = extractedData.lot;
                                    else if (target === 'lot_number') productData.lotNumber = extractedData.lot;
                                    else if (target === 'expiry_date') productData.expiryDate = extractedData.lot;
                                    else if (target === 'ubb_code') productData.ubbCode = extractedData.lot;
                                    else if (target === 'product_code') productData.productCode = extractedData.lot;
                                    else if (target !== 'NEW') productData.customFields[target] = extractedData.lot;
                                }

                                // Process SKT
                                if (extractedData.skt && mapping.subMappings.skt && mapping.subMappings.skt !== 'IGNORE') {
                                    const target = mapping.subMappings.skt;
                                    if (target === 'serial_number') productData.serialNumber = extractedData.skt;
                                    else if (target === 'lot_number') productData.lotNumber = extractedData.skt;
                                    else if (target === 'expiry_date') productData.expiryDate = extractedData.skt;
                                    else if (target === 'ubb_code') productData.ubbCode = extractedData.skt;
                                    else if (target === 'product_code') productData.productCode = extractedData.skt;
                                    else if (target !== 'NEW') productData.customFields[target] = extractedData.skt;
                                }

                                // Process UBB
                                if (extractedData.ubb && mapping.subMappings.ubb && mapping.subMappings.ubb !== 'IGNORE') {
                                    const target = mapping.subMappings.ubb;
                                    if (target === 'serial_number') productData.serialNumber = extractedData.ubb;
                                    else if (target === 'lot_number') productData.lotNumber = extractedData.ubb;
                                    else if (target === 'expiry_date') productData.expiryDate = extractedData.ubb;
                                    else if (target === 'ubb_code') productData.ubbCode = extractedData.ubb;
                                    else if (target === 'product_code') productData.productCode = extractedData.ubb;
                                    else if (target !== 'NEW') productData.customFields[target] = extractedData.ubb;
                                }
                            }
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

    const renderSelectItems = (currentValue: string | null | undefined) => {
        return (
            <>
                <SelectItem
                    value="name"
                    disabled={selectedTargetFields.has('name') && currentValue !== 'name'}
                >
                    {selectedTargetFields.has('name') && currentValue !== 'name' ? 'Ürün Adı (Seçildi)' : 'Ürün Adı (Zorunlu)'}
                </SelectItem>
                <SelectItem
                    value="quantity"
                    disabled={selectedTargetFields.has('quantity') && currentValue !== 'quantity'}
                >
                    {selectedTargetFields.has('quantity') && currentValue !== 'quantity' ? 'Miktar (Seçildi)' : 'Miktar'}
                </SelectItem>
                {existingFields.map(field => (
                    <SelectItem
                        key={field.id}
                        value={field.id}
                        disabled={selectedTargetFields.has(field.id) && currentValue !== field.id}
                    >
                        {selectedTargetFields.has(field.id) && currentValue !== field.id ? `${field.name} (Seçildi)` : field.name}
                    </SelectItem>
                ))}
            </>
        );
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
                        Her Excel sütununu uygun ürün başlığı ile eşleştirin. İstemediğiniz sütunlar için "Hariç Tut" seçeneğini kullanabilirsiniz.
                    </div>

                    <div className="space-y-4">
                        {mappings.map((mapping, index) => {
                            const column = columns[index];
                            const isMapped = !!mapping.targetField && mapping.targetField !== 'IGNORE';
                            const isIgnored = mapping.targetField === 'IGNORE';

                            return (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border-2 transition-colors ${isIgnored ? 'bg-slate-50 border-slate-200 opacity-60' :
                                        isMapped ? 'bg-white border-green-100' : 'bg-slate-50 border-slate-100'
                                        }`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        {/* Original Data Preview */}
                                        <div className="md:col-span-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold text-slate-700 truncate" title={column.name}>
                                                    {column.name}
                                                </div>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                                    {getDataTypeLabel(column.dataType)}
                                                </span>
                                            </div>

                                            {/* Combined Data Indicator */}
                                            {column.hasCombinedData && (
                                                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-1">
                                                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>Birleşik veri tespit edildi (SERİ/LOT/SKT/UBB)</span>
                                                </div>
                                            )}

                                            {/* Original Samples */}
                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-600 font-medium mb-1">Orijinal Veriler:</div>
                                                {column.samples.slice(0, 2).map((sample, i) => (
                                                    <div key={i} className="text-sm text-slate-500 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                        {sample ? String(sample) : <span className="italic text-slate-400">Boş</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Arrow Separator */}
                                        <div className="hidden md:flex md:col-span-1 justify-center pt-8">
                                            <div className={`p-1 rounded-full ${isIgnored ? 'bg-slate-200 text-slate-400' :
                                                isMapped ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'
                                                }`}>
                                                {isIgnored ? <Ban className="w-4 h-4" /> :
                                                    isMapped ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                                            </div>
                                        </div>

                                        {/* Target Mapping */}
                                        <div className="md:col-span-7 space-y-4">
                                            {/* Main Field Mapping (Optional for combined data) */}
                                            <div>
                                                <Label className="text-sm font-medium mb-1.5 block text-slate-700">
                                                    {mapping.subMappings ? 'Ana Veri (Genel)' : 'Hedef Başlık'}
                                                </Label>
                                                <Select
                                                    value={mapping.targetField || ''}
                                                    onValueChange={(value: string) => handleMappingChange(index, value)}
                                                >
                                                    <SelectTrigger className={mapping.targetField === 'IGNORE' ? 'border-slate-200 bg-slate-100 text-slate-500' : mapping.targetField ? 'border-green-200 bg-green-50/50' : ''}>
                                                        <SelectValue placeholder="Eşleştirme Seçin (İsteğe Bağlı)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="IGNORE" className="text-red-500 font-medium focus:text-red-600 focus:bg-red-50">
                                                            <div className="flex items-center gap-2">
                                                                <Ban className="w-4 h-4" />
                                                                Hariç Tut (Sütunu Aktarma)
                                                            </div>
                                                        </SelectItem>
                                                        <div className="border-t my-1" />
                                                        {renderSelectItems(mapping.targetField)}
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

                                            {/* Sub-Mappings for Combined Data */}
                                            {mapping.subMappings && !isIgnored && (
                                                <div className="space-y-4 pt-3 border-t border-slate-100 mt-3">

                                                    {/* SERI Mapping */}
                                                    {mapping.subMappings.seri !== undefined && (
                                                        <div>
                                                            <div className="mb-2">
                                                                <Label className="text-sm font-medium text-slate-700 block mb-1">
                                                                    Seri No
                                                                </Label>
                                                                {column.extractedSamples && column.extractedSamples.filter(s => s.seri).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {[...new Set(column.extractedSamples.map(s => s.seri).filter(Boolean))].slice(0, 2).map((sample, i) => (
                                                                            <span key={i} className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[200px] truncate" title={sample}>
                                                                                {sample}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Select
                                                                value={mapping.subMappings.seri || ''}
                                                                onValueChange={(value: string) => handleSubMappingChange(index, 'seri', value)}
                                                            >
                                                                <SelectTrigger className={mapping.subMappings.seri === 'IGNORE' ? 'border-slate-200 bg-slate-100 text-slate-500' : mapping.subMappings.seri ? 'border-emerald-200 bg-emerald-50/30' : ''}>
                                                                    <SelectValue placeholder="Seri No için hedef başlık seçin..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="IGNORE" className="text-red-500 font-medium focus:text-red-600 focus:bg-red-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Ban className="w-4 h-4" />
                                                                            Hariç Tut
                                                                        </div>
                                                                    </SelectItem>
                                                                    <div className="border-t my-1" />
                                                                    {renderSelectItems(mapping.subMappings.seri)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}

                                                    {/* LOT Mapping */}
                                                    {mapping.subMappings.lot !== undefined && (
                                                        <div>
                                                            <div className="mb-2">
                                                                <Label className="text-sm font-medium text-slate-700 block mb-1">
                                                                    Lot No
                                                                </Label>
                                                                {column.extractedSamples && column.extractedSamples.filter(s => s.lot).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {[...new Set(column.extractedSamples.map(s => s.lot).filter(Boolean))].slice(0, 2).map((sample, i) => (
                                                                            <span key={i} className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[200px] truncate" title={sample}>
                                                                                {sample}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Select
                                                                value={mapping.subMappings.lot || ''}
                                                                onValueChange={(value: string) => handleSubMappingChange(index, 'lot', value)}
                                                            >
                                                                <SelectTrigger className={mapping.subMappings.lot === 'IGNORE' ? 'border-slate-200 bg-slate-100 text-slate-500' : mapping.subMappings.lot ? 'border-emerald-200 bg-emerald-50/30' : ''}>
                                                                    <SelectValue placeholder="Lot No için hedef başlık seçin..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="IGNORE" className="text-red-500 font-medium focus:text-red-600 focus:bg-red-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Ban className="w-4 h-4" />
                                                                            Hariç Tut
                                                                        </div>
                                                                    </SelectItem>
                                                                    <div className="border-t my-1" />
                                                                    {renderSelectItems(mapping.subMappings.lot)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}

                                                    {/* SKT Mapping */}
                                                    {mapping.subMappings.skt !== undefined && (
                                                        <div>
                                                            <div className="mb-2">
                                                                <Label className="text-sm font-medium text-slate-700 block mb-1">
                                                                    SKT
                                                                </Label>
                                                                {column.extractedSamples && column.extractedSamples.filter(s => s.skt).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {[...new Set(column.extractedSamples.map(s => s.skt).filter(Boolean))].slice(0, 2).map((sample, i) => (
                                                                            <span key={i} className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[200px] truncate" title={sample}>
                                                                                {sample}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Select
                                                                value={mapping.subMappings.skt || ''}
                                                                onValueChange={(value: string) => handleSubMappingChange(index, 'skt', value)}
                                                            >
                                                                <SelectTrigger className={mapping.subMappings.skt === 'IGNORE' ? 'border-slate-200 bg-slate-100 text-slate-500' : mapping.subMappings.skt ? 'border-emerald-200 bg-emerald-50/30' : ''}>
                                                                    <SelectValue placeholder="SKT için hedef başlık seçin..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="IGNORE" className="text-red-500 font-medium focus:text-red-600 focus:bg-red-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Ban className="w-4 h-4" />
                                                                            Hariç Tut
                                                                        </div>
                                                                    </SelectItem>
                                                                    <div className="border-t my-1" />
                                                                    {renderSelectItems(mapping.subMappings.skt)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}

                                                    {/* UBB Mapping */}
                                                    {mapping.subMappings.ubb !== undefined && (
                                                        <div>
                                                            <div className="mb-2">
                                                                <Label className="text-sm font-medium text-slate-700 block mb-1">
                                                                    UBB
                                                                </Label>
                                                                {column.extractedSamples && column.extractedSamples.filter(s => s.ubb).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {[...new Set(column.extractedSamples.map(s => s.ubb).filter(Boolean))].slice(0, 2).map((sample, i) => (
                                                                            <span key={i} className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 max-w-[200px] truncate" title={sample}>
                                                                                {sample}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Select
                                                                value={mapping.subMappings.ubb || ''}
                                                                onValueChange={(value: string) => handleSubMappingChange(index, 'ubb', value)}
                                                            >
                                                                <SelectTrigger className={mapping.subMappings.ubb === 'IGNORE' ? 'border-slate-200 bg-slate-100 text-slate-500' : mapping.subMappings.ubb ? 'border-emerald-200 bg-emerald-50/30' : ''}>
                                                                    <SelectValue placeholder="UBB için hedef başlık seçin..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="IGNORE" className="text-red-500 font-medium focus:text-red-600 focus:bg-red-50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Ban className="w-4 h-4" />
                                                                            Hariç Tut
                                                                        </div>
                                                                    </SelectItem>
                                                                    <div className="border-t my-1" />
                                                                    {renderSelectItems(mapping.subMappings.ubb)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

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
