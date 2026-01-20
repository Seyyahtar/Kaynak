import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Page, CaseRecord, StockItem } from '../types';
import { storage } from '../utils/storage';
import { HOSPITALS, isValidHospital } from '../utils/hospitals';
import { toast } from 'sonner@2.0.3';

interface CaseEntryProps {
  onNavigate: (page: Page) => void;
}

interface MaterialInput {
  id: string;
  materialName: string;
  serialLotNumber: string;
  ubbCode: string;
  quantity: string;
}

export default function CaseEntry({ onNavigate }: CaseEntryProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hospitalName: '',
    doctorName: '',
    patientName: '',
    notes: '',
  });

  const [materials, setMaterials] = useState<MaterialInput[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    const loadStock = async () => {
      const data = await storage.getStock();
      setStockItems(data);
    };
    loadStock();
  }, []);

  const addMaterialInput = () => {
    setMaterials([
      ...materials,
      {
        id: Date.now().toString(),
        materialName: '',
        serialLotNumber: '',
        ubbCode: '',
        quantity: '',
      },
    ]);
  };

  const removeMaterialInput = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof MaterialInput, value: string) => {
    const updatedMaterials = materials.map((m) => {
      if (m.id !== id) return m;

      const updated = { ...m, [field]: value };

      if (field === 'serialLotNumber' && value.trim() !== '') {
        const matchingItems = stockItems.filter(item =>
          item.serialLotNumber.toLowerCase().includes(value.toLowerCase())
        );

        if (matchingItems.length === 1) {
          const matchedItem = matchingItems[0];
          updated.materialName = matchedItem.materialName;
          updated.serialLotNumber = matchedItem.serialLotNumber;
          updated.ubbCode = matchedItem.ubbCode || '';
          toast.success('Malzeme bilgileri otomatik dolduruldu');
        }
      }

      return updated;
    });

    setMaterials(updatedMaterials);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hospitalName || !formData.doctorName || !formData.patientName) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!isValidHospital(formData.hospitalName)) {
      toast.error('Hastane listeden seçilmelidir');
      return;
    }

    if (materials.length === 0) {
      toast.error('En az bir malzeme ekleyin');
      return;
    }

    const validMaterials = materials.filter(
      (m) => m.materialName && m.serialLotNumber && m.quantity
    );

    if (validMaterials.length === 0) {
      toast.error('Lütfen malzeme bilgilerini eksiksiz doldurun');
      return;
    }

    const notInStock: string[] = [];
    const insufficientStock: string[] = [];

    validMaterials.forEach((m) => {
      const stockItem = stockItems.find(
        item => item.materialName.toLowerCase() === m.materialName.toLowerCase() &&
          item.serialLotNumber.toLowerCase() === m.serialLotNumber.toLowerCase()
      );

      if (!stockItem) {
        notInStock.push(`${m.materialName} (${m.serialLotNumber})`);
      } else if (stockItem.quantity < parseInt(m.quantity)) {
        insufficientStock.push(`${m.materialName} (Stok: ${stockItem.quantity}, İstenen: ${m.quantity})`);
      }
    });

    if (notInStock.length > 0) {
      toast.error(`Bu malzemeler stokta bulunamadı: ${notInStock.join(', ')}`);
      return;
    }

    if (insufficientStock.length > 0) {
      toast.error(`Yetersiz stok: ${insufficientStock.join(', ')}`);
      return;
    }

    const materialsToRemove = validMaterials.map((m) => ({
      materialName: m.materialName,
      serialLotNumber: m.serialLotNumber,
      quantity: parseInt(m.quantity),
    }));

    await storage.removeStock(materialsToRemove);

    const caseRecord: CaseRecord = {
      id: Date.now().toString(),
      date: formData.date,
      hospitalName: formData.hospitalName,
      doctorName: formData.doctorName,
      patientName: formData.patientName,
      notes: formData.notes || undefined,
      materials: validMaterials.map((m) => ({
        materialName: m.materialName,
        serialLotNumber: m.serialLotNumber,
        ubbCode: m.ubbCode,
        quantity: parseInt(m.quantity),
      })),
    };

    await storage.saveCase(caseRecord);

    await storage.addHistory({
      id: Date.now().toString(),
      date: formData.date,
      type: 'case',
      description: `Vaka kaydı - ${formData.hospitalName} - Dr. ${formData.doctorName}`,
      details: caseRecord,
    });

    toast.success('Vaka kaydı başarıyla oluşturuldu');

    setFormData({
      date: new Date().toISOString().split('T')[0],
      hospitalName: '',
      doctorName: '',
      patientName: '',
      notes: '',
    });
    setMaterials([]);

    onNavigate('history');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white p-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('home')}
            className="text-white hover:bg-green-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white">Vaka</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="hospitalName">Hastane Adı *</Label>
              <Input
                id="hospitalName"
                value={formData.hospitalName}
                onChange={(e) =>
                  setFormData({ ...formData, hospitalName: e.target.value })
                }
                placeholder="Hastane adı"
                list="hospital-list"
                required
              />
              <datalist id="hospital-list">
                {HOSPITALS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <Label htmlFor="doctorName">Doktor Adı *</Label>
              <Input
                id="doctorName"
                value={formData.doctorName}
                onChange={(e) =>
                  setFormData({ ...formData, doctorName: e.target.value })
                }
                placeholder="Doktor adı"
                required
              />
            </div>

            <div>
              <Label htmlFor="patientName">Hasta Adı *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) =>
                  setFormData({ ...formData, patientName: e.target.value })
                }
                placeholder="Hasta adı"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Not</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Not (opsiyonel)"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="border-t pt-4 mt-6">
              <div className="flex items-center justify-between mb-3">
                <Label>Kullanılan Malzemeler</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={addMaterialInput}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ekle
                </Button>
              </div>

              {materials.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  Malzeme eklemek için + butonuna tıklayın
                </p>
              ) : (
                <div className="space-y-4">
                  {materials.map((material, index) => (
                    <Card key={material.id} className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-600">Malzeme {index + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMaterialInput(material.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Input
                          placeholder="Malzeme Adı *"
                          value={material.materialName}
                          onChange={(e) =>
                            updateMaterial(material.id, 'materialName', e.target.value)
                          }
                        />
                        <Input
                          placeholder="Seri/Lot Numarası *"
                          value={material.serialLotNumber}
                          onChange={(e) =>
                            updateMaterial(material.id, 'serialLotNumber', e.target.value)
                          }
                        />
                        <Input
                          placeholder="UBB Kodu"
                          value={material.ubbCode}
                          onChange={(e) =>
                            updateMaterial(material.id, 'ubbCode', e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Miktar *"
                          value={material.quantity}
                          onChange={(e) =>
                            updateMaterial(material.id, 'quantity', e.target.value)
                          }
                          min="1"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full">
              Vakayı Kaydet
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
