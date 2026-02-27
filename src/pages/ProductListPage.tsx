import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Settings, Pencil, Trash2, ArrowUpDown, Upload, Package, CheckSquare, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Page, Product, CustomField } from '@/types';
import { productService } from '../services/productService';
import { customFieldService } from '../services/customFieldService';
import { toast } from 'sonner';
import { parseExcelFile, validateExcelFile } from '../utils/excelParser';
import { exportProductsToExcel } from '../utils/excelUtils';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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

type SortField = 'index' | 'name' | 'quantity' | string; // string includes custom field IDs
type SortDirection = 'asc' | 'desc';

export default function ProductListPage({ onNavigate }: ProductListPageProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [fields, setFields] = useState<CustomField[]>([]);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sortField, setSortField] = useState<SortField>('index');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [importMode, setImportMode] = useState<'list' | 'update'>('list');

    // Pagination States
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20; // Default page size

    // Bulk Delete States
    const [isMultiDeleteMode, setIsMultiDeleteMode] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentPage, sortField, sortDirection]);

    const loadData = async () => {
        try {
            const pageData = await productService.getProductsPage(currentPage, pageSize, sortField, sortDirection);
            setProducts(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);

            setFields(await customFieldService.getCustomFields());
        } catch (error: any) {
            toast.error('Ürün listesi yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
            console.error('loadData error:', error);
        }
    };

    const handleDeleteProduct = (productId: string) => {
        setDeleteProductId(productId);
    };

    const confirmDelete = async () => {
        if (!deleteProductId) return;

        try {
            await productService.deleteProduct(deleteProductId);
            toast.success('Ürün başarıyla silindi');
            await loadData();
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

    const handleExcelImport = (mode: 'list' | 'update' = 'list') => {
        setImportMode(mode);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        const validation = validateExcelFile(file);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        try {
            toast.loading('Excel dosyası okunuyor...');
            const parsed = await parseExcelFile(file);

            if (parsed.rows.length === 0) {
                toast.error('Excel dosyası boş');
                return;
            }

            if (parsed.rows.length > 1000) {
                toast.error('Maksimum 1000 satır destekleniyor');
                return;
            }

            // Navigate to import page with mode
            onNavigate('excel-import', { ...parsed, importMode });

            toast.dismiss();
        } catch (error: any) {
            toast.error(error.message || 'Dosya okunamadı');
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };



    // Bulk Delete Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProducts(new Set(products.map(p => p.id)));
        } else {
            setSelectedProducts(new Set());
        }
    };

    const handleToggleProduct = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedProducts);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedProducts(newSelected);
    };

    const handleDeleteAll = async () => {
        try {
            await productService.deleteAllProducts();
            toast.success('Tüm ürünler silindi');
            await loadData();
            setShowDeleteAllDialog(false);
            setSelectedProducts(new Set());
            setIsMultiDeleteMode(false);
        } catch (error) {
            toast.error('Silme işlemi başarısız');
        }
    };

    const handleDeleteSelected = async () => {
        try {
            await Promise.all(Array.from(selectedProducts).map(id => productService.deleteProduct(id)));
            toast.success(`${selectedProducts.size} ürün silindi`);
            setSelectedProducts(new Set());
            setIsMultiDeleteMode(false);
            await loadData();
            setShowDeleteSelectedDialog(false);
        } catch (error) {
            toast.error('Silme işlemi başarısız');
        }
    };

    const getFieldValue = (product: Product, field: CustomField): any => {
        // Check default fields first
        switch (field.id) {
            case 'quantity': return product.quantity !== undefined ? product.quantity : '';
            case 'serial_number': return product.serialNumber || '';
            case 'lot_number': return product.lotNumber || '';
            case 'expiry_date': return product.expiryDate || '';
            case 'ubb_code': return product.ubbCode || '';
            case 'product_code': return product.productCode || '';
            default:
                // Check custom fields
                return product.customFields[field.id] || '';
        }
    };

    // Get all fields that are actually being used in products AND are active
    const getUsedFields = () => {
        const usedFieldIds = new Set<string>();

        // Always show active fields
        fields.forEach(f => {
            if (f.isActive) {
                usedFieldIds.add(f.id);
            }
        });

        return fields.filter(f => usedFieldIds.has(f.id));
    };

    const usedFields = getUsedFields();

    // Sorting function (Updates state and triggers useEffect)
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction or reset
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else {
                setSortField('index');
                setSortDirection('asc');
            }
        } else {
            // New field, set to that field (ascending)
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(0); // Reset to first page when sorting changes
    };

    // Products are already sorted by the backend
    const sortedProducts = products;

    // Export Handler
    const handleExport = async () => {
        if (totalElements === 0) {
            toast.error('Dışa aktarılacak ürün bulunamadı');
            return;
        }

        try {
            // Fetch all products for export, not just the current page
            const allProducts = await productService.getProducts();
            await exportProductsToExcel(allProducts, fields);
            toast.success('Excel dosyası oluşturuldu');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

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
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <Button
                        onClick={() => setShowDeleteAllDialog(true)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Tüm Verileri Sil
                    </Button>
                    <Button
                        onClick={() => {
                            setIsMultiDeleteMode(!isMultiDeleteMode);
                            setSelectedProducts(new Set());
                        }}
                        variant={isMultiDeleteMode ? "default" : "outline"}
                        className={isMultiDeleteMode ? "bg-slate-800 text-white hover:bg-slate-700" : ""}
                    >
                        {isMultiDeleteMode ? (
                            <>
                                <X className="w-4 h-4 mr-2" />
                                Seçimi İptal Et
                            </>
                        ) : (
                            <>
                                <CheckSquare className="w-4 h-4 mr-2" />
                                Çoklu Sil
                            </>
                        )}
                    </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        onClick={() => onNavigate('custom-fields')}
                        variant="outline"
                        className="flex-1 min-w-[140px]"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Başlık Yönetimi
                    </Button>
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="flex-1 min-w-[140px]"
                    >
                        <Upload className="w-4 h-4 mr-2 rotate-180" /> {/* Rotate for download effect or use Download icon */}
                        Excel'e Aktar
                    </Button>
                    <Button
                        onClick={() => handleExcelImport('list')}
                        variant="outline"
                        className="flex-1 min-w-[140px]"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Liste İçe Aktar
                    </Button>
                    <Button
                        onClick={() => handleExcelImport('update')}
                        variant="outline"
                        className="flex-1 min-w-[140px]"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Veri İçe Aktar
                    </Button>
                    <Button
                        onClick={handleNewProduct}
                        className="flex-1 min-w-[140px]"
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
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Button
                                onClick={() => handleExcelImport('list')}
                                variant="outline"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Excel İle Liste İçeri Aktar
                            </Button>
                            <Button
                                onClick={() => handleExcelImport('update')}
                                variant="outline"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Excel İle Veri Aktar
                            </Button>
                            <Button onClick={handleNewProduct}>
                                <Plus className="w-4 h-4 mr-2" />
                                Yeni Ürün
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-lg border border-slate-200">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {isMultiDeleteMode && (
                                        <th className="px-4 py-3 w-10">
                                            <Checkbox
                                                checked={selectedProducts.size === products.length && products.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th
                                        className={`px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-slate-100 transition-colors ${sortField === 'index' ? 'text-black' : 'text-slate-700'
                                            }`}
                                        onClick={() => handleSort('index')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Sıra No
                                            <ArrowUpDown className={`w-4 h-4 transition-colors ${sortField === 'index' ? 'text-green-600' : 'text-slate-400'}`} />
                                        </div>
                                    </th>
                                    <th
                                        className={`px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-slate-100 transition-colors ${sortField === 'name' ? 'text-green-600' : 'text-slate-700'
                                            }`}
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Ürün Adı
                                            <ArrowUpDown className={`w-4 h-4 transition-colors ${sortField === 'name' ? 'text-green-600' : 'text-slate-400'}`} />
                                        </div>
                                    </th>
                                    {usedFields.map((field) => (
                                        <th
                                            key={field.id}
                                            className={`px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-slate-100 transition-colors ${sortField === field.id ? 'text-green-600' : 'text-slate-700'
                                                }`}
                                            onClick={() => handleSort(field.id)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {field.name}
                                                <ArrowUpDown className={`w-4 h-4 transition-colors ${sortField === field.id ? 'text-green-600' : 'text-slate-400'}`} />
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProducts.map((product, index) => (
                                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        {isMultiDeleteMode && (
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={selectedProducts.has(product.id)}
                                                    onCheckedChange={(checked: boolean) => handleToggleProduct(product.id, checked)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {(currentPage * pageSize) + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                            {product.name}
                                        </td>
                                        {usedFields.map((field) => {
                                            const rawValue = getFieldValue(product, field);
                                            const displayValue = rawValue && field.isClassified
                                                ? field.name.substring(0, 1).toUpperCase()
                                                : (rawValue || '-');

                                            return (
                                                <td key={field.id} className="px-4 py-3 text-sm text-slate-600">
                                                    {displayValue}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditProduct(product)}
                                                    className="h-8 w-8"
                                                >
                                                    <Pencil className="w-4 h-4 text-blue-600" />
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        className={currentPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        size="default"
                                    />
                                </PaginationItem>

                                {/* Simple implementation: display current / total. For a full app, render dynamic page numbers */}
                                <div className="text-sm font-medium text-slate-600 px-4">
                                    Sayfa {currentPage + 1} / {totalPages}
                                </div>

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                        className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        size="default"
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

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

            {/* Delete All Dialog */}
            <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tüm Verileri Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            TÜM ÜRÜNLERİ silmek istediğinizden emin misiniz?
                            Bu işlem geri alınamaz ve {products.length} ürün silinecek.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAll}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                            Tümünü Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Selected Dialog */}
            <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Seçili Ürünleri Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedProducts.size} ürünü silmek istediğinizden emin misiniz?
                            Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSelected}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                            Sil ({selectedProducts.size})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Floating Buttons */}
            {isMultiDeleteMode && (
                <>
                    {/* Left: Cancel Selection */}
                    <div className="fixed bottom-4 left-4 z-50">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                                setIsMultiDeleteMode(false);
                                setSelectedProducts(new Set());
                            }}
                            className="rounded-full w-14 h-14 shadow-xl hover:scale-105 transition-transform border-4 border-white"
                        >
                            <X className="w-8 h-8" />
                        </Button>
                    </div>

                    {/* Right: Delete Selected */}
                    {selectedProducts.size > 0 && (
                        <div className="fixed bottom-4 right-4 z-50">
                            <Button
                                onClick={() => setShowDeleteSelectedDialog(true)}
                                className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14 shadow-xl hover:scale-105 transition-transform flex items-center justify-center border-4 border-white"
                                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                            >
                                <Check className="w-8 h-8 text-white" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
