import React, { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Info,
  LogOut,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Page } from "@/types";
import { storage } from "@/utils/storage";
import { toast } from "sonner@2.0.3";
import { stockService } from "@/services/stockService";
import { historyService } from "@/services/historyService";
import { userService } from "@/services/userService";

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
  const [storageInfo, setStorageInfo] = useState({
    stockCount: 0,
    casesCount: 0,
    historyCount: 0,
  });
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);

  const checkConnection = async () => {
    setDbStatus('checking');
    try {
      // Use the dedicated health endpoint
      const response = await fetch('/api/health');
      if (response.ok) {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
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
      const user = storage.getUser();
      await stockService.deleteAll(user?.id);
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
        const user = storage.getUser();
        // Clear everything from Backend Database
        await stockService.deleteAll(user?.id);
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.oldPassword) {
      toast.error('Mevcut şifrenizi girmelisiniz');
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 4) {
      toast.error('Yeni şifre en az 4 karakter olmalıdır');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('Yeni şifre eskisiyle aynı olamaz');
      return;
    }

    try {
      setPasswordLoading(true);
      const user = storage.getUser();
      if (!user) {
        toast.error('Kullanıcı bulunamadı');
        return;
      }

      await userService.changePassword(
        user.id,
        passwordData.oldPassword,
        passwordData.newPassword
      );

      toast.success('Şifreniz başarıyla değiştirildi');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Şifre değiştirilemedi');
    } finally {
      setPasswordLoading(false);
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

        {/* Şifre Değiştir */}
        <Card className="p-6">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}>
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h2 className="text-slate-800 font-medium">
                  Şifre Değiştir
                </h2>
                <p className="text-slate-600 text-sm">
                  Hesabınızın güvenliği için güçlü bir şifre seçin
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {isPasswordExpanded ? (
                <span className="text-slate-500">Kapat</span>
              ) : (
                <span className="text-blue-600 font-medium">Değiştir</span>
              )}
            </Button>
          </div>

          {isPasswordExpanded && (
            <div className="mt-4 pt-4 border-t">
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <Label htmlFor="oldPassword" class Name="text-sm">Mevcut Şifre</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    placeholder="Mevcut şifreniz"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" class Name="text-sm">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Yeni şifreniz (en az 4 karakter)"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" class Name="text-sm">Yeni Şifre Tekrar</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Yeni şifrenizi tekrar girin"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </Button>
              </form>
            </div>
          )}
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

        {/* Senkronizasyon - NEW */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-800 font-medium flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Veri Senkronizasyonu
            </h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Çevrimdışı yapılan işlemleri sunucuya gönder ve güncel verileri al.
          </p>
          <Button
            className="w-full"
            onClick={async () => {
              const toastId = toast.loading('Senkronizasyon yapılıyor...');
              try {
                const result = await import('../services/syncService').then(m => m.syncService.sync());
                toast.dismiss(toastId);
                toast.success(`Senkronizasyon tamamlandı. (Gönderilen: ${result.pushed}, Alınan: ${result.pulled ? 'Evet' : 'Hayır'})`);
                // Refresh local stats
                setStorageInfo(await getStorageInfo());
              } catch (error) {
                toast.dismiss(toastId);
                toast.error('Senkronizasyon başarısız oldu');
              }
            }}
          >
            Şimdi Senkronize Et
          </Button>
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

        {/* Uygulama Bilgisi - Moved to bottom */}
        <Card className="p-6">
          <div className="flex items-center gap-3 justify-center">
            <Info className="w-4 h-4 text-slate-400" />
            <p className="text-slate-500 text-sm">
              Yazılım Versiyonu: <strong>3.7</strong>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}