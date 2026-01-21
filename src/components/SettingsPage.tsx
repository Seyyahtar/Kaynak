import React from "react";
import {
  ArrowLeft,
  Trash2,
  Info,
  LogOut,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Page } from "../types";
import { storage } from "../utils/storage";
import { toast } from "sonner@2.0.3";
import { stockService } from "../services/stockService";
import { historyService } from "../services/historyService";

interface SettingsPageProps {
  onNavigate: (page: Page) => void;
  currentUser: string;
  onLogout: () => void;
}

export default function SettingsPage({
  onNavigate,
  currentUser,
  onLogout,
}: SettingsPageProps) {
  const [storageInfo, setStorageInfo] = React.useState({
    stockCount: 0,
    casesCount: 0,
    historyCount: 0,
  });
  const [dbStatus, setDbStatus] = React.useState<'connected' | 'disconnected' | 'checking'>('checking');

  const checkConnection = async () => {
    setDbStatus('checking');
    try {
      await stockService.getAll();
      setDbStatus('connected');
    } catch (error) {
      console.error("Bağlantı kontrolü başarısız", error);
      setDbStatus('disconnected');
    }
  };

  async function getStorageInfo() {
    const stock = await storage.getStock();
    const cases = await storage.getCases();
    const history = await storage.getHistory();

    return {
      stockCount: stock.length,
      casesCount: cases.length,
      historyCount: history.length,
    };
  }

  const handleClearStock = async () => {
    if (
      window.confirm(
        "Tüm stok kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      )
    ) {
      await stockService.deleteAll();
      await storage.saveStock([]); // Clear local storage as well
      toast.success("Tüm stok kayıtları temizlendi");
      const info = await getStorageInfo();
      setStorageInfo(info);
    }
  };

  const handleClearHistory = async () => {
    if (
      window.confirm(
        "Tüm geçmiş kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      )
    ) {
      await historyService.deleteAll();
      localStorage.setItem("medical_inventory_history", JSON.stringify([])); // Clear local storage as well for safety
      toast.success("Tüm geçmiş kayıtları temizlendi");
      const info = await getStorageInfo();
      setStorageInfo(info);
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        "Tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      )
    ) {
      try {
        // Clear everything from Backend Database
        await stockService.deleteAll();
        await historyService.deleteAll(); // This also clears cases in our new backend implementation

        // Clear local storage
        localStorage.clear();
        storage.clearUser();

        toast.success("Tüm veriler veritabanından ve yerel depolamadan başarıyla silindi");
        onLogout();
      } catch (error) {
        console.error("Veri temizleme hatası", error);
        toast.error("Bazı veriler silinemedi. Lütfen bağlantıyı kontrol edin.");
      }
    }
  };

  const handleLogout = () => {
    if (
      window.confirm(
        "Çıkış yapmak istediğinizden emin misiniz?",
      )
    ) {
      storage.clearUser();
      toast.success("Başarıyla çıkış yapıldı");
      onLogout();
    }
  };

  React.useEffect(() => {
    const loadInfo = async () => {
      const info = await getStorageInfo();
      setStorageInfo(info);
    };
    loadInfo();

    // Check DB connection
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-600 text-white p-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("home")}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-white">Ayarlar</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Kullanıcı Bilgisi */}
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <User className="w-5 h-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <h2 className="text-slate-800 mb-2">
                Kullanıcı Bilgisi
              </h2>
              <p className="text-slate-600">
                Giriş Yapan: <strong>{currentUser}</strong>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </Card>

        {/* Veritabanı Durumu - NEW */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dbStatus === 'checking' && <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />}
              {dbStatus === 'connected' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {dbStatus === 'disconnected' && <XCircle className="w-5 h-5 text-red-500" />}

              <div>
                <h2 className="text-slate-800 font-medium">Veritabanı Durumu</h2>
                <p className={`text-sm ${dbStatus === 'connected' ? 'text-green-600' :
                  dbStatus === 'disconnected' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                  {dbStatus === 'connected' ? 'Bağlantı Başarılı' :
                    dbStatus === 'disconnected' ? 'Bağlantı Hatası' : 'Kontrol Ediliyor...'}
                </p>
              </div>
            </div>

            {dbStatus === 'disconnected' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={checkConnection}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Tekrar Dene
              </Button>
            )}
          </div>
        </Card>

        {/* Uygulama Bilgisi */}
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h2 className="text-slate-800 mb-2">
                Uygulama Hakkında
              </h2>
              <p className="text-slate-600">
                Medikal Envanter Yönetimi v1.0
              </p>
              <p className="text-slate-500 mt-2">
                Bu uygulama medikal envanter takibi ve vaka
                yönetimi için tasarlanmıştır.
              </p>
            </div>
          </div>
        </Card>

        {/* Veri İstatistikleri */}
        <Card className="p-6">
          <h2 className="text-slate-800 mb-4">
            Veri İstatistikleri
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">
                Stok Kalemleri:
              </span>
              <span className="text-slate-800">
                {storageInfo.stockCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                Vaka Kayıtları:
              </span>
              <span className="text-slate-800">
                {storageInfo.casesCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                Geçmiş Kayıtları:
              </span>
              <span className="text-slate-800">
                {storageInfo.historyCount}
              </span>
            </div>
          </div>
        </Card>

        {/* Veri Yönetimi */}
        <Card className="p-6">
          <h2 className="text-slate-800 mb-4">Veri Yönetimi</h2>
          <div className="space-y-3">
            {/* Stok Temizle */}
            <div>
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={handleClearStock}
                disabled={storageInfo.stockCount === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Stok Kayıtlarını Temizle
              </Button>
              <p className="text-slate-500 mt-1 text-xs">
                Tüm stok kayıtlarını siler (
                {storageInfo.stockCount} kayıt)
              </p>
            </div>

            {/* Geçmiş Temizle */}
            <div>
              <Button
                variant="outline"
                className="w-full border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                onClick={handleClearHistory}
                disabled={storageInfo.historyCount === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Geçmiş Kayıtlarını Temizle
              </Button>
              <p className="text-slate-500 mt-1 text-xs">
                Tüm geçmiş kayıtlarını siler (
                {storageInfo.historyCount} kayıt)
              </p>
            </div>

            {/* Ayırıcı */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Tüm Verileri Temizle */}
            <div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleClearData}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tüm Verileri Temizle
              </Button>
              <p className="text-slate-500 mt-1 text-xs">
                Tüm stok, vaka, geçmiş ve kullanıcı verilerini
                siler
              </p>
            </div>
          </div>
        </Card>

        {/* Notlar */}
        <Card className="p-6 bg-blue-50">
          <h2 className="text-slate-800 mb-2">Not</h2>
          <p className="text-slate-600">
            Verileriniz tarayıcınızın yerel depolama alanında
            saklanmaktadır. Tarayıcı verilerini temizlerseniz
            tüm kayıtlarınız silinecektir.
          </p>
        </Card>
      </div>
    </div>
  );
}