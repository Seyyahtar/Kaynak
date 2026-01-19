import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, FileText, Filter, Undo, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Page, HistoryRecord, CaseRecord } from '../types';
import { storage } from '../utils/storage';
import { toast } from 'sonner@2.0.3';
import html2pdf from 'html2pdf.js';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import shareIcon from '../../assets/icons/share-2.svg';
import downloadIcon from '../../assets/icons/download.svg';
import { exportHistoryToExcel, shareHistoryToExcel } from '../utils/excelUtils';

interface HistoryPageProps {
  onNavigate: (page: Page) => void;
}

export default function HistoryPage({ onNavigate }: HistoryPageProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const data = storage.getHistory();
    setHistory(data);
  };

  const handleDownloadHistory = async () => {
    try {
      await exportHistoryToExcel(filteredHistory);
      toast.success('Geçmiş kayıtları indirildi');
    } catch (error) {
      toast.error('İndirme hatası: ' + (error as Error).message);
    }
  };

  const handleShareHistory = async () => {
    try {
      await shareHistoryToExcel(filteredHistory);
      toast.success('Geçmiş kayıtları paylaşıldı');
    } catch (error) {
      toast.error('Paylaşım hatası: ' + (error as Error).message);
    }
  };

  const shareCasePdf = async (record: HistoryRecord) => {
    if (record.type !== 'case' || !record.details) return;
    const details = record.details as CaseRecord;

    const htmlContent = `
      <div class="page">
        <div class="card">
          <div class="header">
          </div>
          <div class="grid">
            <div class="field">
              <div class="label">Hasta</div>
              <div class="value">${details.patientName}</div>
            </div>
            <div class="field">
              <div class="label">Hastane</div>
              <div class="value">${details.hospitalName}</div>
            </div>
            <div class="field">
              <div class="label">Doktor</div>
              <div class="value">${details.doctorName}</div>
            </div>
            <div class="field">
              <div class="label">Tarih</div>
              <div class="value">${new Date(details.date).toLocaleDateString('tr-TR')}</div>
            </div>
          </div>

          ${details.notes ? `<div class="section"><div class="section-title">Notlar</div><div class="note">${details.notes}</div></div>` : ''}

          <div class="section">
            <div class="section-title">
              Kullanılan Malzemeler
              <span class="pill">${(details.materials || []).length} adet</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Malzeme</th>
                  <th>Seri / Lot</th>
                  <th>UBB</th>
                  <th>Adet</th>
                </tr>
              </thead>
              <tbody>
                ${(details.materials || []).map((m, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${m.materialName}</td>
                    <td>${m.serialLotNumber}</td>
                    <td>${m.ubbCode || '-'}</td>
                    <td>${m.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const styles = `
      @media print { body { -webkit-print-color-adjust: exact; } }
      :root {
        --bg: #000000ff;
        --muted: #2a84faff;
        --text: #000000ff;
        --accent: #000000ff;
        --accent-soft: rgba(72, 72, 72, 1);
      }
      * { box-sizing: border-box; }
      body { font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif; background: var(--bg); padding: 32px; color: var(--text); }
      .page { max-width: 960px; margin: 0 auto; }
      .card { background: linear-gradient(145deg, rgba(255, 255, 255, 0), rgba(255,255,255,0)); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
      .header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
      .chip { padding: 8px 14px; border-radius: 999px; background: var(--accent-soft); color: #ede9fe; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; font-size: 12px; }
      .title { font-size: 26px; font-weight: 800; margin: 6px 0 0 0; }
      .meta { color: var(--muted); font-size: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin: 14px 0 10px; }
      .field { padding: 14px; border: 1px solid rgba(93, 91, 91, 0.55); border-radius: 14px; background: rgba(255,255,255,0.02); }
      .label { font-size: 12px; letter-spacing: 0.06em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
      .value { font-size: 16px; font-weight: 700; color: var(--text); }
      .section { margin-top: 18px; }
      .section-title { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
      .pill { padding: 4px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0); color: var(--muted); font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid rgba(255,255,255,0.06); }
      th, td { text-align: left; padding: 12px 10px; }
      th { background: rgba(255,255,255,0.05); font-size: 12px; letter-spacing: 0.05em; color: var(--muted); text-transform: uppercase; }
      tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
      tr:hover td { background: rgba(255, 255, 255, 0); }
      .note { margin-top: 6px; padding: 14px; border-radius: 14px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); color: #ede9fe; }
    `;

    const element = document.createElement('div');
    element.innerHTML = `<style>${styles}</style>${htmlContent}`;

    try {
      const pdfBlob = await html2pdf().set({ margin: 1, filename: `vaka-karti-${details.patientName}.pdf` }).from(element).outputPdf('blob');
      
      if (Capacitor.getPlatform() === 'web') {
        // Web için navigator.share varsa kullan, yoksa download
        if (navigator.share) {
          const file = new File([pdfBlob], `vaka-karti-${details.patientName}.pdf`, { type: 'application/pdf' });
          await navigator.share({ files: [file] });
        } else {
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vaka-karti-${details.patientName}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Mobil için Filesystem ile geçici dosya oluştur ve paylaş
        const base64 = await blobToBase64(pdfBlob);
        const filename = `vaka-karti-${details.patientName}.pdf`;
        const tempFile = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache,
        });
        const fileUri = tempFile.uri;
        await Share.share({
          title: 'Vaka Kartı',
          files: [fileUri],
        });
      }
    } catch (error) {
      toast.error('PDF paylaşılırken hata oluştu: ' + (error as Error).message);
    }
  };

  const downloadCasePdf = async (record: HistoryRecord) => {
    if (record.type !== 'case' || !record.details) return;
    const details = record.details as CaseRecord;

    const htmlContent = `
      <div class="page">
        <div class="card">
          <div class="header">
          </div>
          <div class="grid">
            <div class="field">
              <div class="label">Hasta</div>
              <div class="value">${details.patientName}</div>
            </div>
            <div class="field">
              <div class="label">Hastane</div>
              <div class="value">${details.hospitalName}</div>
            </div>
            <div class="field">
              <div class="label">Doktor</div>
              <div class="value">${details.doctorName}</div>
            </div>
            <div class="field">
              <div class="label">Tarih</div>
              <div class="value">${new Date(details.date).toLocaleDateString('tr-TR')}</div>
            </div>
          </div>

          ${details.notes ? `<div class="section"><div class="section-title">Notlar</div><div class="note">${details.notes}</div></div>` : ''}

          <div class="section">
            <div class="section-title">
              Kullanılan Malzemeler
              <span class="pill">${(details.materials || []).length} adet</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Malzeme</th>
                  <th>Seri / Lot</th>
                  <th>UBB</th>
                  <th>Adet</th>
                </tr>
              </thead>
              <tbody>
                ${(details.materials || []).map((m, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${m.materialName}</td>
                    <td>${m.serialLotNumber}</td>
                    <td>${m.ubbCode || '-'}</td>
                    <td>${m.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const styles = `
      @media print { body { -webkit-print-color-adjust: exact; } }
      :root {
        --bg: #000000ff;
        --muted: #2a84faff;
        --text: #000000ff;
        --accent: #000000ff;
        --accent-soft: rgba(72, 72, 72, 1);
      }
      * { box-sizing: border-box; }
      body { font-family: 'Inter','Segoe UI',system-ui,-apple-system,sans-serif; background: var(--bg); padding: 32px; color: var(--text); }
      .page { max-width: 960px; margin: 0 auto; }
      .card { background: linear-gradient(145deg, rgba(255, 255, 255, 0), rgba(255,255,255,0)); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }
      .header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
      .chip { padding: 8px 14px; border-radius: 999px; background: var(--accent-soft); color: #ede9fe; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; font-size: 12px; }
      .title { font-size: 26px; font-weight: 800; margin: 6px 0 0 0; }
      .meta { color: var(--muted); font-size: 14px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin: 14px 0 10px; }
      .field { padding: 14px; border: 1px solid rgba(93, 91, 91, 0.55); border-radius: 14px; background: rgba(255,255,255,0.02); }
      .label { font-size: 12px; letter-spacing: 0.06em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
      .value { font-size: 16px; font-weight: 700; color: var(--text); }
      .section { margin-top: 18px; }
      .section-title { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
      .pill { padding: 4px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0); color: var(--muted); font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid rgba(255,255,255,0.06); }
      th, td { text-align: left; padding: 12px 10px; }
      th { background: rgba(255,255,255,0.05); font-size: 12px; letter-spacing: 0.05em; color: var(--muted); text-transform: uppercase; }
      tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
      tr:hover td { background: rgba(255, 255, 255, 0); }
      .note { margin-top: 6px; padding: 14px; border-radius: 14px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); color: #ede9fe; }
    `;

    const element = document.createElement('div');
    element.innerHTML = `<style>${styles}</style>${htmlContent}`;

    try {
      if (Capacitor.getPlatform() === 'web') {
        await html2pdf().set({ margin: 1, filename: `vaka-karti-${details.patientName}.pdf` }).from(element).save();
      } else {
        const pdfBlob = await html2pdf().set({ margin: 1 }).from(element).outputPdf('blob');
        const base64 = await blobToBase64(pdfBlob);
        const filename = `vaka-karti-${details.patientName}.pdf`;
        await Filesystem.writeFile({
          path: `Download/${filename}`,
          data: base64,
          directory: Directory.ExternalStorage,
        });
        toast.success(`PDF başarıyla Download klasörüne kaydedildi: ${filename}`);
      }
    } catch (error) {
      toast.error('PDF indirilirken hata oluştu: ' + (error as Error).message);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const filteredHistory = React.useMemo(() => {
    return history.filter((record) => {
      if (filters.type !== 'all' && record.type !== filters.type) {
        return false;
      }

      if (filters.startDate && record.date < filters.startDate) {
        return false;
      }
      if (filters.endDate && record.date > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [history, filters]);

  const getTypeLabel = (type: HistoryRecord['type']) => {
    switch (type) {
      case 'stock-add':
        return 'Stok Ekleme';
      case 'stock-remove':
        return 'Stok Çıkarma';
      case 'stock-delete':
        return 'Stok Silme';
      case 'case':
        return 'Vaka';
      case 'checklist':
        return 'Kontrol Listesi';
      default:
        return type;
    }
  };

  const getTypeColor = (type: HistoryRecord['type']) => {
    switch (type) {
      case 'stock-add':
        return 'bg-green-100 text-green-800';
      case 'stock-remove':
        return 'bg-red-100 text-red-800';
      case 'stock-delete':
        return 'bg-orange-100 text-orange-800';
      case 'case':
        return 'bg-blue-100 text-blue-800';
      case 'checklist':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUndo = (record: HistoryRecord) => {
    if (!window.confirm('Bu işlemi geri almak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      if (record.type === 'stock-add') {
        const item = record.details;
        if (item && item.id) {
          storage.deleteStockItem(item.id);
          toast.success('Stok ekleme işlemi geri alındı');
        }
      } else if (record.type === 'stock-remove') {
        const item = record.details;
        if (item) {
          storage.addStock({
            id: Date.now().toString(),
            materialName: item.materialName,
            serialLotNumber: item.serialLotNumber,
            ubbCode: item.ubbCode || '',
            expiryDate: item.expiryDate || '',
            quantity: item.quantity,
            dateAdded: new Date().toISOString().split('T')[0],
            from: '',
            to: '',
          });
          toast.success('Stok çıkarma işlemi geri alındı');
        }
      } else if (record.type === 'stock-delete') {
        const item = record.details;
        if (item) {
          storage.addStock({
            id: Date.now().toString(),
            materialName: item.materialName,
            serialLotNumber: item.serialLotNumber,
            ubbCode: item.ubbCode || '',
            expiryDate: item.expiryDate || '',
            quantity: item.quantity,
            dateAdded: new Date().toISOString().split('T')[0],
            from: '',
            to: '',
          });
          toast.success('Stok silme işlemi geri alındı');
        }
      } else if (record.type === 'case') {
        const caseDetails = record.details;
        if (caseDetails && caseDetails.materials) {
          caseDetails.materials.forEach((material: any) => {
            storage.addStock({
              id: Date.now().toString() + Math.random(),
              materialName: material.materialName,
              serialLotNumber: material.serialLotNumber,
              ubbCode: material.ubbCode || '',
              expiryDate: '',
              quantity: material.quantity,
              dateAdded: new Date().toISOString().split('T')[0],
              from: '',
              to: '',
            });
          });
          toast.success('Vaka işlemi geri alındı, malzemeler stoğa eklendi');
        }
      }

      storage.removeHistory(record.id);
      loadHistory();
    } catch (error) {
      toast.error('İşlem geri alınırken hata oluştu');
      console.error(error);
    }
  };

  const handleShowDetails = (record: HistoryRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const renderDetails = (record: HistoryRecord) => {
    const details = record.details;

    if (record.type === 'stock-add') {
      if (details && details.materialName) {
        return (
          <div>
            <Label>Eklenen Ürün</Label>
            <Card className="p-3 bg-gray-50 mt-2">
              <div className="space-y-1 text-sm">
                <div><span className="text-slate-600">Malzeme:</span> <span className="text-slate-800">{details.materialName}</span></div>
                <div><span className="text-slate-600">Seri/Lot:</span> <span className="text-slate-800">{details.serialLotNumber}</span></div>
                {details.ubbCode && <div><span className="text-slate-600">UBB:</span> <span className="text-slate-800">{details.ubbCode}</span></div>}
                {details.expiryDate && <div><span className="text-slate-600">SKT:</span> <span className="text-slate-800">{new Date(details.expiryDate).toLocaleDateString('tr-TR')}</span></div>}
                <div><span className="text-slate-600">Miktar:</span> <span className="text-slate-800">{details.quantity}</span></div>
                {details.from && <div><span className="text-slate-600">Kimden:</span> <span className="text-slate-800">{details.from}</span></div>}
                {details.to && <div><span className="text-slate-600">Kime:</span> <span className="text-slate-800">{details.to}</span></div>}
              </div>
            </Card>
          </div>
        );
      }

      if (Array.isArray(details)) {
        return (
          <div>
            <Label>Eklenen Ürünler ({details.length} adet)</Label>
            <div className="space-y-2 mt-2 max-h-[400px] overflow-y-auto">
              {details.map((item: any, index: number) => (
                <Card key={index} className="p-3 bg-gray-50">
                  <div className="space-y-1 text-sm">
                    <div className="text-slate-500">#{index + 1}</div>
                    <div><span className="text-slate-600">Malzeme:</span> <span className="text-slate-800">{item.materialName}</span></div>
                    <div><span className="text-slate-600">Seri/Lot:</span> <span className="text-slate-800">{item.serialLotNumber}</span></div>
                    {item.ubbCode && <div><span className="text-slate-600">UBB:</span> <span className="text-slate-800">{item.ubbCode}</span></div>}
                    {item.expiryDate && <div><span className="text-slate-600">SKT:</span> <span className="text-slate-800">{new Date(item.expiryDate).toLocaleDateString('tr-TR')}</span></div>}
                    <div><span className="text-slate-600">Miktar:</span> <span className="text-slate-800">{item.quantity}</span></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      }
    }

    if (record.type === 'stock-remove') {
      return (
        <div>
          <Label>Çıkarılan Ürün</Label>
          <Card className="p-3 bg-gray-50 mt-2">
            <div className="space-y-1 text-sm">
              <div><span className="text-slate-600">Malzeme:</span> <span className="text-slate-800">{details.materialName}</span></div>
              <div><span className="text-slate-600">Seri/Lot:</span> <span className="text-slate-800">{details.serialLotNumber}</span></div>
              {details.ubbCode && <div><span className="text-slate-600">UBB:</span> <span className="text-slate-800">{details.ubbCode}</span></div>}
              {details.expiryDate && <div><span className="text-slate-600">SKT:</span> <span className="text-slate-800">{new Date(details.expiryDate).toLocaleDateString('tr-TR')}</span></div>}
              <div><span className="text-slate-600">Miktar:</span> <span className="text-slate-800">{details.quantity}</span></div>
              {details.from && <div><span className="text-slate-600">Kimden:</span> <span className="text-slate-800">{details.from}</span></div>}
              {details.to && <div><span className="text-slate-600">Kime:</span> <span className="text-slate-800">{details.to}</span></div>}
            </div>
          </Card>
        </div>
      );
    }

    if (record.type === 'stock-delete') {
      return (
        <div>
          <Label>Silinen Ürün</Label>
          <Card className="p-3 bg-gray-50 mt-2">
            <div className="space-y-1 text-sm">
              <div><span className="text-slate-600">Malzeme:</span> <span className="text-slate-800">{details.materialName}</span></div>
              <div><span className="text-slate-600">Seri/Lot:</span> <span className="text-slate-800">{details.serialLotNumber}</span></div>
              {details.ubbCode && <div><span className="text-slate-600">UBB:</span> <span className="text-slate-800">{details.ubbCode}</span></div>}
              {details.expiryDate && <div><span className="text-slate-600">SKT:</span> <span className="text-slate-800">{new Date(details.expiryDate).toLocaleDateString('tr-TR')}</span></div>}
              <div><span className="text-slate-600">Miktar:</span> <span className="text-slate-800">{details.quantity}</span></div>
            </div>
          </Card>
        </div>
      );
    }

    if (record.type === 'case') {
      return (
        <div>
          <div className="space-y-3">
            <div>
              <Label>Vaka Bilgileri</Label>
              <Card className="p-3 bg-gray-50 mt-2">
                <div className="space-y-1 text-sm">
                  <div><span className="text-slate-600">Hasta:</span> <span className="text-slate-800">{details.patientName}</span></div>
                  <div><span className="text-slate-600">Doktor:</span> <span className="text-slate-800">{details.doctorName}</span></div>
                  <div><span className="text-slate-600">Hastane:</span> <span className="text-slate-800">{details.hospitalName}</span></div>
                  {details.notes && <div><span className="text-slate-600">Notlar:</span> <span className="text-slate-800">{details.notes}</span></div>}
                </div>
              </Card>
            </div>
            
            <div>
              <Label>Kullanılan Malzemeler ({details.materials?.length || 0} adet)</Label>
              <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
                {details.materials?.map((material: any, index: number) => (
                  <Card key={index} className="p-3 bg-gray-50">
                    <div className="space-y-1 text-sm">
                      <div className="text-slate-500">#{index + 1}</div>
                      <div><span className="text-slate-600">Malzeme:</span> <span className="text-slate-800">{material.materialName}</span></div>
                      <div><span className="text-slate-600">Seri/Lot:</span> <span className="text-slate-800">{material.serialLotNumber}</span></div>
                      {material.ubbCode && <div><span className="text-slate-600">UBB:</span> <span className="text-slate-800">{material.ubbCode}</span></div>}
                      <div><span className="text-slate-600">Miktar:</span> <span className="text-slate-800">{material.quantity}</span></div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (record.type === 'checklist') {
      const checkedCount = details.patients?.filter((p: any) => p.checked).length || 0;
      const totalCount = details.patients?.length || 0;
      
      const formatHospitalName = (name: string) => {
        return name.replace(/eğitim\s+ve\s+araştırma\s+hastanesi/gi, 'EAH');
      };
      
      return (
        <div>
          <div className="space-y-3">
            <div>
              <Label>Kontrol Listesi Bilgileri</Label>
              <Card className="p-3 bg-gray-50 mt-2">
                <div className="space-y-1 text-sm">
                  <div><span className="text-slate-600">Başlık:</span> <span className="text-slate-800">{details.title}</span></div>
                  <div><span className="text-slate-600">Başlangıç:</span> <span className="text-slate-800">{new Date(details.createdDate).toLocaleDateString('tr-TR')}</span></div>
                  {details.completedDate && <div><span className="text-slate-600">Tamamlanma:</span> <span className="text-slate-800">{new Date(details.completedDate).toLocaleDateString('tr-TR')}</span></div>}
                  <div><span className="text-slate-600">Durum:</span> <span className="text-slate-800">{checkedCount} / {totalCount} kontrol edildi</span></div>
                </div>
              </Card>
            </div>
            
            <div>
              <Label>Hastalar</Label>
              <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
                {details.patients?.map((patient: any, index: number) => (
                  <Card key={patient.id} className={`p-3 ${patient.checked ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">#{index + 1}</span>
                        <span className={patient.checked ? 'text-green-800 line-through' : 'text-slate-800'}>{patient.name}</span>
                        {patient.checked && <span className="text-green-600">✓</span>}
                      </div>
                      {patient.hospital && <div><span className="text-slate-600">Hastane:</span> <span className="text-slate-800">{formatHospitalName(patient.hospital)}</span></div>}
                      {patient.phone && <div><span className="text-slate-600">Tel:</span> <span className="text-slate-800">{patient.phone}</span></div>}
                      {patient.time && <div><span className="text-slate-600">Saat:</span> <span className="text-slate-800">{patient.time}</span></div>}
                      {patient.note && <div><span className="text-slate-600">Not:</span> <span className="text-slate-800">{patient.note}</span></div>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Label>Detaylar</Label>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-slate-700 text-sm mt-2">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white p-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('home')}
            className="text-white hover:bg-purple-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white flex-1">Geçmiş</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white hover:bg-purple-700"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilterOpen(!filterOpen)}
            className="text-white hover:bg-purple-700"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {filterOpen && (
        <Card className="m-4 p-4 space-y-3">
          <div>
            <Label>İşlem Tipi</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="stock-add">Stok Ekleme</SelectItem>
                <SelectItem value="stock-remove">Stok Çıkarma</SelectItem>
                <SelectItem value="stock-delete">Stok Silme</SelectItem>
                <SelectItem value="case">Vaka</SelectItem>
                <SelectItem value="checklist">Kontrol Listesi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Başlangıç Tarihi</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label>Bitiş Tarihi</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              setFilters({ type: 'all', startDate: '', endDate: '' })
            }
          >
            Filtreleri Temizle
          </Button>
        </Card>
      )}

      {menuOpen && (
        <Card className="m-4 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Başlangıç tarihi</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Bitiş tarihi</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleDownloadHistory}
            >
              <img src="/download.svg" alt="İndir" className="w-4 h-4 mr-2" />
              Geçmiş Verilerini İndir
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleShareHistory}
            >
              <img src="/share-2.svg" alt="Paylaş" className="w-4 h-4 mr-2" />
              Geçmiş Verilerini Paylaş
            </Button>
          </div>
        </Card>
      )}

      <div className="p-4">
        {filteredHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500">Geçmiş kayıt bulunamadı</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((record) => (
              <Card key={record.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full ${getTypeColor(
                          record.type
                        )}`}
                      >
                        {getTypeLabel(record.type)}
                      </span>
                      <span className="text-slate-500">
                        {new Date(record.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-slate-700">{record.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowDetails(record)}
                      title="Detayları Gör"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {record.type === 'case' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shareCasePdf(record)}
                          title="Vaka kartını paylaş"
                        >
                          <img src="/share-2.svg" alt="Paylaş" className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCasePdf(record)}
                          title="Vaka kartını indir"
                        >
                          <img src="/download.svg" alt="İndir" className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {record.type !== 'checklist' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUndo(record)}
                        title="Geri Al"
                      >
                        <Undo className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>İşlem Detayları</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label>İşlem Tipi</Label>
                <p className="text-slate-700">{getTypeLabel(selectedRecord.type)}</p>
              </div>
              <div>
                <Label>Tarih</Label>
                <p className="text-slate-700">
                  {new Date(selectedRecord.date).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <Label>Açıklama</Label>
                <p className="text-slate-700">{selectedRecord.description}</p>
              </div>
              {renderDetails(selectedRecord)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
