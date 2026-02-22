import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import StockManagement from './pages/StockManagement';
import CaseEntry from './pages/CaseEntry';
import ChecklistPage from './pages/ChecklistPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import AddUserPage from './pages/AddUserPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageUserDetailPage from './pages/ManageUserDetailPage';
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import CustomFieldsPage from './pages/CustomFieldsPage';
import ExcelImportPage from './pages/ExcelImportPage';
import { Page, StockItem } from './types';
import { storage } from './utils/storage';
import { App as CapacitorApp } from '@capacitor/app';
import { APP_CONFIG } from './config';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [prefillData, setPrefillData] = useState<any>(null);

  useEffect(() => {
    // Kullanıcı girişi kontrolü
    const user = storage.getUser();
    if (user) {
      setCurrentUser(user.username);
    }
  }, []);

  useEffect(() => {
    // Android geri butonu için listener
    let listenerHandle: any;

    CapacitorApp.addListener('backButton', () => {
      if (currentPage !== 'home') {
        setCurrentPage('home');
      } else {
        CapacitorApp.exitApp();
      }
    }).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [currentPage]);

  useEffect(() => {
    // Auto-sync when coming back online
    const handleOnline = async () => {
      console.log("Back online, starting sync...");
      const toastId = toast.loading('İnternet bağlantısı algılandı. Senkronizasyon yapılıyor...');
      try {
        const { syncService } = await import('./services/syncService');
        const result = await syncService.sync();
        toast.dismiss(toastId);
        if (result.pushed > 0 || result.pulled) {
          toast.success(`Otomatik senkronizasyon tamamlandı. (Gönderilen: ${result.pushed})`);
        } else {
          toast.success('Senkronizasyon: Güncel');
        }
      } catch (error) {
        toast.dismiss(toastId);
        console.error("Auto-sync failed", error);
        toast.error('Otomatik senkronizasyon başarısız');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Version Check Effect
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          const serverVersion = data.version; // e.g., "3.7"
          const appVersion = APP_CONFIG.VERSION;

          if (serverVersion && serverVersion > appVersion) {
            toast.info(`Yeni sürüm mevcut: ${serverVersion}`, {
              action: {
                label: 'Güncelle',
                onClick: () => setCurrentPage('settings')
              },
              duration: 10000, // Show for 10 seconds
            });
            // You might want to store this in state or context if you want the "Update" badge in Settings to persist
            localStorage.setItem('latest_version', serverVersion);
          }
        }
      } catch (error) {
        console.error("Version check failed", error);
      }
    };

    // Check after a small delay to let app load
    const timer = setTimeout(checkVersion, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setPrefillData(null);
  };

  const handleNavigate = (page: Page, data?: any) => {
    if ((page === 'stock-management' || page === 'product-form' || page === 'excel-import' || page === 'manage-user-detail') && data) {
      setPrefillData(data);
    } else {
      setPrefillData(null);
    }
    setCurrentPage(page);
  };

  // Kullanıcı giriş yapmamışsa login ekranını göster
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster position="top-center" />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'stock':
        return <StockPage onNavigate={handleNavigate} currentUser={currentUser} mode="view" />;
      case 'stock-selection':
        return <StockPage onNavigate={handleNavigate} currentUser={currentUser} mode="select" />;
      case 'stock-management':
        return <StockManagement onNavigate={handleNavigate} currentUser={currentUser} prefillData={prefillData} />;
      case 'case-entry':
        return <CaseEntry onNavigate={handleNavigate} />;
      case 'checklist':
        return <ChecklistPage onNavigate={handleNavigate} />;
      case 'history':
        return <HistoryPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} currentUser={currentUser} onLogout={handleLogout} />;
      case 'admin-panel':
        return <AdminPanelPage onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'add-user':
        return <AddUserPage onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'manage-users':
        return <ManageUsersPage onNavigate={handleNavigate} currentUser={currentUser} />;
      case 'manage-user-detail':
        return <ManageUserDetailPage onNavigate={handleNavigate} currentUser={currentUser} user={prefillData?.user} />;
      case 'product-list':
        return <ProductListPage onNavigate={handleNavigate} />;
      case 'product-form':
        return <ProductFormPage onNavigate={handleNavigate} editProduct={prefillData?.product} />;
      case 'custom-fields':
        return <CustomFieldsPage onNavigate={handleNavigate} />;
      case 'excel-import':
        return <ExcelImportPage onNavigate={handleNavigate} importData={prefillData} />;
      default:
        return <HomePage onNavigate={handleNavigate} currentUser={currentUser} />;
    }
  };

  return (
    <>
      {renderPage()}
      <Toaster position="top-center" />
    </>
  );
}
