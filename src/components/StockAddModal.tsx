import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { StockItem } from '../types';
import { toast } from 'sonner';

interface StockAddModalProps {
    onClose: () => void;
    onAdd: (item: Partial<StockItem>) => void;
}

export default function StockAddModal({ onClose, onAdd }: StockAddModalProps) {
    const [item, setItem] = useState<Partial<StockItem>>({
        materialName: '',
        serialLotNumber: '',
        ubbCode: '',
        expiryDate: '',
        quantity: 1,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item.materialName || !item.serialLotNumber || !item.quantity) {
            toast.error('Lütfen zorunlu alanları doldurun');
            return;
        }
        onAdd(item);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4 text-slate-800">Malzeme Ekle</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="materialName">Malzeme Adı *</Label>
                        <Input
                            id="materialName"
                            value={item.materialName}
                            onChange={(e) => setItem({ ...item, materialName: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="serialLotNumber">Seri/Lot No *</Label>
                        <Input
                            id="serialLotNumber"
                            value={item.serialLotNumber}
                            onChange={async (e) => {
                                const newSerial = e.target.value;
                                setItem(prev => ({ ...prev, serialLotNumber: newSerial }));

                                // Auto-fill logic
                                if (newSerial.length > 3) {
                                    try {
                                        const stock = await import('../utils/storage').then(m => m.storage.getStock());
                                        const matches = stock.filter(s => s.serialLotNumber.toLowerCase() === newSerial.toLowerCase());

                                        // If exactly one match found (or distinct material with same serial)
                                        if (matches.length > 0) {
                                            // Get the most recent one or just the first one
                                            const match = matches[0];
                                            setItem(prev => ({
                                                ...prev,
                                                id: match.id, // Set ID for transfer logic
                                                serialLotNumber: newSerial,
                                                materialName: match.materialName,
                                                ubbCode: match.ubbCode,
                                                expiryDate: match.expiryDate
                                            }));
                                        }
                                    } catch (err) {
                                        console.error('Auto-fill error', err);
                                    }
                                }
                            }}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="ubbCode">UBB Kodu</Label>
                        <Input
                            id="ubbCode"
                            value={item.ubbCode}
                            onChange={(e) => setItem({ ...item, ubbCode: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="expiryDate">SKT</Label>
                        <Input
                            id="expiryDate"
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => setItem({ ...item, expiryDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="quantity">Adet *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => setItem({ ...item, quantity: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            İptal
                        </Button>
                        <Button type="submit" className="flex-1">
                            Ekle
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
