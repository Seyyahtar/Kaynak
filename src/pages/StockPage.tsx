import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, ArrowLeft, Upload, Download, Trash2, ArrowRightLeft, Edit, Check, Menu, Filter, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StockItem, Page } from '@/types';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import { importFromExcel, exportToExcel, exportImplantList } from '@/utils/excelUtils';
import DeviceGrouping from '@/components/DeviceGrouping';
import { productService } from '@/services/productService';
import { customFieldService } from '@/services/customFieldService';
import { Product, CustomField, UserRole } from '@/types';
import { UserFilter } from '@/components/UserFilter';
import { userService } from '@/services/userService';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_IMPLANT_TEMPLATE_URL = '/Implant list.xlsx';
const DEFAULT_IMPLANT_TEMPLATE_NAME = 'Implant list.xlsx';

const STORAGE_KEY_COLUMNS = 'stock_visible_columns';
const STORAGE_KEY_INACTIVE = 'inactive_fields';
const STORAGE_KEY_CLASSIFIED = 'classified_fields';

interface StockPageProps {
  onNavigate: (page: Page, data?: any) => void;
  currentUser: string;
  mode?: 'view' | 'select'; // New prop
}

interface MaterialGroup {
  fullName: string;
  totalQuantity: number;
  items: StockItem[];
  colorClass?: string;
}

interface PrefixGroup {
  prefix: string;
  totalQuantity: number;
  materials: MaterialGroup[];
}

type SortOrder = 'none' | 'asc' | 'desc';
type SortField = 'expiryDate' | 'quantity';

