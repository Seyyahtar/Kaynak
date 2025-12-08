import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import StockPage from './components/StockPage';
import StockManagement from './components/StockManagement';
import CaseEntry from './components/CaseEntry';
import ChecklistPage from './components/ChecklistPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import { Page, StockItem } from './types';
import { storage } from './utils/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [prefillData, setPrefillData] = useState<StockItem | null>(null);

  useEffect(() => {
    // Kullanıcı girişi kontrolü
    const user = storage.getUser();
    if (user) {
      setCurrentUser(user.username);
    }
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
    if (page === 'stock-management' && data) {
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
        return <StockPage onNavigate={handleNavigate} currentUser={currentUser} />;
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
