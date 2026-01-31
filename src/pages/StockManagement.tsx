import React, { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Plus, Box, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Page, StockItem, User } from '@/types';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import StockAddModal from '@/components/StockAddModal';
import { userService } from '@/services/userService';
import { stockService } from '@/services/stockService';

interface StockManagementProps {
  onNavigate: (page: Page, data?: StockItem[]) => void;
  currentUser: string;
  prefillData?: StockItem[] | null;
}

export default function StockManagement({ onNavigate, currentUser, prefillData }: StockManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [items, setItems] = useState<Partial<StockItem>[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load users for dropdown
    const loadUsers = async () => {
      try {
        const allUsers = await userService.getAllUsers();
        // Filter out current user AND admins/managers
        setUsers(allUsers.filter(u => u.username !== currentUser && u.role !== 'ADMIN' && u.role !== 'YONETICI'));
      } catch (error) {
        console.error('Failed to load users', error);
      }
    };
    loadUsers();

    // Load prefill data if exists (from multi-select)
    if (prefillData && Array.isArray(prefillData)) {
      setItems(prev => [...prev, ...prefillData]);
    }
  }, [currentUser, prefillData]);

  const handleAddItem = async (item: Partial<StockItem>) => {
    // Manuel eklenen stoklar stokta mevcut olmalı
    if (!item.materialName || !item.serialLotNumber) {
      toast.error('Malzeme adı ve Seri/Lot numarası zorunludur');
      return;
    }

    try {
      const isDuplicate = await storage.checkDuplicate(item.materialName, item.serialLotNumber);
      if (!isDuplicate) {
        toast.error('Bu malzeme stoklarınızda bulunmamaktadır. Sadece stokta olan malzemeleri transfer edebilirsiniz.');
        return;
      }

      // Stokta varsa, ID ve diğer bilgileri çekmemiz lazım ki transfer yapabilelim.
      // Ancak checkDuplicate sadece boolean dönüyor. 
      // Doğru yöntem: Stoktan bu itemi bulmak.
      const currentStock = await storage.getStock();
      const stockItem = currentStock.find(s =>
        s.materialName === item.materialName &&
        s.serialLotNumber === item.serialLotNumber
      );

      if (!stockItem) {
        toast.error('Stok bilgisi alınamadı.');
        return;
      }

      // Add with ID from stock
      setItems(prev => [...prev, { ...item, id: stockItem.id }]);
      toast.success('Malzeme listeye eklendi');

    } catch (error) {
      console.error('Stok kontrolü hatası', error);
      toast.error('Stok kontrolü yapılamadı');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, newQuantity: string) => {
    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 1) return;

    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], quantity: qty };
      return newItems;
    });
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error('Lütfen transfer edilecek kullanıcıyı seçin');
      return;
    }

    if (items.length === 0) {
      toast.error('Lütfen en az bir malzeme ekleyin');
      return;
    }

    setLoading(true);
    try {
      // Find receiver ID
      const receiver = users.find(u => u.username === selectedUser);
      if (!receiver) throw new Error('Alıcı bulunamadı');

      // Convert items to transfer request format
      // Note: If items are new (manual add), they don't have ID. 
      // Transfer logic assumes existing stock items.
      // If manual items are added, they should be created first? 
      // Requirement says "Malzeme ekle butonu vaka sayfasındaki gibi... Stok yönetimi sayfasında... işlem açılacak".
      // If items are manually added here, do they exist in stock? 
      // If not, maybe they are just free text? 
      // BUT transfer logic `initiateTransfer` requires `stockItemId`.
      // Conflict: `stockService.initiateTransfer` deducts from SENDER stock.
      // So sender MUST have these items.
      // If user manually adds item here, it means they are selecting from their offline stock?
      // Or manually entering details of an existing stock item?
      // "Malzeme Ekle" button in StockManagement implies adding to the list.
      // If the item doesn't exist in system, we can't transfer it via `initiateTransfer` which needs ID.

      // Pivot: Maybe "Malzeme Ekle" here is just for "Stock Entry" (Stok Girişi)?
      // User request: "Stok yönetimi sayfasında işlemi tamamla dendiğinde stoklar bir kullanıcıdan diğer kullanıcıya aktarılmak üzere bir işlem açılacak"
      // So this page is purely for TRANSFER.
      // Manual "Add" button here might be confusing if it requires ID. 
      // User said "vaka sayfasındaki ekle butonuyla benzer özellikler gösterecek".
      // In Case Entry, you add materials used. They are deducted.
      // If the user manually types a material, we need to match it to a stock item ID?
      // Or does the user mean "Add NEW stock"? 
      // "Kimden kısmı kullanıcının kendi ismi olacak... Kime kısmına diğer kullanıcılar..." -> This implies TRANSFER.

      // Resolution: Only items selected from StockPage (Multi-Add) have IDs.
      // Manual added items here don't have IDs. 
      // If manual add is used, we probably need to Find the stock item by Serial/Name?
      // Or maybe this manual add is actually creating new stock and then transferring? No, "Kimden: CurrentUser" implies removing from current user.

      // Let's assume manual add here tries to find a matching stock item in user's inventory? 
      // Or we just warn the user "Only items selected from Stock List can be transferred"?
      // But user explicitly asked for "Ekle butonu".
      // Maybe I should search for the item in user's stock when they try to add manually?
      // For now, I will filter items that have IDs for transfer.
      // If item has no ID, I cannot transfer it via `initiateTransfer`.

      const transferItems = items
        .filter(item => item.id) // Only items with ID
        .map(item => ({
          stockItemId: item.id!,
          quantity: item.quantity || 1
        }));

      if (transferItems.length === 0) {
        toast.error('Transfer edilecek geçerli stok malzemesi yok (Manuel eklenenler stokta bulunmalı)');
        setLoading(false);
        return;
      }

      const user = storage.getUser();
      await stockService.initiateTransfer(receiver.id, transferItems, user?.id);
      toast.success('Transfer işlemi başlatıldı ve bildirim gönderildi');
      onNavigate('stock');
    } catch (error) {
      console.error(error);
      toast.error('Transfer başlatılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleMultiAddClick = () => {
    // Navigate to stock page in selection mode
    onNavigate('stock-selection');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('stock')}
            className="text-white hover:bg-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white">Stok Transferi</h1>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Transfer Info Card */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-slate-500 mb-1 block">Kimden</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200 text-slate-700 font-medium">
                <UserIcon className="w-5 h-5 text-gray-500" />
                {currentUser}
              </div>
            </div>

            <div>
              <Label className="text-slate-500 mb-1 block">Kime</Label>
              <select
                className="w-full p-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Kullanıcı Seçin</option>
                {users.map(user => (
                  <option key={user.id} value={user.username}>
                    {user.fullName || user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Materials List */}
        <Card className="p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Transfer Edilecek Malzemeler</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddModal(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Manuel Ekle
              </Button>
              <Button onClick={handleMultiAddClick} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                <Box className="w-4 h-4 mr-2" />
                Çoklu Ekle
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-slate-600 sticky top-0">
                <tr>
                  <th className="p-3 border-b">Malzeme Adı</th>
                  <th className="p-3 border-b">Seri/Lot</th>
                  <th className="p-3 border-b">SKT</th>
                  <th className="p-3 border-b">Adet</th>
                  <th className="p-3 border-b w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Henüz malzeme eklenmedi
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3">{item.materialName}</td>
                      <td className="p-3">{item.serialLotNumber}</td>
                      <td className="p-3">{item.expiryDate || '-'}</td>
                      <td className="p-3 font-medium">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-20 h-8"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              className="px-8"
              onClick={handleSubmit}
              disabled={loading || items.length === 0 || !selectedUser}
            >
              {loading ? 'İşleniyor...' : 'İşlemi Tamamla'}
            </Button>
          </div>
        </Card>
      </div>

      {showAddModal && (
        <StockAddModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}
