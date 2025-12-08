import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, CheckCircle2, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Page, ChecklistRecord, ChecklistPatient } from '../types';
import { storage } from '../utils/storage';
import { importChecklistFromExcel } from '../utils/excelUtils';
import { toast } from 'sonner@2.0.3';

interface ChecklistPageProps {
  onNavigate: (page: Page) => void;
}

export default function ChecklistPage({ onNavigate }: ChecklistPageProps) {
  const [activeChecklist, setActiveChecklist] = useState<ChecklistRecord | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [searchPatient, setSearchPatient] = useState('');

  useEffect(() => {
    // Aktif kontrol listesini yükle
    const checklist = storage.getActiveChecklist();
    setActiveChecklist(checklist);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const patients = await importChecklistFromExcel(file);
      
      if (patients.length === 0) {
        toast.error('Excel dosyasında hasta bulunamadı');
        return;
      }

      // Yeni kontrol listesi oluştur
      const newChecklist: ChecklistRecord = {
        id: Date.now().toString(),
        title: `Kontrol Listesi - ${new Date().toLocaleDateString('tr-TR')}`,
        createdDate: new Date().toISOString().split('T')[0],
        patients: patients,
        isCompleted: false,
      };

      storage.saveChecklist(newChecklist);
      setActiveChecklist(newChecklist);
      toast.success(`${patients.length} hasta başarıyla yüklendi`);
      
      // Input'u sıfırla
      setFileInputKey(prev => prev + 1);
    } catch (error) {
      toast.error('Excel dosyası yüklenirken hata oluştu');
      console.error(error);
    }
  };

  const handlePatientCheck = (patientId: string) => {
    if (!activeChecklist) return;

    const updatedPatients = activeChecklist.patients.map(p =>
      p.id === patientId ? { ...p, checked: !p.checked } : p
    );

    const updatedChecklist = {
      ...activeChecklist,
      patients: updatedPatients,
    };

    storage.updateChecklist(updatedChecklist);
    setActiveChecklist(updatedChecklist);
  };

  const handleComplete = () => {
    if (!activeChecklist) return;

    // Tamamlanmayan hastaları kontrol et
    const uncheckedPatients = activeChecklist.patients.filter(p => !p.checked);
    
    if (uncheckedPatients.length > 0) {
      const confirmed = window.confirm(
        `${uncheckedPatients.length} hastanın kontrolü yapılmadı. Yine de kaydetmek istiyor musunuz?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    const completedChecklist = {
      ...activeChecklist,
      isCompleted: true,
      completedDate: new Date().toISOString().split('T')[0],
    };

    storage.updateChecklist(completedChecklist);

    // Geçmişe kaydet
    storage.addHistory({
      id: Date.now().toString(),
      date: completedChecklist.completedDate!,
      type: 'checklist',
      description: `Kontrol listesi tamamlandı - ${checkedCount}/${totalCount} hasta kontrol edildi`,
      details: completedChecklist,
    });

    toast.success('Kontrol listesi tamamlandı ve geçmişe kaydedildi');
    setActiveChecklist(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Telefon numarası kopyalandı');
    }).catch(() => {
      toast.error('Kopyalama başarısız');
    });
  };

  const formatHospitalName = (name: string) => {
    // Büyük/küçük harf farkı gözetmeksizin tüm varyasyonları yakala
    return name.replace("EĞİTİM VE ARAŞTIRMA HASTANESİ", "EAH");
  };

  const formatPhoneNumber = (phone: string) => {
    // Başında 0 yoksa ekle
    const cleaned = phone.replace(/\D/g, ''); // Sadece rakamları al
    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      return '0' + cleaned;
    }
    return cleaned.startsWith('0') ? cleaned : '0' + cleaned;
  };

  const checkedCount = activeChecklist?.patients.filter(p => p.checked).length || 0;
  const totalCount = activeChecklist?.patients.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          <div className="flex-1">
            <h1 className="text-white">Kontrol Listesi</h1>
            {activeChecklist && (
              <p className="text-purple-100 text-sm">
                {checkedCount} / {totalCount} hasta kontrol edildi
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {!activeChecklist ? (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-slate-800 mb-2">Kontrol Listesi Yükle</h2>
                <p className="text-slate-600 mb-6">
                  Excel dosyanızdan hasta listesini içe aktarın
                </p>
              </div>
              
              <div>
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md px-4 py-2 bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Excel Dosyası Seç
                </Label>
                <Input
                  key={fileInputKey}
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Özet Bilgi */}
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-800">{activeChecklist.title}</h3>
                  <p className="text-slate-600 text-sm">
                    Başlangıç: {new Date(activeChecklist.createdDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-purple-600">
                    {checkedCount}/{totalCount}
                  </div>
                  <p className="text-sm text-slate-600">Tamamlanan</p>
                </div>
              </div>
            </Card>

            {/* Hasta Listesi */}
            <div className="space-y-3">
              <Input
                placeholder="İsim ara..."
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
              />
              {activeChecklist.patients
                .filter((patient) =>
                  patient.name.toLowerCase().includes(searchPatient.toLowerCase())
                )
                .map((patient, index) => (
                <Card
                  key={patient.id}
                  className={`p-4 transition-colors ${
                    patient.checked ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={patient.id}
                      checked={patient.checked}
                      onCheckedChange={() => handlePatientCheck(patient.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-slate-500">#{index + 1}</span>
                        <Label
                          htmlFor={patient.id}
                          className={`cursor-pointer ${
                            patient.checked ? 'line-through text-slate-500' : 'text-slate-800'
                          }`}
                        >
                          {patient.name}
                        </Label>
                        {patient.checked && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mt-2">
                        {patient.hospital && (
                          <div>
                            <span className="text-slate-500">Hastane:</span> {formatHospitalName(patient.hospital)}
                          </div>
                        )}
                        {patient.phone && (
                          <div
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => copyToClipboard(formatPhoneNumber(patient.phone!))}
                            title="Kopyalamak için tıklayın"
                          >
                            <span className="text-slate-500">Tel:</span> {formatPhoneNumber(patient.phone)}
                          </div>
                        )}
                        {patient.time && (
                          <div>
                            <span className="text-slate-500">Saat:</span> {patient.time}
                          </div>
                        )}
                        {patient.note && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Not:</span> {patient.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Tamamla Butonu */}
            <div className="sticky bottom-4 pt-4">
              <Button
                onClick={handleComplete}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Kontrolü Tamamla ve Kaydet
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
