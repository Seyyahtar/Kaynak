import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Page, StockItem } from '../types';
import { storage } from '../utils/storage';
import { toast } from 'sonner@2.0.3';

interface StockManagementProps {
  onNavigate: (page: Page) => void;
  currentUser: string;
  prefillData?: StockItem | null;
}

export default function StockManagement({ onNavigate, currentUser, prefillData }: StockManagementProps) {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    materialName: '',
    serialLotNumber: '',
    ubbCode: '',
    expiryDate: '',
    quantity: '',
  });

  useEffect(() => {
    if (prefillData) {
      setFormData({
        from: currentUser, // Kullanıcı stoktan çıkarıyor
        to: '',
        date: new Date().toISOString().split('T')[0],
        materialName: prefillData.materialName,
        serialLotNumber: prefillData.serialLotNumber,
        ubbCode: prefillData.ubbCode,
        expiryDate: prefillData.expiryDate,
        quantity: prefillData.quantity.toString(),
      });
    }
  }, [prefillData, currentUser]);

  // Kimden alanı currentUser ise stoktan çıkar
  // Kime alanı currentUser ise stok ekle
  const isRemoving = formData.from === currentUser;
  const isAdding = formData.to === currentUser;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.materialName || !formData.serialLotNumber || !formData.quantity) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Geçerli bir miktar girin');
      return;
    }

    if (isAdding) {
      // Stok ekle - önce duplicate kontrolü
      if (storage.checkDuplicate(formData.materialName, formData.serialLotNumber)) {
        toast.error('Bu malzeme ve seri/lot numarası zaten stokta kayıtlı!');
        return;
      }
      
      const newItem: StockItem = {
        id: Date.now().toString(),
        materialName: formData.materialName,
        serialLotNumber: formData.serialLotNumber,
        ubbCode: formData.ubbCode,
        expiryDate: formData.expiryDate,
        quantity: quantity,
        dateAdded: formData.date,
        from: formData.from,
        to: formData.to,
      };

      storage.addStock(newItem);
      storage.addHistory({
        id: Date.now().toString(),
        date: formData.date,
        type: 'stock-add',
        description: `${formData.materialName} eklendi (${quantity} adet) - ${currentUser}`,
        details: newItem,
      });

      toast.success('Stok başarıyla eklendi');
    } else if (isRemoving) {
      // Stok çıkar
      storage.removeStock([{
        materialName: formData.materialName,
        serialLotNumber: formData.serialLotNumber,
        quantity: quantity,
      }]);
      
      storage.addHistory({
        id: Date.now().toString(),
        date: formData.date,
        type: 'stock-remove',
        description: `${formData.materialName} çıkarıldı (${quantity} adet) - ${currentUser}`,
        details: { ...formData, quantity },
      });

      toast.success('Stok başarıyla çıkarıldı');
    } else {
      toast.error('Lütfen kimden veya kime alanına kendi adınızı yazın');
      return;
    }

    // Form temizle
    setFormData({
      from: '',
      to: '',
      date: new Date().toISOString().split('T')[0],
      materialName: '',
      serialLotNumber: '',
      ubbCode: '',
      expiryDate: '',
      quantity: '',
    });
    
    onNavigate('stock');
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
          <h1 className="text-white">Stok Yönetimi</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <Card className="p-6">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-slate-700">
              <strong>Not:</strong> "Kimden" alanına kendi adınızı ({currentUser}) yazarsanız stok çıkar. 
              "Kime" alanına kendi adınızı yazarsanız stok ekler.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="from">Kimden</Label>
              <Input
                id="from"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                placeholder="Tedarikçi/Kaynak"
              />
            </div>

            <div>
              <Label htmlFor="to">Kime</Label>
              <Input
                id="to"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="Hedef"
              />
            </div>

            <div>
              <Label htmlFor="date">Tarih *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="materialName">Malzeme Adı *</Label>
              <Input
                id="materialName"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                placeholder="Örn: Amvia Sky"
                required
              />
            </div>

            <div>
              <Label htmlFor="serialLotNumber">Seri/Lot Numarası *</Label>
              <Input
                id="serialLotNumber"
                value={formData.serialLotNumber}
                onChange={(e) => setFormData({ ...formData, serialLotNumber: e.target.value })}
                placeholder="Seri/Lot No"
                required
              />
            </div>

            <div>
              <Label htmlFor="ubbCode">UBB Kodu</Label>
              <Input
                id="ubbCode"
                value={formData.ubbCode}
                onChange={(e) => setFormData({ ...formData, ubbCode: e.target.value })}
                placeholder="UBB Kodu"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">SKT (Son Kullanma Tarihi)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Miktar *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Adet"
                required
                min="1"
              />
            </div>

            <Button type="submit" className="w-full">
              {isAdding ? 'Stok Ekle' : isRemoving ? 'Stok Çıkar' : 'İşlemi Tamamla'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