export default function StockPage({ onNavigate, currentUser, mode = 'view' }: StockPageProps) { // Default mode is 'view'
  const isSelectMode = mode === 'select';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  const defaultStartStr = defaultStart.toISOString().split('T')[0];

  const [menuOpen, setMenuOpen] = useState(false);
  const [deviceGroupOpen, setDeviceGroupOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expandedPrefixes, setExpandedPrefixes] = useState<Set<string>>(new Set());
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [stock, setStock] = useState<StockItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<StockItem>>({});
  const [sortStates, setSortStates] = useState<{ [key: string]: { field: SortField | null, order: SortOrder } }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [implantExportOpen, setImplantExportOpen] = useState(false);
  const [implantStartDate, setImplantStartDate] = useState(defaultStartStr);
  const [implantEndDate, setImplantEndDate] = useState(todayStr);
  const [implantTemplateData, setImplantTemplateData] = useState<ArrayBuffer | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // For selection mode

  // User Filter State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>();
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map()); // id -> fullName for coloring lookup

  // Dynamic Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Base Stock Columns (Non-dynamic part)
  const baseStockColumns = [
    { id: 'serialLotNumber', label: 'Seri/Lot No' },
    { id: 'ubbCode', label: 'UBB Kodu' },
    { id: 'expiryDate', label: 'Son Kullanma Tarihi' },
    { id: 'quantity', label: 'Miktar' },
    { id: 'from', label: 'Kimden' },
    { id: 'to', label: 'Kime' },
    { id: 'materialCode', label: 'Malzeme Kodu' },
    // Owner name should be visible for admin/privileged roles
    { id: 'ownerName', label: 'Sahip' },
    { id: 'dateAdded', label: 'Eklenme Tarihi' },
  ];

  // Dynamic Stock Columns (Merge base + active custom fields)
  // We exclude fields that are already in base (quality, serial_number, lot_number, expiry_date, ubb_code, product_code)
  const dynamicColumns = [
    ...baseStockColumns,
    ...customFields
      .filter(f => !['quantity', 'serial_number', 'lot_number', 'expiry_date', 'ubb_code', 'product_code'].includes(f.id) && f.isActive)
      .map(f => ({ id: f.id, label: f.name }))
  ];

  // Column Visibility State
  // Initialize with all columns visible by default
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(dynamicColumns.map(c => c.id)));
  const [isHeadersOpen, setIsHeadersOpen] = useState(false);

  useEffect(() => {
    loadStock();
    loadVisibilitySettings();
    loadDynamicData();
    loadCurrentUserRole();
    loadUsers();
  }, []);

  const loadCurrentUserRole = () => {
    setCurrentUserRole(storage.getUser()?.role);
  };

  const loadUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      const map = new Map<string, string>();
      users.forEach(u => map.set(u.fullName, u.id));
      setUsersMap(map);
    } catch (e) {
      console.error("Failed to load users for mapping", e);
    }
  }

  const loadDynamicData = () => {
    setProducts(productService.getProducts());
    setCustomFields(customFieldService.getCustomFields());
  };

  const loadVisibilitySettings = () => {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (saved) {
      try {
        const savedArray = JSON.parse(saved);
        // Important: When dynamic fields are added, they should be visible by default 
        // if not explicitly hidden or if this is the first time we see them.
        setVisibleColumns(new Set(savedArray));
      } catch (e) {
        console.error('Visibility settings load error', e);
      }
    }
  };

  const toggleColumnVisibility = (columnId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    const updated = new Set(newVisible);
    setVisibleColumns(updated);
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(Array.from(updated)));
  };

  const resetVisibility = () => {
    const defaultColumns = new Set(dynamicColumns.map(c => c.id));
    setVisibleColumns(defaultColumns);
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(Array.from(defaultColumns)));
  };

  const showAllColumns = () => {
    const allIds = dynamicColumns.map(c => c.id);
    const allSet = new Set(allIds);
    setVisibleColumns(allSet);
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(allIds));
  };

  useEffect(() => {
    if (implantTemplateData) return;

    const loadDefaultTemplate = async () => {
      try {
        const response = await fetch(encodeURI(DEFAULT_IMPLANT_TEMPLATE_URL));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        setImplantTemplateData(buffer);
      } catch (error) {
        console.warn('Varsayilan implant sablonu yuklenemedi', error);
        toast.error('Varsayilan implant sablonu yuklenemedi. Lutfen yeniden deneyin.');
      }
    };

    loadDefaultTemplate();
  }, [implantTemplateData]);

  const loadStock = async () => {
    const stockData = await storage.getStock();
    setStock(stockData);
  };

  const toggleFilter = (filterName: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filterName)) {
      newFilters.delete(filterName);
    } else {
      newFilters.add(filterName);
    }
    setActiveFilters(newFilters);
  };

  const filterStockByCategory = (item: StockItem): boolean => {
    // Eğer hiç filtre seçili değilse, tümünü göster
    if (activeFilters.size === 0) return true;

    const materialName = item.materialName.toLowerCase();

    // Lead filtresi
    if (activeFilters.has('lead')) {
      if (materialName.includes('solia') ||
        materialName.includes('sentus') ||
        materialName.includes('plexa')) {
        return true;
      }
    }

    // Sheath filtresi
    if (activeFilters.has('sheath')) {
      if (materialName.includes('safesheath') ||
        materialName.includes('adelante') ||
        materialName.includes('li-7') ||
        materialName.includes('li-8')) {
        return true;
      }
    }

    // Pacemaker filtresi
    if (activeFilters.has('pacemaker')) {
      if (materialName.includes('amvia sky') ||
        materialName.includes('endicos') ||
        materialName.includes('enitra') ||
        materialName.includes('edora')) {
        return true;
      }
    }

    // ICD filtresi (VR-T veya DR-T içeren ama pacemaker olmayan)
    if (activeFilters.has('icd')) {
      const isPacemaker = materialName.includes('amvia sky') ||
        materialName.includes('endicos') ||
        materialName.includes('enitra') ||
        materialName.includes('edora');
      if (!isPacemaker && (materialName.includes('vr-t') || materialName.includes('dr-t'))) {
        return true;
      }
    }

    // CRT filtresi
    if (activeFilters.has('crt')) {
      if (materialName.includes('hf-t')) {
        return true;
      }
    }

    return false;
  };

  const filterStockBySearch = (item: StockItem): boolean => {
    if (!searchText.trim()) return true;

    const search = searchText.toLowerCase();
    return item.materialName.toLowerCase().includes(search) ||
      item.serialLotNumber.toLowerCase().includes(search) ||
      item.ubbCode.toLowerCase().includes(search);
  };

  const filterStockByUser = (item: StockItem): boolean => {
    if (selectedUserIds.size === 0) return true;
    // item.ownerName serves as the identifier in the UI for now, but filtering usually works best with IDs.
    // However, our backend DTO sends ownerName.
    // If we want exact filtering, we might need to map ownerName back to ID or filter by ownerName directly if UserFilter returned names.
    // But UserFilter returns IDs.
    // Let's use the usersMap to find the ID for the item.ownerName

    if (!item.ownerName) return false; // Should not happen for admin view if backend works
    const ownerId = usersMap.get(item.ownerName);
    return ownerId ? selectedUserIds.has(ownerId) : false;
  };

  const toggleItemSelection = (item: StockItem) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
  };

  const handleConfirmSelection = () => {
    const selectedStockItems = stock.filter(item => selectedItems.has(item.id));
    onNavigate('stock-management', selectedStockItems);
  };

  const handleCancelSelection = () => {
    onNavigate('stock-management'); // Go back without selection
  };

  const handleExportToExcel = async () => {
    try {
      const stockData = await storage.getStock();
      if (stockData.length === 0) {
        toast.error('Dışa aktarılacak stok verisi yok');
        return;
      }
      await exportToExcel(stockData);
      toast.success('Excel dosyası oluşturuldu. Paylaşım menüsünden "Dosyalar" seçerek konum belirleyin.');
    } catch (error) {
      toast.error('Excel dışa aktarma hatası: ' + (error as Error).message);
      console.error('Excel export error:', error);
    }
  };

  const handleExportImplantList = async () => {
    if (!implantStartDate || !implantEndDate) {
      toast.error('Baslangic ve bitis tarihlerini secin');
      return;
    }

    if (!implantTemplateData) {
      toast.error('Varsayilan sablon kullanilamadi, lutfen bir sablon dosyasi secin');
      return;
    }

    const start = new Date(implantStartDate);
    const end = new Date(implantEndDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error('Gecerli tarih girin');
      return;
    }

    if (start > end) {
      toast.error('Baslangic tarihi bitis tarihinden buyuk olamaz');
      return;
    }

    const cases = await storage.getCases();
    const filtered = cases.filter((c) => {
      const d = new Date(c.date);
      return !isNaN(d.getTime()) && d >= start && d <= end;
    });

    if (filtered.length === 0) {
      toast.error('Bu tarih araliginda vaka bulunamadi');
      return;
    }

    try {
      const fileLabel = 'BIO-TR_implant_list_' + implantStartDate + '_' + implantEndDate + '.xlsx';
      await exportImplantList(filtered, currentUser, fileLabel, implantTemplateData);
      toast.success(filtered.length + ' vaka için implant listesi oluşturuldu. Paylaşım menüsünden konum seçin.');
    } catch (err) {
      console.error(err);
      toast.error('Implant listesi disa aktarma hatasi');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedItems = await importFromExcel(file);

      if (importedItems.length === 0) {
        toast.error('Excel dosyasında geçerli veri bulunamadı');
        return;
      }

      // Duplicate kontrolü yap
      const duplicates: string[] = [];
      const uniqueItems: StockItem[] = [];

      for (const item of importedItems) {
        if (await storage.checkDuplicate(item.materialName, item.serialLotNumber)) {
          duplicates.push(`${item.materialName} (${item.serialLotNumber})`);
        } else {
          uniqueItems.push(item);
        }
      }

      if (duplicates.length > 0) {
        toast.error(`${duplicates.length} adet malzeme zaten stokta kayıtlı ve atlandı: ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`);
      }

      if (uniqueItems.length === 0) {
        toast.error('Tüm malzemeler zaten stokta kayıtlı');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Toplu olarak unique item'ları storage'a ekle (backend tek geçmiş kaydı oluşturur)
      await storage.bulkAddStock(uniqueItems);

      const totalQuantity = uniqueItems.reduce((sum, item) => sum + item.quantity, 0);
      toast.success(`${uniqueItems.length} kayıt (${totalQuantity} adet) başarıyla içe aktarıldı${duplicates.length > 0 ? ` (${duplicates.length} kayıt atlandı)` : ''}`);
      loadStock();

      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Excel dosyası içe aktarılamadı: ' + error);
      console.error(error);
    }
  };
  // Filtrelenmis stok sayisini hesapla
  const filteredStockData = React.useMemo(() => {
    return stock.filter(item => {
      return filterStockByCategory(item) && filterStockBySearch(item) && filterStockByUser(item);
    });
  }, [stock, activeFilters, searchText]);

  const totalFilteredQuantity = React.useMemo(() => {
    return filteredStockData.reduce((sum, item) => sum + item.quantity, 0);
  }, [filteredStockData]);

  const totalItemCount = React.useMemo(() => {
    return filteredStockData.length;
  }, [filteredStockData]);

  const totalSelectedQuantity = React.useMemo(() => {
    return stock.filter(item => selectedItems.has(item.id)).reduce((sum, item) => sum + item.quantity, 0);
  }, [stock, selectedItems]);

  // Hiyerarşik gruplandırma: Prefix -> Tam isim -> Detaylar
  const hierarchicalGroups: PrefixGroup[] = React.useMemo(() => {
    // Önce tam isme göre grupla
    const materialGroups: { [key: string]: MaterialGroup } = {};

    filteredStockData.forEach(item => {
      if (!materialGroups[item.materialName]) {
        materialGroups[item.materialName] = {
          fullName: item.materialName,
          totalQuantity: 0,
          items: [],
        };
      }
      materialGroups[item.materialName].totalQuantity += item.quantity;
      materialGroups[item.materialName].items.push(item);

      // Assign color to the group if all items belong to same user (or mixed?)
      // Since grouping is by material name, it can contain items from multiple users.
      // But usually we display individual lines in the accordion.
      // We will handle coloring at the row level in the render.
    });

    // Sonra prefix'e göre grupla (ilk kelimeye göre)
    const prefixGroups: { [key: string]: PrefixGroup } = {};

    Object.values(materialGroups).forEach(materialGroup => {
      // İlk kelimeyi prefix olarak al
      const prefix = materialGroup.fullName.split(' ')[0];

      if (!prefixGroups[prefix]) {
        prefixGroups[prefix] = {
          prefix,
          totalQuantity: 0,
          materials: [],
        };
      }

      prefixGroups[prefix].totalQuantity += materialGroup.totalQuantity;
      prefixGroups[prefix].materials.push(materialGroup);
    });

    // Her prefix grubu içindeki malzemeleri sırala
    Object.values(prefixGroups).forEach(group => {
      group.materials.sort((a, b) => a.fullName.localeCompare(b.fullName));
    });

    return Object.values(prefixGroups).sort((a, b) =>
      a.prefix.localeCompare(b.prefix)
    );
  }, [stock, activeFilters, searchText]);

  const togglePrefix = (prefix: string) => {
    const newExpanded = new Set(expandedPrefixes);
    if (newExpanded.has(prefix)) {
      newExpanded.delete(prefix);
    } else {
      newExpanded.add(prefix);
    }
    setExpandedPrefixes(newExpanded);
  };

  const toggleMaterial = (fullName: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(fullName)) {
      newExpanded.delete(fullName);
    } else {
      newExpanded.add(fullName);
    }
    setExpandedMaterials(newExpanded);
  };

  const handleDeleteItem = async (item: StockItem) => {
    if (window.confirm('Bu malzemeyi envanterden kaldırmak istediğinize emin misiniz?')) {
      await storage.deleteStockItem(item.id);
      await storage.addHistory({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        type: 'stock-delete',
        description: `${item.materialName} silindi (${item.quantity} adet) - ${currentUser}`,
        details: item,
      });
      toast.success('Malzeme envanterden kaldırıldı');
      loadStock();
    }
  };

  const handleRemoveStock = (item: StockItem) => {
    onNavigate('stock-management', [item]);
  };

  const handleEdit = (item: StockItem) => {
    setEditingItemId(item.id);
    setEditingValues({
      serialLotNumber: item.serialLotNumber,
      ubbCode: item.ubbCode,
      expiryDate: item.expiryDate,
      quantity: item.quantity,
    });
  };

  const handleSaveEdit = async (item: StockItem) => {
    const updatedItem: StockItem = {
      ...item,
      serialLotNumber: editingValues.serialLotNumber || item.serialLotNumber,
      ubbCode: editingValues.ubbCode || item.ubbCode,
      expiryDate: editingValues.expiryDate || item.expiryDate,
      quantity: editingValues.quantity || item.quantity,
    };

    await storage.updateStockItem(item.id, updatedItem);
    await storage.addHistory({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'stock-remove',
      description: `${item.materialName} düzenlendi - ${currentUser}`,
      details: { old: item, new: updatedItem },
    });

    toast.success('Malzeme başarıyla güncellendi');
    setEditingItemId(null);
    setEditingValues({});
    loadStock();
  };

  const handleSort = (key: string, field: SortField) => {
    setSortStates(prev => {
      const currentSort = prev[key];
      let newOrder: SortOrder = 'asc';

      if (currentSort?.field === field) {
        if (currentSort.order === 'asc') {
          newOrder = 'desc';
        } else if (currentSort.order === 'desc') {
          newOrder = 'none';
        }
      }

      return {
        ...prev,
        [key]: { field: newOrder === 'none' ? null : field, order: newOrder }
      };
    });
  };

  const getSortedItems = (items: StockItem[], key: string) => {
    const sortState = sortStates[key];
    if (!sortState || sortState.order === 'none' || !sortState.field) {
      return items;
    }

    const sorted = [...items].sort((a, b) => {
      if (sortState.field === 'expiryDate') {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return sortState.order === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortState.field === 'quantity') {
        return sortState.order === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
      }
      return 0;
    });

    return sorted;
  };

  const getSortHeaderClass = (key: string, field: SortField) => {
    const sortState = sortStates[key];
    if (sortState?.field === field) {
      if (sortState.order === 'asc') {
        return 'text-red-600 cursor-pointer hover:bg-gray-200';
      } else if (sortState.order === 'desc') {
        return 'text-green-600 cursor-pointer hover:bg-gray-200';
      }
    }
    return 'text-slate-700 cursor-pointer hover:bg-gray-200';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header Area */}
      {!isSelectMode && (
        <div className="bg-white border-b p-4 sticky top-0 z-20">
          {/* ... Only show normal header in view mode ... */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => onNavigate('home')}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex gap-2 items-center">
              <UserFilter
                selectedUserIds={selectedUserIds}
                onSelectionChange={setSelectedUserIds}
                userColors={userColors}
                onColorMapChange={setUserColors}
                currentUserRole={currentUserRole}
              />
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}><Menu className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setFilterOpen(!filterOpen)} className={activeFilters.size > 0 || searchText ? 'text-blue-600' : ''}><Filter className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Mode Header is implicit or just use sticky footer. 
          Maybe a simple header for Select Mode too? 
          User didn't ask for header in select mode, just sticky footer.
      */}

      {/* ... Filters and Menu (hide in select mode generally or allow filtering?) Allow filtering is good. ... */}
      {(filterOpen || isSelectMode) && ( // Show filter in select mode too maybe? Yes.
        <div className="bg-white border-b shadow-lg sticky top-0 z-20">
          {/* Simplified header for Select Mode if needed, or reuse existing filter panel styling but maybe always visible? 
                Let's reuse existing filter logic but maybe keep header hidden in select mode if user wants full focus? 
                Actually user said "middle bottom text showing count", so header might not be needed.
                But Filter capability is useful to find items to select.
             */}
          {isSelectMode && (
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between relative shadow-md z-30">
              {/* Left Spacer to balance the Right button for true centering */}
              <div className="w-24"></div>

              {/* Center Text */}
              <div className="font-semibold text-lg absolute left-1/2 transform -translate-x-1/2 w-full text-center pointer-events-none">
                {selectedItems.size} Malzeme <span className="text-blue-100 text-sm ml-1">({totalSelectedQuantity} Adet)</span>
              </div>

              {/* Right Filter Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterOpen(!filterOpen)}
                className="text-white hover:bg-blue-700 w-24 z-40"
              >
                <Filter className="w-4 h-4 mr-1" /> Filtrele
              </Button>
            </div>
          )}

          {filterOpen && (
            <div className="p-4 space-y-3 bg-white">
              {/* ... Existing filter UI ... */}
              <div>
                <Input type="text" placeholder="Stokta ara..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full" />
              </div>
              {/* ... Filter Buttons ... */}
              {/* ... Same as before ... */}
              <div className="space-y-2">
                <p className="text-slate-600">Kategori Filtreleri:</p>
                <div className="flex flex-wrap gap-2">
                  {['lead', 'sheath', 'pacemaker', 'icd', 'crt'].map(f => (
                    <Button key={f} variant={activeFilters.has(f) ? 'default' : 'outline'} size="sm" onClick={() => toggleFilter(f)} className="capitalize">{f}</Button>
                  ))}
                </div>
                {(activeFilters.size > 0 || searchText) && (
                  <Button variant="ghost" size="sm" onClick={() => { setActiveFilters(new Set()); setSearchText(''); }} className="w-full">Tüm Filtreleri Temizle</Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Açılır Menü İçerik */}
      {!isSelectMode && menuOpen && (
        <div className="bg-white border-b shadow-lg">
          <div className="p-4 space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => onNavigate('stock-management')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Stok Transferi
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleExportToExcel}
            >
              <Upload className="w-4 h-4 mr-2" />
              Excel ile Disari Aktar
            </Button>
            <Button
              className="w-full justify-start"
              variant={implantExportOpen ? 'default' : 'outline'}
              onClick={() => setImplantExportOpen(!implantExportOpen)}
            >
              <Download className="w-4 h-4 mr-2" />
              Implant Listesi Disa Aktar
            </Button>
            {implantExportOpen && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Baslangic tarihi</Label>
                    <Input
                      type="date"
                      value={implantStartDate}
                      onChange={(e) => setImplantStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Bitis tarihi</Label>
                    <Input
                      type="date"
                      value={implantEndDate}
                      onChange={(e) => setImplantEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                </div>
                <Button className="w-full" onClick={handleExportImplantList}>
                  Implant listesi olustur
                </Button>
              </div>
            )}
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleImportClick}
            >
              <Download className="w-4 h-4 mr-2" />
              Excel ile ice Aktar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Başlık Özelleştirme - Menu Icinde (Accordion) */}
            <div className="pt-2 border-t mt-2">
              <div
                className="w-full flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 rounded"
                onClick={() => setIsHeadersOpen(!isHeadersOpen)}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">Başlıkları Özelleştir</span>
                </div>
                {isHeadersOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
              {isHeadersOpen && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={showAllColumns} className="flex-1 text-[10px] h-7">Tümünü Göster</Button>
                    <Button variant="outline" size="sm" onClick={resetVisibility} className="flex-1 text-[10px] h-7">Varsayılana Dön</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {dynamicColumns.map((column) => (
                      <div key={column.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`col-${column.id}`}
                          checked={visibleColumns.has(column.id)}
                          onCheckedChange={() => toggleColumnVisibility(column.id)}
                        />
                        <Label
                          htmlFor={`col-${column.id}`}
                          className="text-xs font-medium cursor-pointer flex-1"
                        >
                          {column.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cihaz Adetleri - Menu Icinde */}
            <div className="pt-2 border-t">
              <div
                className="w-full flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 rounded"
                onClick={() => setDeviceGroupOpen(!deviceGroupOpen)}
              >
                <span className="text-slate-700">Cihaz Adetleri</span>
                {deviceGroupOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
              {deviceGroupOpen && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <DeviceGrouping stock={stock} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stok Sayısı Göstergesi */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-700">
              Malzeme: <span className="text-blue-600">{totalItemCount}</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-700">
              Adet: <span className="text-blue-600">{totalFilteredQuantity}</span>
            </span>
          </div>
          {(activeFilters.size > 0 || searchText) && (
            <span className="text-slate-500 text-xs">
              (filtrelenmiş)
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 ${isSelectMode ? 'pb-24' : ''}`}>
        {hierarchicalGroups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500">
              {(activeFilters.size > 0 || searchText)
                ? 'Filtreleme sonucu malzeme bulunamadı'
                : 'Envanterde malzeme bulunmuyor'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2 pb-4">
            {hierarchicalGroups.map((prefixGroup) => {
              const isPrefixExpanded = expandedPrefixes.has(prefixGroup.prefix);

              return (
                <Card key={prefixGroup.prefix} className="overflow-hidden">
                  {/* Seviye 1: Prefix Başlığı */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-blue-50"
                    onClick={() => togglePrefix(prefixGroup.prefix)}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                      >
                        {isPrefixExpanded ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                      <div>
                        <p className="text-slate-800">{prefixGroup.prefix}</p>
                        <p className="text-slate-500">Toplam: {prefixGroup.totalQuantity} adet</p>
                      </div>
                    </div>
                    {isPrefixExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Seviye 2: Tam Malzeme Adı Listesi */}
                  {isPrefixExpanded && (
                    <div className="bg-gray-50 border-t">
                      {prefixGroup.materials.map((material) => {
                        const isMaterialExpanded = expandedMaterials.has(material.fullName);
                        const sortKey = `${prefixGroup.prefix}-${material.fullName}`;
                        const sortedItems = getSortedItems(material.items, sortKey);

                        return (
                          <div key={material.fullName} className="border-b last:border-b-0">
                            <div
                              className="p-3 pl-12 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleMaterial(material.fullName)}
                            >
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                >
                                  {isMaterialExpanded ? (
                                    <Minus className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                </Button>
                                <div>
                                  <p className="text-slate-700">{material.fullName}</p>
                                  <p className="text-slate-500">{material.totalQuantity} Adet</p>
                                </div>
                              </div>
                              {isMaterialExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </div>

                            {/* Seviye 3: Detay Tablosu */}
                            {isMaterialExpanded && (
                              <div className="bg-white overflow-x-auto ml-12">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      {dynamicColumns.map(col => visibleColumns.has(col.id) && (
                                        <th
                                          key={col.id}
                                          className={`p-2 border-r text-slate-700 text-sm font-semibold ${(col.id === 'expiryDate' || col.id === 'quantity') ? getSortHeaderClass(sortKey, col.id as SortField) : ''}`}
                                          onClick={(col.id === 'expiryDate' || col.id === 'quantity') ? (e) => {
                                            e.stopPropagation();
                                            handleSort(sortKey, col.id as SortField);
                                          } : undefined}
                                        >
                                          {col.label}
                                        </th>
                                      ))}
                                      <th className="p-2 text-slate-700 text-sm font-semibold">{isSelectMode ? 'Seç' : 'İşlemler'}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sortedItems.map((item) => {
                                      const isEditing = editingItemId === item.id;
                                      const isSelected = selectedItems.has(item.id);
                                      const product = products.find(p => p.name === material.fullName);

                                      return (
                                        <tr key={item.id}
                                          className={`border-t hover:bg-gray-50 cursor-pointer ${isSelectMode && isSelected ? 'bg-green-50' : ''}`}
                                          onClick={isSelectMode ? () => toggleItemSelection(item) : undefined}
                                        >
                                          {visibleColumns.has('serialLotNumber') && (
                                            <td className="p-2 border-r text-slate-600">
                                              {isEditing ? (
                                                <Input
                                                  value={editingValues.serialLotNumber || ''}
                                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                    ...editingValues,
                                                    serialLotNumber: e.target.value
                                                  })}
                                                  className="h-8"
                                                />
                                              ) : (
                                                item.serialLotNumber
                                              )}
                                            </td>
                                          )}
                                          {visibleColumns.has('ubbCode') && (
                                            <td className="p-2 border-r text-slate-600">
                                              {isEditing ? (
                                                <Input
                                                  value={editingValues.ubbCode || ''}
                                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                    ...editingValues,
                                                    ubbCode: e.target.value
                                                  })}
                                                  className="h-8"
                                                />
                                              ) : (
                                                item.ubbCode
                                              )}
                                            </td>
                                          )}
                                          {visibleColumns.has('expiryDate') && (
                                            <td className="p-2 border-r text-slate-600">
                                              {isEditing ? (
                                                <Input
                                                  type="date"
                                                  value={editingValues.expiryDate || ''}
                                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                    ...editingValues,
                                                    expiryDate: e.target.value
                                                  })}
                                                  className="h-8"
                                                />
                                              ) : (
                                                item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('tr-TR') : '-'
                                              )}
                                            </td>
                                          )}
                                          {dynamicColumns.filter(col => visibleColumns.has(col.id)).map(column => (
                                            <td key={column.id} className="p-2 border-r text-slate-600">
                                              {isEditing && ['serialLotNumber', 'ubbCode', 'expiryDate', 'quantity'].includes(column.id) ? (
                                                column.id === 'serialLotNumber' ? (
                                                  <Input
                                                    value={editingValues.serialLotNumber || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                      ...editingValues,
                                                      serialLotNumber: e.target.value
                                                    })}
                                                    className="h-8"
                                                  />
                                                ) : column.id === 'ubbCode' ? (
                                                  <Input
                                                    value={editingValues.ubbCode || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                      ...editingValues,
                                                      ubbCode: e.target.value
                                                    })}
                                                    className="h-8"
                                                  />
                                                ) : column.id === 'expiryDate' ? (
                                                  <Input
                                                    type="date"
                                                    value={editingValues.expiryDate || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                      ...editingValues,
                                                      expiryDate: e.target.value
                                                    })}
                                                    className="h-8"
                                                  />
                                                ) : column.id === 'quantity' ? (
                                                  <Input
                                                    type="number"
                                                    value={editingValues.quantity || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValues({
                                                      ...editingValues,
                                                      quantity: parseInt(e.target.value)
                                                    })}
                                                    className="h-8"
                                                    min="1"
                                                  />
                                                ) : null
                                              ) : (
                                                column.id === 'expiryDate' ? (
                                                  item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('tr-TR') : '-'
                                                ) : column.id === 'quantity' ? (
                                                  <span className={item.quantity <= 5 ? 'text-red-600 font-bold' : ''}>
                                                    {item.quantity}
                                                  </span>
                                                ) : column.id === 'ownerName' ? (
                                                  (item as any).ownerName || '-'
                                                ) : column.id === 'dateAdded' ? (
                                                  item.dateAdded ? new Date(item.dateAdded).toLocaleDateString('tr-TR') : '-'
                                                ) : (
                                                  (item as any)[column.id] || '-'
                                                )
                                              )}
                                            </td>
                                          ))}

                                          {/* Dynamic Custom Fields from Product */}
                                          {customFields
                                            .filter(f => !['quantity', 'serial_number', 'lot_number', 'expiry_date', 'ubb_code', 'product_code'].includes(f.id) && f.isActive)
                                            .map(field => visibleColumns.has(field.id) && (
                                              <td key={field.id} className="p-2 border-r text-slate-600">
                                                {(() => {
                                                  const rawValue = product?.customFields?.[field.id] || '-';
                                                  if (rawValue === '-' || !field.isClassified) return rawValue;
                                                  return `${field.name.substring(0, 1).toUpperCase()}: ${rawValue}`;
                                                })()}
                                              </td>
                                            ))}

                                          <td className="p-2 text-center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                            {isEditing ? (
                                              <Button
                                                size="sm"
                                                variant="default"
                                                onClick={(e: React.MouseEvent) => {
                                                  e.stopPropagation();
                                                  handleSaveEdit(item);
                                                }}
                                                title="Onayla"
                                              >
                                                <Check className="w-3 h-3" />
                                              </Button>
                                            ) : isSelectMode ? (
                                              <div className="flex items-center justify-center">
                                                <div
                                                  className={`w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer ${isSelected ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}
                                                  onClick={() => toggleItemSelection(item)}
                                                >
                                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex gap-1 justify-center">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleEdit(item);
                                                  }}
                                                  title="Düzenle"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleRemoveStock(item);
                                                  }}
                                                  title="Stoktan Çıkar"
                                                >
                                                  <ArrowRightLeft className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleDeleteItem(item);
                                                  }}
                                                  title="Sil"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )
                            }
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div >
        )}
      </div >

      {/* Selection Mode Floating Action Buttons */}
      {isSelectMode && (
        <>
          {/* Left: Cancel (Red Cross) - Floating */}
          <div className="fixed bottom-4 left-4 z-50">
            <Button
              variant="destructive"
              size="icon"
              onClick={handleCancelSelection}
              className="rounded-full w-14 h-14 shadow-xl hover:scale-105 transition-transform border-4 border-white"
            >
              <X className="w-8 h-8" />
            </Button>
          </div>

          {/* Right: Confirm (Green Tick) - Floating */}
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              onClick={handleConfirmSelection}
              className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14 shadow-xl hover:scale-105 transition-transform flex items-center justify-center border-4 border-white"
            >
              <Check className="w-8 h-8 text-white" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
